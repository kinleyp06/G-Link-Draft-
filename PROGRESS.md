# G-Link progress

Last updated: **7 October 2026**. Details per task: [`docs/task-plan/task-list.md`](docs/task-plan/task-list.md).
Test results: [`docs/testing/test-report.md`](docs/testing/test-report.md).

## Done

- **database** — all 12 tables (InnoDB, utf8mb4), sample data, `setup_all.sh`, 19 PASS/FAIL checks, setup notes with
  naming rules, data model notes. Tested on MySQL 8.0.46.
- **backend** — complete API: accounts with email verification and password reset, rooms with free beds, bookings with
  extra guests and room sharing, longer stays, meeting hall, admin approvals, change room, blocks, international
  bookings, rooms/halls/rates editing, incharge check-in/out and payments, Super Admin accounts, hourly clean-up.
  84 automated tests pass (45 unit, 39 integration against MySQL).
- **frontend** — every screen F-04 to F-29 plus the F-01 style guide, role menus, works at 375 px with no sideways
  scrolling. 128 browser checks pass end to end (guest, admin, incharge, super admin).
- **others** — wireframes for all guest and staff screens, API reference, email texts, security notes, test report,
  user guides, shared editor settings.

## Not done yet

- **Manual part of D-01:** each member installs MySQL 8 and gets a personal login (see `database/setup_notes.md`).
- **Check against the Data Types document:** tables other than `users` were designed without it.
- **Confirm the decisions** in [`docs/requirements/decisions-and-assumptions.md`](docs/requirements/decisions-and-assumptions.md)
  (guest types, billing, sharing, max stay, task ID numbering).
- **Real data:** guest houses, rooms, halls and approved rates (`docs/guest-house-data/`).
- **Real email:** set up SMTP and try every email.
- **Merging:** branches are separate and not merged; `main` was not touched. Merge when the team agrees.
- **Going live:** HTTPS, backups, server set-up (see `docs/security/README.md`).
- Testing by people: other browsers, real phones, screen reader, usability with guests and staff.
- Meeting notes, final report, presentation.
