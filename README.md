# Town Rides

A localized rideshare progressive web app for a small town: posted rides, designated-driver instant requests, in-app messaging, ratings, verification badges, expense splitting, recurring rides, a community event calendar, flagging, and an admin dashboard.

## Stack

- **client/** — React (Vite) PWA
- **server/** — Node.js + Express REST API
- **PostgreSQL** — database

## Local setup

### 1. Database

Run a local Postgres (or use a free Railway/Render/Neon instance), then:

```
cd server
cp .env.example .env   # set DATABASE_URL and JWT_SECRET
npm install
npm run migrate         # creates all tables from src/db/schema.sql
npm run generate-vapid-keys   # prints VAPID_PUBLIC_KEY/VAPID_PRIVATE_KEY — paste into .env to enable push
npm run dev              # starts API on http://localhost:4000
```

Push notifications are optional — if you skip the VAPID keys, emergency alerts still create in-app
notifications (visible on the Notifications/Alerts page), they just won't trigger a browser push.

### 2. Client

```
cd client
npm install
npm run dev               # starts on http://localhost:5173, proxies /api to :4000
```

Register an account (must be 18+, enforced server-side). To make yourself an admin, manually update your row after registering:

```sql
UPDATE users SET role = 'admin' WHERE email = 'you@example.com';
```

Then the "Admin" tab appears in the bottom nav.

## Deploying for free

**Server (Render or Railway):**
- Create a Postgres database on the same platform (both have free tiers).
- Deploy `server/` as a web service. Build command: `npm install`. Start command: `npm start`.
- Set env vars: `DATABASE_URL` (from the managed Postgres), `JWT_SECRET` (long random string), `CLIENT_ORIGIN` (your deployed client URL).
- Run the migration once (Render/Railway shell, or a one-off job): `npm run migrate`.

**Client (Render Static Site, Railway, or Vercel/Netlify free tier):**
- Build command: `npm install && npm run build`. Publish directory: `dist`.
- Since the client calls `/api/...` via a relative path, either:
  - Deploy client and server on the same domain behind a reverse proxy, or
  - Add an env-based API base URL and point it at your deployed server (simplest: set `vite.config.js` server proxy only matters for local dev — for production, change `client/src/api.js`'s `fetch(\`/api${path}\`)` to use a configured base URL, e.g. `import.meta.env.VITE_API_URL`).

## Database schema

See [server/src/db/schema.sql](server/src/db/schema.sql) for the full table definitions: `users`, `emergency_contacts`, `events`, `rides`, `ride_requests`, `messages`, `ratings`, `flags`, `payments`, `emergency_alerts`, `alert_recipients`, `notifications`, `push_subscriptions`.

## Phase 1 feature notes

- **Two ride modes**: "posted" rides (browse/request) and "designated_driver" (toggle availability, get instant requests).
- **Verification badges**: users request verification; an admin approves from the dashboard.
- **Recurring rides**: stored via `is_recurring` + `recurrence_rule` (free-text days, e.g. `MON,TUE,WED`); Phase 1 doesn't auto-generate future instances yet.
- **18+ enforcement**: checked server-side at registration using date of birth.

### Emergency alerts

Triggering the SOS button now does three things:
1. Logs the alert (`emergency_alerts`) for admin visibility, as before.
2. Resolves each of the user's `emergency_contacts` against the `users` table by phone or email. Any match gets an in-app `notifications` row immediately, plus a Web Push notification if they've enabled push (Profile → "Enable push notifications") and the server has VAPID keys configured.
3. Any contact who *isn't* a registered user is recorded in `alert_recipients` with no matched user, and surfaced on the Admin dashboard's "Unreachable contacts" tab with their name/phone/email so an admin can follow up manually.

Notifications live at `/notifications` (bell icon in the top bar shows an unread count, polled every 30s). This is intentionally still in-app/push only — no SMS/email gateway is wired up, since that needs a paid service (e.g. Twilio) to go beyond a trial.

### Leaderboard

`/leaderboard` ranks users by rides offered (as driver, non-cancelled) and rides taken (accepted ride requests as passenger), for the last 7 days and all-time. Only display name, verification badge, and ride counts are shown — no contact info.
