# G-Link test report — 7 October 2026

Everything below was run on 7 Oct 2026 in a Linux container with Node.js 22.22, MySQL 8.0.46 and Chromium
(Playwright 1.56). Nothing here was run on a team member's own computer yet.

## Summary

| Suite | Where | How to run | Result |
|---|---|---|---|
| Database checks | `database/tests/*.sql` | `mysql -u <login> -p g_link < database/tests/01_users_checks.sql` (and `02_…`) | **19 / 19 PASS** |
| Fresh database build | `database/setup_all.sh` | `sh database/setup_all.sh -u root -p` on an empty server | **OK**, all 12 tables InnoDB / utf8mb4_unicode_ci; seed safe to run twice |
| Server unit tests | `server/tests/unit` | `cd server && npm run test:unit` | **45 / 45 pass** |
| Server integration tests | `server/tests/integration` | `npm run test:integration` (needs MySQL, `TEST_DB_*`, the `database/` folder) | **39 / 39 pass** |
| All server tests | | `npm test` | **84 / 84 pass** (45 when no test database is set: integration suites skip with a message) |
| Client build | `client/` | `npm run build` | **OK** (Vite 8, 83 modules) |
| Browser end-to-end | not committed (needs Playwright) | real API + real MySQL + Vite dev server | **128 / 128 checks pass** |
| Dependency audit | | `npm audit` in `server/` and `client/` | **0 vulnerabilities** |

## What the integration tests cover (server against a fresh MySQL database)

- Sign up → verification email → verify → sign in; bad email / weak password; sign in before verifying; wrong
  password and unknown email give the same answer; reset link works once; profile completeness; CID already used;
  switched-off account (old tokens stop working too); missing / junk token.
- Room list free beds; past dates and stays over 30 nights refused; quote = nights × beds × rate; Pending bookings hold
  beds; over-booking refused; **two people asking for the last bed at the same moment: exactly one succeeds**; a private
  booking takes the whole double; profile needed to book; guests cannot see others' bookings or admin pages.
- Approve (emails the guest; second approve refused); room-sharing records; reject needs a reason; guest cancel frees
  beds; longer stay request → approve → check-out and total updated; extension refused when the room is full;
  change room (and refused when too small).
- Blocks (free beds drop; blocking already-booked beds refused); international booking (passport needed, Approved,
  International rate); rate change applies to new quotes; add / edit / hide rooms, duplicate refused, single = 1 bed.
- Check-in refused before the date / when not approved / twice; payments (not above amount due, reference needed except
  cash); check-out completes; guests cannot use the desk.
- Meeting hall: request, time clash refused, back-to-back allowed, capacity, taken slots, approve + email.
- Super Admin: role change, cannot change self, demoting an inactive Super Admin works; hourly clean-up cancels
  unreviewed past requests.

## Browser end-to-end (what a person would click)

Run with Playwright against the real server, a fresh `g_link` database and `npm run dev`:

1. **Guest, 375 px wide:** sign up (empty form shows red errors under the boxes) → check-your-email page → sign in
   refused until verified (with "send again") → verify link from the email → wrong password message → rooms list →
   phone menu → room page → booking blocked until profile complete → profile (bad phone refused) → back to booking →
   details (guest type required) → extra guest (name required) → shared-room notice (must tick) → bill
   (2 nights × 2 beds × Nu. 300 = Nu. 1,200) → request sent → My bookings → second booking for today (private double)
   → meeting hall request.
2. **Super Admin, 1280 px:** promotes two accounts to Admin and Incharge.
3. **Admin, 375 px:** dashboard → review GL-0001 (reject without reason refused) → approve → approve GL-0002 → approve a
   hall request → international booking (passport and nationality required) → block 2 beds → change GL-0001 to P-02 →
   add room C-301 → rate table (negative refused, then saved) → approves the guest's longer-stay request.
4. **Guest:** sees the room change, asks to stay one night longer (extra Nu. 600 shown), bill becomes Nu. 1,800.
5. **Incharge, 375 px:** bookings → today (GL-0002 arriving) → desk: find by name → check in → payment above the amount
   due refused → mBoB without reference refused → payment recorded → check out → Completed; admin pages redirect away.
6. **Sweep:** all 29 pages opened at 375 px and 1280 px: no sideways page scrolling, nothing stuck loading, no
   console errors.

Result of the last full run on a fresh database: `128 PASS, 0 FAIL`.

## Not tested yet

- Real email delivery through an SMTP server (emails were checked in the server log / test outbox only).
- Other browsers than Chromium (Firefox, Safari), real phones, screen readers by a person.
- Load / many users at once beyond the two-request race test.
- The team's own machines (Windows / macOS) and MySQL installs.
- Usability testing with real guests and guest house staff.
