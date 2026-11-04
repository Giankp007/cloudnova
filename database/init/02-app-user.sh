#!/bin/sh
# Legt den eingeschränkten Anwendungs-Benutzer an (Least Privilege):
# Das Backend darf ausschliesslich lesen (SELECT) – kein INSERT/UPDATE/DELETE/DDL.
# Zugangsdaten stammen aus Umgebungsvariablen, nicht aus dem Code.
set -eu
psql -v ON_ERROR_STOP=1 \
     -v app_user="$APP_DB_USER" -v app_pw="$APP_DB_PASSWORD" -v db="$POSTGRES_DB" \
     --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<'SQL'
CREATE ROLE :"app_user" LOGIN PASSWORD :'app_pw'
    NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT CONNECT ON DATABASE :"db" TO :"app_user";
GRANT USAGE ON SCHEMA public TO :"app_user";
GRANT SELECT ON ALL TABLES IN SCHEMA public TO :"app_user";
SQL
echo "Anwendungs-Benutzer '$APP_DB_USER' (nur SELECT) angelegt."
