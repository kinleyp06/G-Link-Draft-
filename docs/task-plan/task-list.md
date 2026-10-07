# G-Link task list (as built on 7 Oct 2026)

✅ = done and checked · ⚠️ = done, needs a person to confirm · ⬜ = not done
IDs marked * were chosen by Claude because the full task plan was not available; rename to match the plan.

## Database (`database` branch, Sonam)

| ID | Task | State |
|---|---|---|
| D-01 | Create database script, setup notes, naming rules | ✅ script · ⬜ manual part: install MySQL on each laptop, create each member's login |
| D-03 | `users` table | ✅ duplicate email / CID refused, 4 roles only (tested on MySQL 8.0.46) |
| D-04* … D-14* | `guest_houses`, `rooms`, `halls`, `rates`, `bookings`, `booking_guests`, `room_sharing`, `stay_extensions`, `room_blocks`, `hall_bookings`, `payments` | ⚠️ built and tested; check names/types against the Data Types document |
| D-15* | Sample data, booking checks, `setup_all.sh`, `data_model.md` | ✅ (sample data is not real data) |

## Backend (`backend` branch, Kinley)

| ID | Task | State |
|---|---|---|
| B-01 | Server setup, config, db pool, errors, health routes, unit tests | ✅ |
| B-02* | Validation, tokens, transactions | ✅ |
| B-03* | Email sender and texts | ✅ printed to log · ⬜ real SMTP not tried |
| B-04* | Sign up, verify, sign in, reset password, profile | ✅ |
| B-05* | Rooms with free beds, rates, bills | ✅ |
| B-06* | Guest bookings, extra guests, extensions, hall bookings | ✅ |
| B-07* | Admin: approve/reject, change room, blocks, international, rooms, rates | ✅ |
| B-08* | Incharge check-in/out, payments; Super Admin accounts | ✅ |
| B-09* | Routes, hourly clean-up job, create-super-admin script | ✅ |
| B-10* | Integration tests, README | ✅ 84/84 tests |

## Frontend (`frontend` branch, Tandin)

| ID | Task | State |
|---|---|---|
| F-01 | UI parts, tokens, style guide | ✅ |
| F-02*, F-03* | API client, auth, router, app shell, role menus | ✅ |
| F-04 … F-07 | Sign in, sign up, check email / verify, forgot & reset password | ✅ |
| F-08 | Profile | ✅ |
| F-09, F-10 | Room list with free beds, room page | ✅ |
| F-11 … F-14 | Booking form, extra guests, shared-room notice, bill | ✅ |
| F-15 … F-18 | My bookings, booking detail, longer stay, meeting hall | ✅ |
| F-19 … F-26 | Admin pages | ✅ |
| F-27, F-28 | Incharge bookings / today, check-in/out desk | ✅ |
| F-29 | Super Admin accounts | ✅ |

## Others (`others` branch, Sonam and Tshering)

| ID | Task | State |
|---|---|---|
| O-01 | Guest wireframes (F-04…F-18) | ✅ low fidelity · ⚠️ F-11…F-18 numbering to confirm |
| O-02 | Admin / Incharge / Super Admin wireframes (F-19…F-29) | ✅ |
| O-00* | Root README, shared settings, docs skeleton, PROGRESS | ✅ |
| — | API reference, email texts, security notes, test report, user guides | ✅ first versions |
| — | Real guest house data, meeting notes, report, presentation | ⬜ |
