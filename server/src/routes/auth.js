import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import { sendPasswordResetEmail } from '../utils/mailer.js';

const router = express.Router();

function calculateAge(dob) {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

function publicUser(user) {
  const { password_hash, ...rest } = user;
  return rest;
}

router.post('/register', async (req, res) => {
  const { email, password, full_name, date_of_birth, phone } = req.body;
  if (!email || !password || !full_name || !date_of_birth) {
    return res.status(400).json({ error: 'email, password, full_name, and date_of_birth are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (calculateAge(date_of_birth) < 18) {
    return res.status(400).json({ error: 'You must be 18 or older to create an account.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone, date_of_birth)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [email.toLowerCase(), password_hash, full_name, phone || null, date_of_birth]
    );
    const user = result.rows[0];
    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'email and password are required.' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (user.is_suspended) {
      return res.status(403).json({ error: 'This account has been suspended.' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    const token = signToken(user);
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to log in.' });
  }
});

// Always responds the same way whether or not the email exists, so this
// can't be used to enumerate registered accounts.
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email is required.' });

  try {
    const result = await pool.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    const user = result.rows[0];

    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)`,
        [user.id, tokenHash, expiresAt]
      );

      const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
      const resetUrl = `${clientOrigin}/reset-password?token=${rawToken}`;
      await sendPasswordResetEmail(email.toLowerCase(), resetUrl);
    }

    res.json({ ok: true, message: 'If an account with that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process request.' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ error: 'token and password are required.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const result = await pool.query(
      `SELECT * FROM password_reset_tokens
       WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()`,
      [tokenHash]
    );
    const resetToken = result.rows[0];
    if (!resetToken) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [password_hash, resetToken.user_id]);
    await pool.query('UPDATE password_reset_tokens SET used_at = now() WHERE id = $1', [resetToken.id]);

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
});

export default router;
