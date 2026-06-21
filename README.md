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
npm run dev              # starts API on http://localhost:4000
```

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

See [server/src/db/schema.sql](server/src/db/schema.sql) for the full table definitions: `users`, `emergency_contacts`, `events`, `rides`, `ride_requests`, `messages`, `ratings`, `flags`, `payments`, `emergency_alerts`.

## Phase 1 feature notes

- **Two ride modes**: "posted" rides (browse/request) and "designated_driver" (toggle availability, get instant requests).
- **Emergency button**: logs an in-app alert visible to admins and lists the user's emergency contacts (Phase 1 is in-app only — no outbound SMS/email yet; that's a natural Phase 2 addition if budget allows for Twilio/SMTP).
- **Verification badges**: users request verification; an admin approves from the dashboard.
- **Recurring rides**: stored via `is_recurring` + `recurrence_rule` (free-text days, e.g. `MON,TUE,WED`); Phase 1 doesn't auto-generate future instances yet.
- **18+ enforcement**: checked server-side at registration using date of birth.
