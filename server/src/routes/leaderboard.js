import express from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// "Rides offered" = rides a user created as a driver (excluding cancelled).
// "Rides taken" = rides a user successfully joined as a passenger (accepted ride_requests).
async function topRiders(since) {
  const result = await pool.query(
    `WITH offered AS (
       SELECT creator_id AS user_id, COUNT(*) AS cnt FROM rides
       WHERE creator_role = 'driver' AND status <> 'cancelled' AND created_at >= $1
       GROUP BY creator_id
     ), taken AS (
       SELECT requester_id AS user_id, COUNT(*) AS cnt FROM ride_requests
       WHERE status = 'accepted' AND created_at >= $1
       GROUP BY requester_id
     )
     SELECT u.id, u.full_name, u.verification_status,
            COALESCE(o.cnt, 0) AS rides_offered,
            COALESCE(t.cnt, 0) AS rides_taken
     FROM users u
     LEFT JOIN offered o ON o.user_id = u.id
     LEFT JOIN taken t ON t.user_id = u.id
     WHERE COALESCE(o.cnt, 0) > 0 OR COALESCE(t.cnt, 0) > 0
     ORDER BY rides_offered DESC, rides_taken DESC
     LIMIT 20`,
    [since]
  );
  return result.rows;
}

router.get('/', requireAuth, async (req, res) => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const epoch = new Date(0);
  const [weekly, allTime] = await Promise.all([topRiders(weekAgo), topRiders(epoch)]);
  res.json({ weekly, all_time: allTime });
});

export default router;
