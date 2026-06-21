import webpush from 'web-push';
import dotenv from 'dotenv';
import { pool } from '../db/pool.js';

dotenv.config();

const vapidConfigured = process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY;

if (vapidConfigured) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:admin@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function sendPushToUser(userId, payload) {
  if (!vapidConfigured) return;
  const result = await pool.query('SELECT * FROM push_subscriptions WHERE user_id = $1', [userId]);
  for (const sub of result.rows) {
    const subscription = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };
    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await pool.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]);
      } else {
        console.error('Push send failed:', err.message);
      }
    }
  }
}
