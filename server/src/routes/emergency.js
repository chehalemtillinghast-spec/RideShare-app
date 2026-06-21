import express from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { sendPushToUser } from '../utils/push.js';

const router = express.Router();

// Triggers an emergency alert: logs it for admins, resolves each of the
// triggering user's emergency contacts against the users table, and
// notifies (in-app + push) any contact who is a registered user. Contacts
// who aren't registered are recorded as "unreachable" so an admin can
// follow up manually.
router.post('/', requireAuth, async (req, res) => {
  const { ride_id, message } = req.body;

  const alertResult = await pool.query(
    `INSERT INTO emergency_alerts (user_id, ride_id, message) VALUES ($1, $2, $3) RETURNING *`,
    [req.user.id, ride_id || null, message || null]
  );
  const alert = alertResult.rows[0];

  const triggeringUser = await pool.query('SELECT full_name FROM users WHERE id = $1', [req.user.id]);
  const triggeringName = triggeringUser.rows[0]?.full_name || 'A Town Rides user';

  const contacts = await pool.query('SELECT * FROM emergency_contacts WHERE user_id = $1', [req.user.id]);

  const notifiedUserIds = [];
  const unreachableContacts = [];

  for (const contact of contacts.rows) {
    let matchedUserId = null;
    if (contact.phone || contact.email) {
      const matchResult = await pool.query(
        `SELECT id FROM users
         WHERE id <> $1 AND (
           (phone IS NOT NULL AND phone = $2) OR
           (email IS NOT NULL AND $3 IS NOT NULL AND email = LOWER($3))
         ) LIMIT 1`,
        [req.user.id, contact.phone || null, contact.email || null]
      );
      matchedUserId = matchResult.rows[0]?.id || null;
    }

    await pool.query(
      `INSERT INTO alert_recipients (alert_id, contact_id, matched_user_id) VALUES ($1, $2, $3)`,
      [alert.id, contact.id, matchedUserId]
    );

    if (matchedUserId) {
      const title = `Emergency alert from ${triggeringName}`;
      const body = message || `${triggeringName} has triggered an emergency alert and may need help.`;
      const notification = await pool.query(
        `INSERT INTO notifications (user_id, type, title, body, alert_id) VALUES ($1, 'emergency_alert', $2, $3, $4) RETURNING *`,
        [matchedUserId, title, body, alert.id]
      );
      sendPushToUser(matchedUserId, { title, body, notificationId: notification.rows[0].id }).catch(() => {});
      notifiedUserIds.push(matchedUserId);
    } else {
      unreachableContacts.push(contact);
    }
  }

  res.status(201).json({ alert, notified_user_ids: notifiedUserIds, unreachable_contacts: unreachableContacts });
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
