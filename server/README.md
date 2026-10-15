# G-Link API server

Node.js 18+ · Express 4 · ES modules · MySQL 8 (mysql2). Owner: Kinley.

## Run

```bash
cp .env.example .env        # fill in DB_USER, DB_PASSWORD, JWT_SECRET
npm install
npm run dev                 # http://localhost:5000  (/health, /health/db)
npm run create-super-admin -- you@rub.edu.bt   # first account; asks for a password
```

The database must exist first: see `database/setup_notes.md` (`sh database/setup_all.sh -u root -p`).
With `EMAIL_HOST` blank, emails (verification links, booking updates) are printed in this terminal.

## Test

```bash
npm test                    # unit tests; integration tests too when TEST_DB_* is set
npm run test:unit
npm run test:integration    # needs MySQL + TEST_DB_* in .env + the database/ folder
```

Integration tests DROP and re-create `TEST_DB_NAME` (default `g_link_test`) each run. Never point it at real data.

## Layout

| Folder | What |
|---|---|
| `src/routes/index.js` | Every URL and who may call it (full list: `docs/api/README.md`) |
| `src/controllers/` | Read the request, call a service, send JSON |
| `src/services/` | Business rules (free beds, bills, approvals, check-in …) |
| `src/models/` | SQL queries only |
| `src/emails/` | Email texts and the sender |
| `src/jobs/` | Hourly clean-up (expire unreviewed requests) |
| `src/middleware/` | Sign-in check, roles, rate limit, errors |
| `src/utils/` | Validation, dates, tokens, constants |
| `scripts/` | `createSuperAdmin.js` |
| `tests/unit`, `tests/integration` | `node:test` |

Every error is sent as `{ message, code }` (plus `fields` for form errors, so each message can go under its box).
