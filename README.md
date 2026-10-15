# G-Link

Guest house booking system for the Royal University of Bhutan (capstone project).
Guests find a room with free beds, book it, add extra guests and ask to stay longer.
Admins approve or reject requests, block beds, change rooms and keep the rate table.
Incharges check guests in and out and record payments. The Super Admin manages accounts.

## Stack

| Part | Folder | Tech |
|---|---|---|
| Web client | `client/` | React 19 + Vite |
| API server | `server/` | Node.js 18+, Express 4, ES modules, mysql2, dotenv, cors |
| Database | `database/` | MySQL 8 (utf8mb4) |
| Documents | `docs/` | Wireframes, API notes, email texts, test plans, report |

## Branches

Each area of work has its own branch. Work goes **only** on the branch for its area.

| Branch | Owner | Holds |
|---|---|---|
| `frontend` | Tandin | `client/` |
| `backend` | Kinley | `server/` |
| `database` | Sonam | `database/` |
| `others` | Sonam, Tshering | `docs/`, and shared root files (this README, `.gitignore`, `.editorconfig`, `.prettierrc`, `.vscode/`, `g-link.code-workspace`, `PROGRESS.md`) |

Rules:

- Never commit to `main` or `develop`, never merge into `main` on your own, never force-push, never delete branches.
- Before you start: `git switch <branch>` then `git pull --ff-only`. Push with `git push origin <branch>`.
- Small, focused commits with the message format `<TaskID>: <what>`, e.g. `F-01: add reusable UI components`.
- Never commit `.env` files, passwords or keys. Only `.env.example` files are committed.
- Each of `client/`, `server/` and `database/` has its own `.gitignore`, so each branch is safe on its own.

## How to run (once the branches are merged together)

Needs MySQL 8, Node.js 18+ for the server and Node.js 20.19+ for the client (Vite 8).

```bash
# 1. Database: see database/setup_notes.md
sh database/setup_all.sh -u root -p

# 2. API server (http://localhost:5000)
cd server
cp .env.example .env      # then fill in DB_USER, DB_PASSWORD, JWT_SECRET
npm install
npm run create-super-admin -- you@rub.edu.bt   # first account (asks for a password)
npm run dev               # check http://localhost:5000/health and /health/db
npm test

# 3. Web client (http://localhost:5173)
cd ../client
npm install
npm run dev
npm run build
```

In VS Code, open `g-link.code-workspace` and use **Terminal → Run Task → dev: server + client**.

## Where things are

- Progress: [`PROGRESS.md`](PROGRESS.md)
- API: [`docs/api/README.md`](docs/api/README.md) · Emails: [`docs/email-texts`](docs/email-texts/README.md) · Security: [`docs/security`](docs/security/README.md)
- Tests: [`docs/testing/test-report.md`](docs/testing/test-report.md) · User guides: [`docs/user-guides`](docs/user-guides)
- Open questions: [`docs/requirements/decisions-and-assumptions.md`](docs/requirements/decisions-and-assumptions.md)
- Wireframes: [`docs/wireframes/README.md`](docs/wireframes/README.md)
- Database setup and naming rules: `database/setup_notes.md` (on the `database` branch)
- UI parts and rules: `client/STYLE_GUIDE.md` (on the `frontend` branch)
