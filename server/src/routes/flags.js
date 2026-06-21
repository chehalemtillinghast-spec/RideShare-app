import express from 'express';
import { pool } from '../db/pool.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  const { reported_user_id, ride_id, reason, details } = req.body;
  if (!reason) return res.status(400).json({ error: 'reason is required.' });
  const result = await pool.query(
    `INSERT INTO flags (reporter_id, reported_user_id, ride_id, reason, details)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.user.id, reported_user_id || null, ride_id || null, reason, details || null]
  );
  res.status(201).json(result.rows[0]);
});

router.get('/', requireAuth, requireAdmin, async (req, res) => {
  const result = await pool.query(
    `SELECT f.*, reporter.full_name AS reporter_name, reported.full_name AS reported_name
     FROM flags f
     JOIN users reporter ON reporter.id = f.reporter_id
     LEFT JOIN users reported ON reported.id = f.reported_user_id
     ORDER BY f.created_at DESC`
  );
  res.json(result.rows);
});

router.patch('/:id', requireAuth, requireAdmin, async (req, res) => {
  const { status } = req.body;
  if (!['open', 'reviewed', 'resolved', 'dismissed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  const result = await pool.query('UPDATE flags SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
  res.json(result.rows[0]);
});

export default router;
