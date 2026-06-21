import express from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

router.post('/subscribe', requireAuth, async (req, res) => {
  const { endpoint, keys } = req.body || {};
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return res.status(400).json({ error: 'endpoint and keys.p256dh/keys.auth are required.' });
  }
  await pool.query(
    `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, endpoint) DO UPDATE SET p256dh = $3, auth = $4`,
    [req.user.id, endpoint, keys.p256dh, keys.auth]
  );
  res.status(201).json({ ok: true });
});

router.post('/unsubscribe', requireAuth, async (req, res) => {
  const { endpoint } = req.body || {};
  if (!endpoint) return res.status(400).json({ error: 'endpoint is required.' });
  await pool.query('DELETE FROM push_subscriptions WHERE user_id = $1 AND endpoint = $2', [req.user.id, endpoint]);
  res.status(204).end();
});

export default router;
