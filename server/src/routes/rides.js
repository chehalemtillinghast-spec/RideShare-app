import express from 'express';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { emitToAll, emitToUser } from '../socket.js';

const router = express.Router();

// Browse posted rides (open, upcoming, not the user's own)
router.get('/', requireAuth, async (req, res) => {
  const { ride_type, status } = req.query;
  const conditions = [];
  const params = [];
  if (ride_type) {
    params.push(ride_type);
    conditions.push(`r.ride_type = $${params.length}`);
  }
  params.push(status || 'open');
  conditions.push(`r.status = $${params.length}`);

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await pool.query(
    `SELECT r.*, u.full_name AS creator_name, u.verification_status AS creator_verification,
       (SELECT AVG(score)::numeric(2,1) FROM ratings WHERE ratee_id = u.id) AS creator_rating,
       (SELECT COUNT(*) FROM rides WHERE creator_id = u.id AND status != 'cancelled') AS creator_rides_count
     FROM rides r JOIN users u ON u.id = r.creator_id
     ${where}
     ORDER BY r.departure_time ASC NULLS LAST, r.created_at DESC`,
    params
  );
  res.json(result.rows);
});

router.get('/mine', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT * FROM rides WHERE creator_id = $1 ORDER BY created_at DESC`,
    [req.user.id]
  );
  res.json(result.rows);
});

// Rides where the current user and :otherId had an accepted connection (eligible for rating)
router.get('/shared/:otherId', requireAuth, async (req, res) => {
  const result = await pool.query(
    `SELECT r.id, r.origin, r.destination, r.departure_time
     FROM rides r
     JOIN ride_requests rr ON rr.ride_id = r.id AND rr.status = 'accepted'
     WHERE (r.creator_id = $1 AND rr.requester_id = $2) OR (r.creator_id = $2 AND rr.requester_id = $1)
     ORDER BY r.departure_time DESC NULLS LAST, r.created_at DESC`,
    [req.user.id, req.params.otherId]
  );
  res.json(result.rows);
});

router.get('/:id', requireAuth, async (req, res) => {
  const rideResult = await pool.query(
    `SELECT r.*, u.full_name AS creator_name, u.verification_status AS creator_verification, u.phone AS creator_phone,
       (SELECT AVG(score)::numeric(2,1) FROM ratings WHERE ratee_id = u.id) AS creator_rating,
       (SELECT COUNT(*) FROM rides WHERE creator_id = u.id AND status != 'cancelled') AS creator_rides_count
     FROM rides r JOIN users u ON u.id = r.creator_id WHERE r.id = $1`,
    [req.params.id]
  );
  if (!rideResult.rows[0]) return res.status(404).json({ error: 'Ride not found.' });
  const requestsResult = await pool.query(
    `SELECT rr.*, u.full_name AS requester_name FROM ride_requests rr
     JOIN users u ON u.id = rr.requester_id WHERE rr.ride_id = $1 ORDER BY rr.created_at ASC`,
    [req.params.id]
  );
  res.json({ ...rideResult.rows[0], requests: requestsResult.rows });
});

router.post('/', requireAuth, async (req, res) => {
  const {
    ride_type, creator_role, origin, destination, departure_time,
    available_seats, distance_miles, estimated_minutes, cost_estimate,
    notes, is_recurring, recurrence_frequency, recurrence_rule, event_id,
  } = req.body;

  if (!ride_type || !creator_role || !origin || !destination) {
    return res.status(400).json({ error: 'ride_type, creator_role, origin, and destination are required.' });
  }
  if (!['posted', 'designated_driver'].includes(ride_type)) {
    return res.status(400).json({ error: 'ride_type must be posted or designated_driver.' });
  }

  const result = await pool.query(
    `INSERT INTO rides (
       creator_id, ride_type, creator_role, origin, destination, departure_time,
       available_seats, distance_miles, estimated_minutes, cost_estimate,
       notes, is_recurring, recurrence_frequency, recurrence_rule, event_id
     ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`,
    [
      req.user.id, ride_type, creator_role, origin, destination, departure_time || null,
      available_seats || 1, distance_miles || null, estimated_minutes || null, cost_estimate || null,
      notes || null, !!is_recurring, is_recurring ? (recurrence_frequency || 'weekly') : null,
      recurrence_rule || null, event_id || null,
    ]
  );
  const ride = result.rows[0];
  emitToAll('rides:changed', { rideId: ride.id });
  res.status(201).json(ride);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const rideResult = await pool.query('SELECT * FROM rides WHERE id = $1', [req.params.id]);
  const ride = rideResult.rows[0];
  if (!ride) return res.status(404).json({ error: 'Ride not found.' });
  if (ride.creator_id !== req.user.id) return res.status(403).json({ error: 'Not your ride.' });

  const {
    status, available_seats, departure_time, notes,
    origin, destination, distance_miles, estimated_minutes, cost_estimate,
    is_recurring, recurrence_frequency, recurrence_rule,
  } = req.body;
  const result = await pool.query(
    `UPDATE rides SET
       status = COALESCE($1, status),
       available_seats = COALESCE($2, available_seats),
       departure_time = COALESCE($3, departure_time),
       notes = COALESCE($4, notes),
       origin = COALESCE($5, origin),
       destination = COALESCE($6, destination),
       distance_miles = COALESCE($7, distance_miles),
       estimated_minutes = COALESCE($8, estimated_minutes),
       cost_estimate = COALESCE($9, cost_estimate),
       is_recurring = COALESCE($10, is_recurring),
       recurrence_frequency = COALESCE($11, recurrence_frequency),
       recurrence_rule = COALESCE($12, recurrence_rule)
     WHERE id = $13 RETURNING *`,
    [
      status, available_seats, departure_time, notes,
      origin, destination, distance_miles, estimated_minutes, cost_estimate,
      is_recurring, recurrence_frequency, recurrence_rule,
      req.params.id,
    ]
  );
  emitToAll('rides:changed', { rideId: req.params.id });
  res.json(result.rows[0]);
});

router.delete('/:id', requireAuth, async (req, res) => {
  const rideResult = await pool.query('SELECT * FROM rides WHERE id = $1', [req.params.id]);
  const ride = rideResult.rows[0];
  if (!ride) return res.status(404).json({ error: 'Ride not found.' });
  if (ride.creator_id !== req.user.id) return res.status(403).json({ error: 'Not your ride.' });

  await pool.query('DELETE FROM rides WHERE id = $1', [req.params.id]);
  emitToAll('rides:changed', { rideId: Number(req.params.id) });
  res.status(204).end();
});

// Request to join a posted ride
router.post('/:id/requests', requireAuth, async (req, res) => {
  const rideResult = await pool.query('SELECT * FROM rides WHERE id = $1', [req.params.id]);
  const ride = rideResult.rows[0];
  if (!ride) return res.status(404).json({ error: 'Ride not found.' });
  if (ride.creator_id === req.user.id) return res.status(400).json({ error: 'You cannot request your own ride.' });
  if (ride.status !== 'open') return res.status(400).json({ error: 'This ride is not open for requests.' });

  const seats_requested = req.body.seats_requested || 1;
  const result = await pool.query(
    `INSERT INTO ride_requests (ride_id, requester_id, seats_requested) VALUES ($1, $2, $3) RETURNING *`,
    [req.params.id, req.user.id, seats_requested]
  );
  emitToUser(ride.creator_id, 'ride:request:new', { rideId: ride.id });
  res.status(201).json(result.rows[0]);
});

router.patch('/:id/requests/:requestId', requireAuth, async (req, res) => {
  const { status } = req.body; // accepted | declined | cancelled
  if (!['accepted', 'declined', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'status must be accepted, declined, or cancelled.' });
  }
  const rideResult = await pool.query('SELECT * FROM rides WHERE id = $1', [req.params.id]);
  const ride = rideResult.rows[0];
  if (!ride) return res.status(404).json({ error: 'Ride not found.' });

  const requestResult = await pool.query('SELECT * FROM ride_requests WHERE id = $1', [req.params.requestId]);
  const request = requestResult.rows[0];
  if (!request) return res.status(404).json({ error: 'Request not found.' });

  const isOwner = ride.creator_id === req.user.id;
  const isRequester = request.requester_id === req.user.id;
  if (status === 'cancelled' && !isRequester) return res.status(403).json({ error: 'Only the requester can cancel.' });
  if ((status === 'accepted' || status === 'declined') && !isOwner) {
    return res.status(403).json({ error: 'Only the ride creator can accept or decline.' });
  }

  const updated = await pool.query(
    `UPDATE ride_requests SET status = $1 WHERE id = $2 RETURNING *`,
    [status, req.params.requestId]
  );

  if (status === 'accepted') {
    const remainingSeats = ride.available_seats - request.seats_requested;
    await pool.query(
      `UPDATE rides SET available_seats = $1, status = CASE WHEN $1 <= 0 THEN 'full' ELSE status END WHERE id = $2`,
      [Math.max(remainingSeats, 0), ride.id]
    );
    emitToAll('rides:changed', { rideId: ride.id });
  }

  emitToUser(ride.creator_id, 'ride:request:updated', { rideId: ride.id });
  emitToUser(request.requester_id, 'ride:request:updated', { rideId: ride.id });
  res.json(updated.rows[0]);
});

// Instant designated-driver request: rider requests, driver gets it immediately
router.post('/instant-request', requireAuth, async (req, res) => {
  const { driver_id, origin, destination, notes } = req.body;
  if (!driver_id || !origin || !destination) {
    return res.status(400).json({ error: 'driver_id, origin, and destination are required.' });
  }
  const driverResult = await pool.query(
    'SELECT * FROM users WHERE id = $1 AND is_designated_driver = TRUE AND driver_available = TRUE',
    [driver_id]
  );
  if (!driverResult.rows[0]) return res.status(400).json({ error: 'Driver is not currently available.' });

  const rideResult = await pool.query(
    `INSERT INTO rides (creator_id, ride_type, creator_role, origin, destination, available_seats, notes, status)
     VALUES ($1, 'designated_driver', 'driver', $2, $3, 1, $4, 'open') RETURNING *`,
    [driver_id, origin, destination, notes || null]
  );
  const ride = rideResult.rows[0];
  const requestResult = await pool.query(
    `INSERT INTO ride_requests (ride_id, requester_id, seats_requested) VALUES ($1, $2, 1) RETURNING *`,
    [ride.id, req.user.id]
  );
  emitToUser(driver_id, 'ride:request:new', { rideId: ride.id });
  res.status(201).json({ ride, request: requestResult.rows[0] });
});

export default router;
