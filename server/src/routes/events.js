import express from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM events WHERE start_time >= now() - interval \'1 day\' ORDER BY start_time ASC');
  res.json(result.rows);
});

router.get('/:id', requireAuth, async (req, res) => {
  const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
  if (!eventResult.rows[0]) return res.status(404).json({ error: 'Event not found.' });
  const ridesResult = await pool.query(
    `SELECT r.*, u.full_name AS creator_name FROM rides r JOIN users u ON u.id = r.creator_id
     WHERE r.event_id = $1 ORDER BY r.created_at DESC`,
    [req.params.id]
  );
  res.json({ ...eventResult.rows[0], rides: ridesResult.rows });
});

router.post('/', requireAuth, async (req, res) => {
  const { title, description, location, start_time, end_time } = req.body;
  if (!title || !start_time) return res.status(400).json({ error: 'title and start_time are required.' });
  const result = await pool.query(
    `INSERT INTO events (title, description, location, start_time, end_time, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [title, description || null, location || null, start_time, end_time || null, req.user.id]
  );
  res.status(201).json(result.rows[0]);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
  const event = eventResult.rows[0];
  if (!event) return res.status(404).json({ error: 'Event not found.' });
  if (event.created_by !== req.user.id) return res.status(403).json({ error: 'Not your event.' });

  await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
  res.status(204).end();
});

export default router;
