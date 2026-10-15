# G-Link security notes

What the system does today, and what is still to do before going live.

## In place

| Area | What |
|---|---|
| Passwords | bcrypt (10 rounds); 8–72 characters with letters and numbers; never sent back by the API |
| Sign in | JWT signed with `JWT_SECRET` (required to start), 8-hour default; user re-loaded on every request so role changes and switched-off accounts apply at once |
| Email links | Signed, short-lived (verify 24 h, reset 1 h); a reset link stops working once the password changes |
| Guessing | 10 tries / 15 min per IP + email on sign-up, sign-in, resend and reset; same answer for wrong email or wrong password; forgot-password and resend never say whether an account exists |
| Roles | Every admin, incharge and super admin route checks the role on the server; guests only see their own bookings (others get 404) |
| Super Admin | Cannot change their own role or status; the last active Super Admin cannot be removed |
| Input | Every field checked on the server (type, length, allowed values, dates); SQL uses placeholders only; JSON bodies limited to 100 kB |
| Errors | Unknown errors give a generic 500; details only in the server log |
| Double booking | Bookings, approvals, extensions, room changes and blocks run in a transaction that locks the room row |
| Headers | `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Cache-Control: no-store`; CORS only for `CLIENT_URL` |
| Emails | Admin text is HTML-escaped in emails |
| Secrets | `.env` files ignored in every folder; only `.env.example` committed; first Super Admin created by a script, no passwords in seed data |
| Dependencies | `npm audit`: 0 known vulnerabilities in server and client (7 Oct 2026); nodemailer upgraded to 10.x for that reason |

## Still to do before going live

- Serve over **HTTPS** only (reverse proxy such as Nginx with a certificate).
- Use a strong random `JWT_SECRET` and a MySQL login with rights on `g_link` only (not root).
- Set up real SMTP (`EMAIL_*`) with SPF/DKIM for the sending domain.
- Daily MySQL backups (`mysqldump`) kept off the server.
- The sign-in token is kept in `localStorage`; with HTTPS and no third-party scripts this is acceptable for a campus
  system, but an HTTP-only cookie would be stronger against XSS.
- The rate limiter is in memory (fine for one server process; use a shared store if running several).
- Have someone outside the team try to break it (manual penetration test).
