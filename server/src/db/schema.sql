-- Rideshare app schema (Phase 1)

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- member | admin
  bio TEXT,
  photo_url TEXT,
  is_designated_driver BOOLEAN NOT NULL DEFAULT FALSE,
  driver_available BOOLEAN NOT NULL DEFAULT FALSE,
  verification_status TEXT NOT NULL DEFAULT 'unverified', -- unverified | pending | verified
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  relationship TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rides (
  id SERIAL PRIMARY KEY,
  creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ride_type TEXT NOT NULL, -- posted | designated_driver
  creator_role TEXT NOT NULL, -- driver | rider
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TIMESTAMPTZ,
  available_seats INTEGER NOT NULL DEFAULT 1,
  distance_miles NUMERIC,
  estimated_minutes INTEGER,
  cost_estimate NUMERIC,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- open | full | in_progress | completed | cancelled
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurrence_frequency TEXT, -- daily | weekly | monthly
  recurrence_rule TEXT, -- e.g. 'MON,TUE,WED,THU,FRI' (only meaningful when recurrence_frequency = 'weekly')
  event_id INTEGER REFERENCES events(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ride_requests (
  id SERIAL PRIMARY KEY,
  ride_id INTEGER NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | accepted | declined | cancelled
  seats_requested INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  ride_id INTEGER REFERENCES rides(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ratings (
  id SERIAL PRIMARY KEY,
  ride_id INTEGER NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  rater_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ratee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ride_id, rater_id, ratee_id)
);

CREATE TABLE IF NOT EXISTS flags (
  id SERIAL PRIMARY KEY,
  reporter_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  ride_id INTEGER REFERENCES rides(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'open', -- open | reviewed | resolved | dismissed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  ride_id INTEGER NOT NULL REFERENCES rides(id) ON DELETE CASCADE,
  payer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'recorded', -- recorded | confirmed
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS emergency_alerts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ride_id INTEGER REFERENCES rides(id),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active | resolved
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resolves each emergency contact against the users table at alert time,
-- so we can both notify matched users and flag unreachable contacts to admins.
CREATE TABLE IF NOT EXISTS alert_recipients (
  id SERIAL PRIMARY KEY,
  alert_id INTEGER NOT NULL REFERENCES emergency_alerts(id) ON DELETE CASCADE,
  contact_id INTEGER NOT NULL REFERENCES emergency_contacts(id) ON DELETE CASCADE,
  matched_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'general', -- emergency_alert | message | general
  title TEXT NOT NULL,
  body TEXT,
  alert_id INTEGER REFERENCES emergency_alerts(id) ON DELETE CASCADE,
  related_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  ride_id INTEGER REFERENCES rides(id) ON DELETE CASCADE,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Added after the initial notifications table shipped — keeps existing rows
-- intact while letting new (e.g. message) notifications link back to the
-- other party/ride so they can be auto-acknowledged once that thread is read.
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS ride_id INTEGER REFERENCES rides(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, endpoint)
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_hash ON password_reset_tokens(token_hash);

-- events.created_by originally had no ON DELETE clause (defaulted to
-- RESTRICT), which would block deleting a user who'd created an event.
-- Keep the event itself but null out its creator instead.
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_created_by_fkey;
ALTER TABLE events ADD CONSTRAINT events_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- Added after rides shipped with only recurrence_rule — lets recurring
-- rides specify daily/weekly/monthly instead of always being weekly.
ALTER TABLE rides ADD COLUMN IF NOT EXISTS recurrence_frequency TEXT;

-- rides.event_id originally had no ON DELETE clause (defaulted to
-- RESTRICT), which would block deleting an event that still has rides
-- attached to it. Keep the ride itself but null out its event link instead.
ALTER TABLE rides DROP CONSTRAINT IF EXISTS rides_event_id_fkey;
ALTER TABLE rides ADD CONSTRAINT rides_event_id_fkey
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_rides_status ON rides(status);
CREATE INDEX IF NOT EXISTS idx_messages_ride ON messages(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_ride ON ride_requests(ride_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, acknowledged_at);
CREATE INDEX IF NOT EXISTS idx_alert_recipients_alert ON alert_recipients(alert_id);
