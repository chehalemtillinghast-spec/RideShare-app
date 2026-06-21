import express from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  const { ride_id, ratee_id, score, comment } = req.body;
  if (!ride_id || !ratee_id || !score) {
    return res.status(400).json({ error: 'ride_id, ratee_id, and score are required.' });
  }
  if (score < 1 || score > 5) return res.status(400).json({ error: 'score must be between 1 and 5.' });
  if (Number(ratee_id) === req.user.id) return res.status(400).json({ error: 'You cannot rate yourself.' });

  try {
    const result = await pool.query(
      `INSERT INTO ratings (ride_id, rater_id, ratee_id, score, comment)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [ride_id, req.user.id, ratee_id, score, comment || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'You already rated this person for this ride.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Failed to submit rating.' });
  }
});

router.get('/user/:userId', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT r.*, u.full_name AS rater_name FROM ratings r
     JOIN users u ON u.id = r.rater_id
     WHERE r.ratee_id = $1 ORDER BY r.created_at DESC`,
    [req.params.userId]
  );
  res.json(result.rows);
});

export default router;
