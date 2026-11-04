'use strict';
const os = require('os');
const express = require('express');
const pool = require('./db');
const healthRouter = require('./routes/health');
const productsRouter = require('./routes/products');

const app = express();
app.disable('x-powered-by');

// Kennzeichnet, welche Container-Instanz geantwortet hat (hilfreich für die Skalierungs-Demo).
app.use((_req, res, next) => {
  res.set('X-Served-By', os.hostname());
  res.set('Cache-Control', 'no-store');
  next();
});

app.use('/health', healthRouter);
app.use('/api/health', healthRouter);
app.use('/api/products', productsRouter);

app.use((_req, res) => res.status(404).json({ error: 'Endpunkt nicht gefunden.' }));

// Zentrale Fehlerbehandlung: keine internen Details nach aussen.
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Fehler:', err.message);
  const dbDown = ['ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'EAI_AGAIN'].includes(err.code) ||
                 /timeout|terminated|Connection/i.test(err.message) || (err.code || '').startsWith('08');
  if (dbDown) return res.status(503).json({ error: 'Die Datenbank ist momentan nicht erreichbar. Bitte später erneut versuchen.' });
  res.status(500).json({ error: 'Interner Serverfehler.' });
});

const port = Number(process.env.PORT || 3000);
const server = app.listen(port, '0.0.0.0', () => console.log(`CloudNova-Backend läuft auf Port ${port} (Instanz ${os.hostname()})`));

// Sauberes Herunterfahren bei "docker stop" (SIGTERM).
function shutdown(signal) {
  console.log(`${signal} empfangen – fahre herunter …`);
  server.close(() => pool.end().finally(() => process.exit(0)));
  setTimeout(() => process.exit(1), 8000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
