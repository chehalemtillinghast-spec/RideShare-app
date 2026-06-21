import express from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// In-app emergency alert: logs the alert and surfaces it to admins + the
// user's emergency contacts (if they're also app users we could look up by
// phone/email match, but Phase 1 keeps this purely in-app/admin-visible).
router.post('/', requireAuth, async (req, res) => {
  const { ride_id, message } = req.body;
  const result = await pool.query(
    `INSERT INTO emergency_alerts (user_id, ride_id, message) VALUES ($1, $2, $3) RETURNING *`,
    [req.user.id, ride_id || null, message || null]
  );
  const contacts = await pool.query('SELECT * FROM emergency_contacts WHERE user_id = $1', [req.user.id]);
  res.status(201).json({ alert: result.rows[0], emergency_contacts: contacts.rows });
});

router.get('/active', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT ea.*, u.full_name, u.phone FROM emergency_alerts ea
     JOIN users u ON u.id = ea.user_id WHERE ea.status = 'active' ORDER BY ea.created_at DESC`
  );
  res.json(result.rows);
});

router.patch('/:id/resolve', requireAuth, async (req, res) => {
  const result = await pool.query(
    `UPDATE emergency_alerts SET status = 'resolved' WHERE id = $1 AND user_id = $2 RETURNING *`,
    [req.params.id, req.user.id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'Alert not found.' });
  res.json(result.rows[0]);
});

export default router;
