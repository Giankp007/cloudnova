'use strict';
const os = require('os');
const router = require('express').Router();
const pool = require('../db');

// GET /health – Zustand des Backends inkl. Datenbankverbindung.
router.get('/', async (_req, res) => {
  const base = { service: 'cloudnova-backend', instance: os.hostname(), uptime_s: Math.round(process.uptime()) };
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'up', ...base });
  } catch (err) {
    console.error('Health-Check: Datenbank nicht erreichbar:', err.message);
    res.status(503).json({ status: 'degraded', database: 'down', ...base });
  }
});

module.exports = router;
