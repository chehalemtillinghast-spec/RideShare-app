import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import ridesRoutes from './routes/rides.js';
import messagesRoutes from './routes/messages.js';
import ratingsRoutes from './routes/ratings.js';
import paymentsRoutes from './routes/payments.js';
import eventsRoutes from './routes/events.js';
import flagsRoutes from './routes/flags.js';
import emergencyRoutes from './routes/emergency.js';
import adminRoutes from './routes/admin.js';
import notificationsRoutes from './routes/notifications.js';
import pushRoutes from './routes/push.js';
import leaderboardRoutes from './routes/leaderboard.js';

dotenv.config();

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/rides', ridesRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/flags', flagsRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error.' });
});

export default app;
