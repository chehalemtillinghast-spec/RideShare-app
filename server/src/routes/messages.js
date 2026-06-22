import express from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { emitToUser } from '../socket.js';
import { sendPushToUser } from '../utils/push.js';

const router = express.Router();

// List conversations (grouped by counterpart + ride), newest first, with
// the other party's name and how many unread messages are in each thread.
router.get('/conversations', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT DISTINCT ON (sub.other_id, sub.ride_id)
       sub.other_id, u.full_name AS other_name, u.verification_status AS other_verification,
       sub.ride_id, sub.body AS last_body, sub.sender_id AS last_sender_id, sub.created_at AS last_message_at,
       (SELECT COUNT(*) FROM messages m2
          WHERE m2.recipient_id = $1 AND m2.sender_id = sub.other_id AND m2.read_at IS NULL
            AND ((m2.ride_id IS NULL AND sub.ride_id IS NULL) OR m2.ride_id = sub.ride_id)
       ) AS unread_count
     FROM (
       SELECT
         CASE WHEN sender_id = $1 THEN recipient_id ELSE sender_id END AS other_id,
         ride_id, body, sender_id, created_at
       FROM messages
       WHERE sender_id = $1 OR recipient_id = $1
     ) sub
     JOIN users u ON u.id = sub.other_id
     ORDER BY sub.other_id, sub.ride_id, sub.created_at DESC`,
    [req.user.id]
  );
  const conversations = result.rows.sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
  res.json(conversations);
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
  // Opening the thread is also how you "read" the notification that pointed
  // you here, so clear it instead of leaving the badge stuck on unread.
  await pool.query(
    `UPDATE notifications SET acknowledged_at = now()
     WHERE user_id = $1 AND type = 'message' AND related_user_id = $2 AND acknowledged_at IS NULL`,
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
  const message = result.rows[0];
  emitToUser(recipient_id, 'message:new', message);
  emitToUser(req.user.id, 'message:new', message); // syncs the sender's other open devices/tabs

  const senderResult = await pool.query('SELECT full_name FROM users WHERE id = $1', [req.user.id]);
  const senderName = senderResult.rows[0]?.full_name || 'Someone';
  const title = `New message from ${senderName}`;
  const preview = body.length > 140 ? `${body.slice(0, 140)}...` : body;

  const notification = await pool.query(
    `INSERT INTO notifications (user_id, type, title, body, related_user_id, ride_id)
     VALUES ($1, 'message', $2, $3, $4, $5) RETURNING *`,
    [recipient_id, title, preview, req.user.id, ride_id || null]
  );
  emitToUser(recipient_id, 'notification:new', notification.rows[0]);
  // Push works even if the app is closed/backgrounded, as long as the
  // recipient has opted in from Profile — same delivery path as emergency
  // alerts, just a different title/body.
  const threadUrl = `/messages?with=${req.user.id}${ride_id ? `&ride_id=${ride_id}` : ''}`;
  sendPushToUser(recipient_id, {
    title,
    body: preview,
    notificationId: notification.rows[0].id,
    url: threadUrl,
  }).catch(() => {});

  res.status(201).json(message);
});

export default router;
