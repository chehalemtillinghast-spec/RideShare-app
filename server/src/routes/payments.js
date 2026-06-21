import express from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  const { ride_id, payee_id, amount, note } = req.body;
  if (!ride_id || !payee_id || !amount) {
    return res.status(400).json({ error: 'ride_id, payee_id, and amount are required.' });
  }
  const result = await pool.query(
    `INSERT INTO payments (ride_id, payer_id, payee_id, amount, note) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [ride_id, req.user.id, payee_id, amount, note || null]
  );
  res.status(201).json(result.rows[0]);
});

router.get('/ride/:rideId', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM payments WHERE ride_id = $1 ORDER BY created_at DESC', [req.params.rideId]);
  res.json(result.rows);
});

router.patch('/:id/confirm', requireAuth, async (req, res) => {
  const result = await pool.query(
    `UPDATE payments SET status = 'confirmed' WHERE id = $1 AND payee_id = $2 RETURNING *`,
    [req.params.id, req.user.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Payment not found or not yours to confirm.' });
  res.json(result.rows[0]);
});

export default router;
