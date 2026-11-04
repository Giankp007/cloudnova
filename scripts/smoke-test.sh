#!/usr/bin/env bash
# CloudNova – automatisierter Smoke-Test (Git Bash / Linux / macOS)
# Aufruf im Projektordner:  bash scripts/smoke-test.sh
cd "$(dirname "$0")/.." || exit 1
BASE="http://localhost:${FRONTEND_PORT:-8080}"
PASS=0; FAIL=0
check() { # Beschreibung, Bedingung (0 = ok)
  if [ "$2" -eq 0 ]; then echo "  [OK]   $1"; PASS=$((PASS+1)); else echo "  [FAIL] $1"; FAIL=$((FAIL+1)); fi
}
code() { curl -s -o /dev/null -w '%{http_code}' "$1"; }
set -a; . ./.env; set +a

echo "== Container & Healthchecks =="
for s in database backend frontend; do
  st=$(docker compose ps --format '{{.Health}}' "$s" | head -1)
  [ "$st" = "healthy" ]; check "Service $s ist healthy ($st)" $?
done

echo "== Frontend =="
[ "$(code $BASE/)" = 200 ]; check "Startseite HTTP 200" $?
curl -s $BASE/ | grep -q "CloudNova"; check "Startseite enthält Branding" $?
[ "$(code $BASE/nginx-health)" = 200 ]; check "Nginx-Health HTTP 200" $?

echo "== Backend / API (über Nginx-Proxy) =="
[ "$(code $BASE/api/health)" = 200 ]; check "GET /api/health HTTP 200" $?
n=$(curl -s $BASE/api/products | grep -o '"count":[0-9]*' | cut -d: -f2)
[ "${n:-0}" -ge 10 ]; check "GET /api/products liefert >= 10 Produkte (${n:-0})" $?
curl -s "$BASE/api/products?search=postgres" | grep -q "Managed Postgres"; check "Suche 'postgres' findet Nova Managed Postgres" $?
n=$(curl -s "$BASE/api/products?search=zzzzzz" | grep -o '"count":[0-9]*' | cut -d: -f2)
[ "$n" = "0" ]; check "Suche ohne Treffer liefert count 0" $?
curl -s "$BASE/api/products?category=Storage" | grep -q '"category":"Storage"'; check "Kategorie-Filter funktioniert" $?
[ "$(code $BASE/api/products/1)" = 200 ]; check "GET /api/products/1 HTTP 200" $?
[ "$(code $BASE/api/products/99999)" = 404 ]; check "Unbekannte ID -> HTTP 404" $?
[ "$(code $BASE/api/products/abc)" = 400 ]; check "Ungültige ID 'abc' -> HTTP 400" $?
[ "$(code "$BASE/api/products?search=%27%3B%20DROP%20TABLE%20products%3B--")" = 200 ]; check "SQL-Injection-Versuch wird sicher behandelt (HTTP 200)" $?
docker compose exec -T database psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT count(*) FROM products" | grep -qE '^[0-9]+$'; check "Tabelle products nach Injection-Versuch noch vorhanden" $?
[ "$(code $BASE/api/gibtsnicht)" = 404 ]; check "Unbekannter API-Pfad -> HTTP 404 (JSON)" $?

echo "== Datenbank & Sicherheit =="
docker compose exec -T database pg_isready -U "$POSTGRES_USER" >/dev/null; check "PostgreSQL erreichbar (pg_isready)" $?
c=$(docker compose exec -T database psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -tAc "SELECT count(*) FROM products" | tr -d '\r')
[ "${c:-0}" -ge 10 ]; check "Beispieldaten vorhanden ($c Zeilen)" $?
docker inspect cloudnova-database-1 --format '{{json .HostConfig.PortBindings}}' | grep -qE '^(null|\{\})$'; check "Port 5432 ist NICHT auf dem Host veröffentlicht" $?
(exec 3<>/dev/tcp/127.0.0.1/5432) 2>/dev/null; [ $? -ne 0 ]; check "Verbindung zu localhost:5432 schlägt fehl" $?
docker compose exec -T database env PGPASSWORD="$APP_DB_PASSWORD" psql -U "$APP_DB_USER" -d "$POSTGRES_DB" -c "DELETE FROM products" 2>&1 | grep -qi "permission denied"; check "App-Benutzer darf NICHT löschen (Least Privilege)" $?
docker network inspect cloudnova_database_net --format '{{.Internal}}' | grep -q true; check "database_net ist 'internal'" $?
docker compose exec -T frontend sh -c 'getent hosts database' >/dev/null 2>&1; [ $? -ne 0 ]; check "Frontend kann die Datenbank NICHT auflösen/erreichen" $?
git check-ignore -q .env 2>/dev/null; check ".env wird von Git ignoriert" $?
grep -rqE "POSTGRES_PASSWORD: *[A-Za-z0-9]{6,}" docker-compose.yml; [ $? -ne 0 ]; check "Keine hartcodierten Passwörter in docker-compose.yml" $?

echo
echo "Ergebnis: $PASS bestanden, $FAIL fehlgeschlagen"
[ "$FAIL" -eq 0 ]
