import express from 'express';
import bcrypt from 'bcrypt';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { emitToAll } from '../socket.js';

const router = express.Router();

function publicUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

router.get('/me', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found.' });
  res.json(publicUser(result.rows[0]));
});

router.patch('/me', requireAuth, async (req, res) => {
  const { full_name, phone, bio, photo_url } = req.body;
  const result = await pool.query(
    `UPDATE users SET
       full_name = COALESCE($1, full_name),
       phone = COALESCE($2, phone),
       bio = COALESCE($3, bio),
       photo_url = COALESCE($4, photo_url)
     WHERE id = $5 RETURNING *`,
    [full_name, phone, bio, photo_url, req.user.id]
  );
  res.json(publicUser(result.rows[0]));
});

router.get('/:id', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found.' });
  const ratingsResult = await pool.query(
    'SELECT AVG(score)::numeric(2,1) AS avg_score, COUNT(*) AS count FROM ratings WHERE ratee_id = $1',
    [req.params.id]
  );
  res.json({ ...publicUser(result.rows[0]), rating: ratingsResult.rows[0] });
});

// Designated driver availability toggle
router.post('/me/driver-availability', requireAuth, async (req, res) => {
  const { available } = req.body;
  const result = await pool.query(
    `UPDATE users SET is_designated_driver = TRUE, driver_available = $1 WHERE id = $2 RETURNING *`,
    [!!available, req.user.id]
  );
  emitToAll('drivers:changed', {});
  res.json(publicUser(result.rows[0]));
});

router.get('/drivers/available', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT id, full_name, photo_url, verification_status, bio FROM users
     WHERE is_designated_driver = TRUE AND driver_available = TRUE AND is_suspended = FALSE`
  );
  res.json(result.rows);
});

// Verification request (sets to pending; admin approves)
router.post('/me/verification-request', requireAuth, async (req, res) => {
  const result = await pool.query(
    `UPDATE users SET verification_status = 'pending' WHERE id = $1 RETURNING *`,
    [req.user.id]
  );
  res.json(publicUser(result.rows[0]));
});

// Emergency contacts
router.get('/me/emergency-contacts', requireAuth, async (req, res) => {
  const result = await pool.query('SELECT * FROM emergency_contacts WHERE user_id = $1', [req.user.id]);
  res.json(result.rows);
});

router.post('/me/emergency-contacts', requireAuth, async (req, res) => {
  const { name, phone, email, relationship } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required.' });
  const result = await pool.query(
    `INSERT INTO emergency_contacts (user_id, name, phone, email, relationship)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [req.user.id, name, phone || null, email || null, relationship || null]
  );
  res.status(201).json(result.rows[0]);
});

router.delete('/me/emergency-contacts/:id', requireAuth, async (req, res) => {
  await pool.query(
    'DELETE FROM emergency_contacts WHERE id = $1 AND user_id = $2',
    [req.params.id, req.user.id]
  );
  res.status(204).end();
});

// Deletes your own account. Requires your current password so a hijacked
// session token alone isn't enough to permanently destroy the account.
router.delete('/me', requireAuth, async (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ error: 'password is required to confirm account deletion.' });
  }
  const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  const user = result.rows[0];
  if (!user) return res.status(404).json({ error: 'User not found.' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Incorrect password.' });

  await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
  res.status(204).end();
});

export default router;
