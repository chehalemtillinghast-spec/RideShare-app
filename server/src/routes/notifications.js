import express from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY acknowledged_at IS NULL DESC, created_at DESC LIMIT 50`,
    [req.user.id]
  );
  res.json(result.rows);
});

router.get('/unacknowledged-count', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND acknowledged_at IS NULL`,
    [req.user.id]
  );
  res.json({ count: Number(result.rows[0].count) });
});

router.patch('/:id/acknowledge', requireAuth, async (req, res) => {
  const result = await pool.query(
    `UPDATE notifications SET acknowledged_at = now() WHERE id = $1 AND user_id = $2 RETURNING *`,
    [req.params.id, req.user.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Notification not found.' });
  res.json(result.rows[0]);
});

router.patch('/acknowledge-all', requireAuth, async (req, res) => {
  await pool.query(
    `UPDATE notifications SET acknowledged_at = now() WHERE user_id = $1 AND acknowledged_at IS NULL`,
    [req.user.id]
  );
  res.json({ ok: true });
});

export default router;
