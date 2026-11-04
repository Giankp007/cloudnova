'use strict';
const router = require('express').Router();
const pool = require('../db');

const COLUMNS = 'id, name, description, price::float8 AS price, category, created_at';

// GET /api/products?search=begriff&category=Compute
router.get('/', async (req, res, next) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search.trim().slice(0, 100) : '';
    const category = typeof req.query.category === 'string' ? req.query.category.trim().slice(0, 60) : '';
    const params = [];
    const where = [];
    if (search) {
      params.push(`%${search.replace(/[\%_]/g, '\$&')}%`);
      where.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length} OR category ILIKE $${params.length})`);
    }
    if (category) {
      params.push(category);
      where.push(`category = $${params.length}`);
    }
    const sql = `SELECT ${COLUMNS} FROM products${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY category, name`;
    const { rows } = await pool.query(sql, params);
    res.json({ count: rows.length, products: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/categories – Kategorien für den Filter
router.get('/categories', async (_req, res, next) => {
  try {
    const { rows } = await pool.query('SELECT DISTINCT category FROM products ORDER BY category');
    res.json({ categories: rows.map((r) => r.category) });
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res, next) => {
  if (!/^\d{1,9}$/.test(req.params.id) || Number(req.params.id) < 1) {
    return res.status(400).json({ error: 'Ungültige Produkt-ID: erwartet wird eine positive ganze Zahl.' });
  }
  try {
    const { rows } = await pool.query(`SELECT ${COLUMNS} FROM products WHERE id = $1`, [Number(req.params.id)]);
    if (rows.length === 0) return res.status(404).json({ error: 'Produkt nicht gefunden.' });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
