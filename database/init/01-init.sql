-- CloudNova – Schema und Beispieldaten
-- Wird von der PostgreSQL-Entrypoint-Logik NUR beim ersten Start mit leerem Volume ausgeführt.
-- Danach bleiben die Daten im Docker Volume "db_data" erhalten (Idempotenz).

CREATE TABLE IF NOT EXISTS products (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(120)  NOT NULL,
    description TEXT          NOT NULL,
    price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    category    VARCHAR(60)   NOT NULL,
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);

INSERT INTO products (name, description, price, category) VALUES
 ('Nova Compute S',      'Virtueller Server mit 2 vCPU, 4 GB RAM und 80 GB SSD für kleine Webprojekte.',            14.90, 'Compute'),
 ('Nova Compute M',      'Virtueller Server mit 4 vCPU, 16 GB RAM und 200 GB SSD für produktive Anwendungen.',      49.00, 'Compute'),
 ('Nova Compute XL',     'Leistungsstarker Server mit 16 vCPU, 64 GB RAM und 1 TB NVMe für rechenintensive Lasten.', 189.00, 'Compute'),
 ('Nova Object Storage', 'S3-kompatibler Objektspeicher, 1 TB inklusive, Standort Schweiz.',                        19.00, 'Storage'),
 ('Nova Block Volume',   'Hochverfügbares Block-Storage-Volume mit täglichen Snapshots, 500 GB.',                   25.50, 'Storage'),
 ('Nova Backup Vault',   'Verschlüsselte, unveränderbare Backups mit 30 Tagen Aufbewahrung.',                       12.00, 'Storage'),
 ('Nova Managed Postgres','Verwaltete PostgreSQL-16-Datenbank mit automatischen Updates und Point-in-Time-Recovery.', 59.90, 'Datenbank'),
 ('Nova Redis Cache',    'In-Memory-Cache mit 8 GB Kapazität für schnelle Antwortzeiten.',                         29.90, 'Datenbank'),
 ('Nova Private Link',   'Sichere Overlay-Verbindung (WireGuard-basiert) zwischen Standorten und Laptops.',         9.90, 'Netzwerk'),
 ('Nova Load Balancer',  'Layer-7-Lastverteiler mit Health-Checks und automatischem Failover.',                    22.00, 'Netzwerk'),
 ('Nova Firewall Shield','Verwaltete Firewall mit Geo-Blocking und Intrusion Detection.',                          34.00, 'Sicherheit'),
 ('Nova Secrets Manager','Zentrale, verschlüsselte Ablage für Passwörter, Zertifikate und API-Schlüssel.',          15.00, 'Sicherheit'),
 ('Nova Monitoring Plus','Metriken, Logs und Alarmierung für alle Container und Server auf einem Dashboard.',      18.50, 'Betrieb');
