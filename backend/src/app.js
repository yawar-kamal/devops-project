const express = require('express');
const cors = require('cors');
const { pool } = require('./db');

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', async (_req, res) => {
    try {
      await pool.query('SELECT 1');
      res.json({ status: 'ok', db: 'up' });
    } catch (err) {
      res.status(503).json({ status: 'degraded', db: 'down', error: err.message });
    }
  });

  app.get('/api/todos', async (_req, res, next) => {
    try {
      const { rows } = await pool.query(
        'SELECT id, title, completed, created_at FROM todos ORDER BY id DESC'
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/todos', async (req, res, next) => {
    try {
      const title = (req.body && req.body.title ? String(req.body.title) : '').trim();
      if (!title) {
        return res.status(400).json({ error: 'title is required' });
      }
      const { rows } = await pool.query(
        'INSERT INTO todos (title) VALUES ($1) RETURNING id, title, completed, created_at',
        [title]
      );
      return res.status(201).json(rows[0]);
    } catch (err) {
      return next(err);
    }
  });

  app.put('/api/todos/:id', async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });

      const { title, completed } = req.body || {};
      const { rows } = await pool.query(
        `UPDATE todos
           SET title     = COALESCE($1, title),
               completed = COALESCE($2, completed)
         WHERE id = $3
         RETURNING id, title, completed, created_at`,
        [title ?? null, typeof completed === 'boolean' ? completed : null, id]
      );
      if (rows.length === 0) return res.status(404).json({ error: 'not found' });
      return res.json(rows[0]);
    } catch (err) {
      return next(err);
    }
  });

  app.delete('/api/todos/:id', async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id)) return res.status(400).json({ error: 'invalid id' });
      const result = await pool.query('DELETE FROM todos WHERE id = $1', [id]);
      if (result.rowCount === 0) return res.status(404).json({ error: 'not found' });
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, _req, res, _next) => {
    // eslint-disable-next-line no-console
    console.error(err);
    res.status(500).json({ error: 'internal server error' });
  });

  return app;
}

module.exports = { createApp };
