# G-Link data model

All tables: `ENGINE=InnoDB`, `utf8mb4` / `utf8mb4_unicode_ci`, names follow the rules in `setup_notes.md`.

> **Check against the Data Types document.** `users` follows the D-03 spec exactly. The other eleven
> tables were designed from the plan's screens (F-04 to F-29) because the Data Types document was not
> available when they were written. Where a column name or ENUM differs from that document, the
> document wins: change the `.sql` file and the matching server model.

## Tables

| # | Table | Purpose | Key rules |
|---|---|---|---|
| 01 | `users` | Accounts (guests and staff) | `uk_users_email`, `uk_users_citizenship_id`; role Guest / Incharge / Admin / Super Admin |
| 02 | `guest_houses` | Each RUB guest house | `uk_guest_houses_name` |
| 03 | `rooms` | Rooms with a number of beds | `uk_rooms_guest_house_id_room_number`; 1–20 beds; Single / Double / Dormitory |
| 04 | `halls` | Meeting halls | capacity ≥ 1 |
| 05 | `rates` | Current rate per guest type (Room per bed per night, Hall per day) | one row per (guest_type, rate_type) |
| 06 | `bookings` | Room bookings | `check_out > check_in`; beds ≥ 1; status Pending / Approved / Rejected / Cancelled / Completed |
| 07 | `booking_guests` | Extra people on a booking | deleted with the booking |
| 08 | `room_sharing` | Approved bookings that share a room on the same nights | filled when a booking is approved |
| 09 | `stay_extensions` | Requests to stay longer | `new_check_out > current_check_out`; Pending / Approved / Rejected |
| 10 | `room_blocks` | Beds taken out of use for some dates | `end_date > start_date` |
| 11 | `hall_bookings` | Hall bookings for part of a day | `end_time > start_time` |
| 12 | `payments` | Money received | exactly one of `booking_id` / `hall_booking_id`; amount > 0; Cash / Bank Transfer / mBoB |

## Business rules the server applies

- **Dates.** `check_out` (and `end_date` for blocks) is the morning the guest leaves, so it is not a night.
  Nights = `check_out - check_in`.
- **Free beds** for a room and dates = `total_beds` − the most beds in use on any one night, where
  "in use" = beds of *Pending* and *Approved* bookings + blocked beds. Pending bookings hold their beds
  so two people cannot ask for the last bed.
- **Beds on a booking** = 1 (the account holder) + extra guests. For an international booking made by an
  admin, beds = the guests listed.
- **Bill** = nights × beds × the room rate for the guest type at the time of booking (`rate_amount`).
  An extension adds extra nights × beds × the same `rate_amount`.
- **Sharing.** A Dormitory is always shared. In a Double, a guest who books fewer beds than the room has
  can tick "share"; otherwise the booking takes the whole room.
- **Paid** when the sum of `payments.amount` for the booking ≥ `total_amount`.
- International bookings are made by an Admin and start as *Approved*.
- Pending bookings whose check-in date has passed are cancelled automatically by the server.

## Run order

`schema/00` … `schema/12`, then `seed/01_sample_data.sql`. `sh database/setup_all.sh -u root -p` does all of it.
Checks: `tests/01_users_checks.sql`, `tests/02_booking_rules_checks.sql` (each prints PASS / FAIL).
