# G-Link API reference

Base URL: `http://localhost:5000/api` (health checks are outside `/api`). JSON in, JSON out.
Signed-in calls send `Authorization: Bearer <token>` (from `POST /auth/login`, valid 8 hours by default).

**Errors** are always `{ "message": "...", "code": "..." }`. Form errors add `fields`, e.g.
`{ "message": "Check-in is required.", "code": "VALIDATION_ERROR", "fields": { "check_in": "Check-in is required." } }`.
Common codes: `VALIDATION_ERROR` 400, `BAD_JSON` 400, `UNAUTHENTICATED` / `TOKEN_EXPIRED` 401, `FORBIDDEN` 403,
`NOT_FOUND` 404, `NOT_ENOUGH_BEDS` / `NOT_PENDING` / `HALL_TAKEN` 409, `TOO_MANY_REQUESTS` 429, `INTERNAL_ERROR` 500, `DB_DOWN` 503.

Dates are `YYYY-MM-DD`; `check_out` is the morning the guest leaves. Money is in Ngultrum.

## Health

| Method | Path | Who | Notes |
|---|---|---|---|
| GET | `/health` | anyone | `{ status: "ok" }` |
| GET | `/health/db` | anyone | 200 when MySQL answers, else 503 `DB_DOWN` |

## Accounts (F-04 to F-08)

| Method | Path | Who | Body / notes |
|---|---|---|---|
| POST | `/auth/signup` | anyone | `{ email, password }` → 201, sends verification email |
| POST | `/auth/verify-email` | anyone | `{ token }` from the email link |
| POST | `/auth/resend-verification` | anyone | `{ email }` (same answer whether or not the account exists) |
| POST | `/auth/login` | anyone | `{ email, password }` → `{ token, user }`; 403 `EMAIL_NOT_VERIFIED` / `ACCOUNT_INACTIVE` |
| POST | `/auth/forgot-password` | anyone | `{ email }` → emails a 1-hour reset link |
| POST | `/auth/reset-password` | anyone | `{ token, password }`; a link works once |
| GET | `/auth/me` | signed in | `{ user, profile_complete }` |
| PATCH | `/users/me` | signed in | `{ first_name, last_name, phone_number, citizenship_id?, gender?, sid?, department? }` |
| POST | `/users/me/password` | signed in | `{ current_password, new_password }` |

Sign-up, sign-in and reset forms allow 10 tries per 15 minutes per IP and email.

## Rooms, halls, rates (public)

| Method | Path | Notes |
|---|---|---|
| GET | `/guest-houses` | active guest houses |
| GET | `/rooms?check_in&check_out&guest_house_id` | rooms with `free_beds` for the dates, plus room `rates` |
| GET | `/rooms/:id?check_in&check_out` | one room |
| GET | `/halls` | halls plus hall `rates` |
| GET | `/rates` | the whole rate table |

## Guest bookings (signed in; F-11 to F-18)

| Method | Path | Body / notes |
|---|---|---|
| POST | `/bookings/quote` | same body as below → bill + `available`; saves nothing |
| POST | `/bookings` | `{ room_id, check_in, check_out, guest_type, purpose?, share_room?, guests?: [{ full_name, gender?, citizenship_id?, phone_number? }] }` → 201 Pending. Needs a complete profile (`PROFILE_INCOMPLETE`) |
| GET | `/bookings/mine?when=upcoming\|past` | your bookings |
| GET | `/bookings/:id` | `{ booking, guests, extensions, payments, sharing }` (owner or staff) |
| POST | `/bookings/:id/cancel` | Pending or Approved, before check-in |
| POST | `/bookings/:id/extensions` | `{ new_check_out, reason }` (Approved bookings, one pending request at a time) |
| POST | `/hall-bookings` | `{ hall_id, event_date, start_time, end_time, attendees, purpose, guest_type }` |
| GET | `/hall-bookings/mine` | your hall bookings |
| GET | `/hall-bookings/slots?hall_id&date` | times already taken that day |
| POST | `/hall-bookings/:id/cancel` | |

`guest_type` for guests: `RUB Staff`, `RUB Student`, `Official`, `Private`. Max stay 30 nights, up to one year ahead.

## Admin (Admin and Super Admin; F-19 to F-26)

| Method | Path | Body / notes |
|---|---|---|
| GET | `/admin/dashboard` | counts + pending list |
| GET | `/admin/bookings?status&guest_house_id&q` | `q` = name, email, CID or ref `GL-0012` |
| POST | `/admin/bookings/:id/approve` | `{ note? }` |
| POST | `/admin/bookings/:id/reject` | `{ note }` (required) |
| POST | `/admin/bookings/:id/cancel` | `{ note }` (required) |
| GET | `/admin/bookings/:id/rooms` | rooms it could move to, with `fits` |
| POST | `/admin/bookings/:id/change-room` | `{ room_id, reason? }` |
| POST | `/admin/bookings/international` | `{ room_id, check_in, check_out, purpose?, share_room?, guests: [{ full_name, citizenship_id (passport), nationality, … }] }` → Approved |
| GET | `/admin/availability?check_in&check_out` | like `/rooms` but past dates allowed |
| GET | `/admin/extensions?status` | each with `room_free` |
| POST | `/admin/extensions/:id/approve` | |
| POST | `/admin/extensions/:id/reject` | `{ note }` (required) |
| GET / POST | `/admin/room-blocks` | `{ room_id, beds, start_date, end_date, reason }` |
| DELETE | `/admin/room-blocks/:id` | |
| GET | `/admin/catalog` | all guest houses, rooms, halls (incl. inactive) |
| POST / PUT | `/admin/guest-houses[/:id]` | `{ name, location, description?, contact_phone?, status? }` |
| POST / PUT | `/admin/rooms[/:id]` | `{ guest_house_id, room_number, room_type, total_beds, description?, status? }` |
| POST / PUT | `/admin/halls[/:id]` | `{ guest_house_id, name, capacity, description?, status? }` |
| PUT | `/admin/rates` | `{ rates: [{ guest_type, rate_type: "Room"\|"Hall", amount }] }` |
| GET | `/admin/hall-bookings?status` | |
| POST | `/admin/hall-bookings/:id/approve` / `reject` | reject needs `{ note }` |

## Incharge (Incharge, Admin, Super Admin; F-27, F-28)

| Method | Path | Body / notes |
|---|---|---|
| GET | `/incharge/bookings?range=today\|week\|all&q` | approved stays |
| GET | `/incharge/today` | arrivals, departures, in house, overdue, hall events |
| POST | `/incharge/bookings/:id/check-in` | from the check-in date |
| POST | `/incharge/bookings/:id/check-out` | marks Completed |
| POST | `/incharge/payments` | `{ booking_id \| hall_booking_id, amount, method: Cash\|Bank Transfer\|mBoB, reference_no (not for Cash) }`; cannot exceed what is due |

## Super Admin (F-29)

| Method | Path | Body / notes |
|---|---|---|
| GET | `/super/users?q&role` | |
| PATCH | `/super/users/:id` | `{ role?, status? }`; not yourself; at least one active Super Admin stays |
