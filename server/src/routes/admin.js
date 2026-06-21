import express from 'express';
import { pool } from '../db/pool.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get('/stats', async (req, res) => {
  const [users, rides, flags, alerts] = await Promise.all([
    pool.query('SELECT COUNT(*) FROM users'),
    pool.query('SELECT COUNT(*) FROM rides'),
    pool.query("SELECT COUNT(*) FROM flags WHERE status = 'open'"),
    pool.query("SELECT COUNT(*) FROM emergency_alerts WHERE status = 'active'"),
  ]);
  res.json({
    total_users: Number(users.rows[0].count),
    total_rides: Number(rides.rows[0].count),
    open_flags: Number(flags.rows[0].count),
    active_alerts: Number(alerts.rows[0].count),
  });
});

router.get('/users', async (req, res) => {
  const result = await pool.query(
    'SELECT id, email, full_name, role, verification_status, is_suspended, created_at FROM users ORDER BY created_at DESC'
  );
  res.json(result.rows);
});

router.patch('/users/:id/suspend', async (req, res) => {
  const { suspended } = req.body;
  const result = await pool.query(
    'UPDATE users SET is_suspended = $1 WHERE id = $2 RETURNING id, email, is_suspended',
    [!!suspended, req.params.id]
  );
  res.json(result.rows[0]);
});

router.patch('/users/:id/verify', async (req, res) => {
  const { status } = req.body; // unverified | pending | verified
  if (!['unverified', 'pending', 'verified'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  const result = await pool.query(
    'UPDATE users SET verification_status = $1 WHERE id = $2 RETURNING id, email, verification_status',
    [status, req.params.id]
  );
  res.json(result.rows[0]);
});

router.get('/rides', async (req, res) => {
  const result = await pool.query(
    `SELECT r.*, u.full_name AS creator_name FROM rides r JOIN users u ON u.id = r.creator_id ORDER BY r.created_at DESC`
  );
  res.json(result.rows);
});

// Emergency contacts that couldn't be matched to a registered user when an
// alert fired — these need a manual follow-up since no in-app/push
// notification could be delivered.
router.get('/unreachable-contacts', async (req, res) => {
  const result = await pool.query(
    `SELECT ar.id AS alert_recipient_id, ar.created_at,
            ea.id AS alert_id, ea.message AS alert_message, ea.status AS alert_status,
            triggerer.id AS triggerer_id, triggerer.full_name AS triggerer_name, triggerer.phone AS triggerer_phone,
            ec.name AS contact_name, ec.phone AS contact_phone, ec.email AS contact_email, ec.relationship
     FROM alert_recipients ar
     JOIN emergency_alerts ea ON ea.id = ar.alert_id
     JOIN users triggerer ON triggerer.id = ea.user_id
     JOIN emergency_contacts ec ON ec.id = ar.contact_id
     WHERE ar.matched_user_id IS NULL
     ORDER BY ar.created_at DESC`
  );
  res.json(result.rows);
});

export default router;
