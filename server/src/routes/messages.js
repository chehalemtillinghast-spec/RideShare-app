import express from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// List conversations (grouped by counterpart + ride)
router.get('/conversations', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT DISTINCT ON (other_id, ride_id) *
     FROM (
       SELECT
         CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END AS other_id,
         ride_id, body, sender_id, created_at
       FROM messages
       WHERE sender_id = $1 OR recipient_id = $1
     ) sub
     ORDER BY other_id, ride_id, created_at DESC`,
    [req.user.id]
  );
  res.json(result.rows);
});

router.get('/thread', requireAuth, async (req, res) => {
  const { with: otherId, ride_id } = req.query;
  if (!otherId) return res.status(400).json({ error: 'with (user id) is required.' });
  const params = [req.user.id, otherId];
  let rideClause = '';
  if (ride_id) {
    params.push(ride_id);
    rideClause = `AND ride_id = $3`;
  }
  const result = await pool.query(
    `SELECT * FROM messages
     WHERE ((sender_id = $1 AND recipient_id = $2) OR (sender_id = $2 AND recipient_id = $1))
     ${rideClause}
     ORDER BY created_at ASC`,
    params
  );
  await pool.query(
    `UPDATE messages SET read_at = now() WHERE recipient_id = $1 AND sender_id = $2 AND read_at IS NULL`,
    [req.user.id, otherId]
  );
  res.json(result.rows);
});

router.post('/', requireAuth, async (req, res) => {
  const { recipient_id, body, ride_id } = req.body;
  if (!recipient_id || !body) return res.status(400).json({ error: 'recipient_id and body are required.' });
  const result = await pool.query(
    `INSERT INTO messages (ride_id, sender_id, recipient_id, body) VALUES ($1, $2, $3, $4) RETURNING *`,
    [ride_id || null, req.user.id, recipient_id, body]
  );
  res.status(201).json(result.rows[0]);
});

export default router;
