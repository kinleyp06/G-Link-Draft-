# Decisions and assumptions to confirm with the team

Made while building the full system on 7 Oct 2026 without the Data Types document, the full task plan or the
business-rule notes. Each one is easy to change; please confirm or correct.

## Data
1. Eleven tables besides `users` were designed from the screens (see `database/data_model.md`). Column names, sizes
   and ENUM values must be checked against the **Data Types document**.
2. Guest types: `RUB Staff`, `RUB Student`, `Official`, `Private`, `International` (rates per guest type).
3. Room types: `Single`, `Double`, `Dormitory`; 1–20 beds per room.
4. Payment methods: `Cash`, `Bank Transfer`, `mBoB`.
5. Booking refs are shown as `GL-0012`, hall bookings as `GH-0003` (from the id; not stored).

## Rules
6. Guests book **beds**. Beds = account holder + extra guests. A Dormitory is always shared; a Double can be booked
   privately (it then needs the whole room free) and is billed per person.
7. Bill = nights × beds × rate per bed per night. Hall = one day rate per booking, whatever the hours.
8. Pending requests hold their beds (prevents two people getting the last bed). Unreviewed requests are cancelled
   automatically once their date passes.
9. Max stay 30 nights; book up to one year ahead; one pending extension per booking.
10. Name, last name and phone are required before booking (sign-up asks only email + password).
11. Payment happens at the guest house; there is no online payment.
12. International bookings are made by an admin and start Approved; the admin's account is the booker.
13. New staff sign up as guests, then the Super Admin changes their role.
14. Times and "today" use Bhutan time (Asia/Thimphu).

## Task IDs
15. Only D-01, D-03, B-01, F-01, O-01, O-02 and F-04…F-29 screen names came from the plan. Other IDs used in commit
    messages (D-04…D-15, B-02…B-10, F-02, F-03, F-07, F-08, F-11…F-18 numbering, O-00) were chosen by Claude; see
    `docs/task-plan/task-list.md` and rename them in the plan if they differ.
