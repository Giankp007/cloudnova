'use strict';
const { Pool } = require('pg');

// Alle Zugangsdaten kommen aus Umgebungsvariablen (siehe docker-compose.yml / .env).
const required = ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`Fehlende Umgebungsvariablen: ${missing.join(', ')}`);
  process.exit(1);
}

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 30000,
});

// Verhindert einen Prozessabsturz, wenn eine ruhende Verbindung abbricht (z. B. DB-Neustart).
pool.on('error', (err) => console.error('Unerwarteter Pool-Fehler:', err.message));

module.exports = pool;
