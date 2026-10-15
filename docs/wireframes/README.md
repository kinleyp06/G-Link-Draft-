# G-Link wireframes

Low-fidelity wireframes, one SVG per screen. Each drawing names its task ID in the bottom bar.
They show the main fields and buttons only; colours and exact spacing come from `client/STYLE_GUIDE.md`.

- **O-02** Admin, Incharge and Super Admin screens: `admin-incharge-superadmin/`
- **O-01** Guest screens: `guest/` (first half F-04 to F-10, second half F-11 to F-18)

> F-11 to F-18 are numbered in the order of the plan (booking form, extra guest form, shared-room notice,
> bill, My bookings, booking detail, longer-stay request, meeting hall). Check the numbers against the task plan.

To change a drawing, edit `SCREENS` in `tools/make_wireframes.py` and run
`python3 docs/wireframes/tools/make_wireframes.py` from the repository root. It rewrites the SVGs and this file.

## Files

| File | Task | Screen | Role |
|---|---|---|---|
| [`guest/F-04-sign-in.svg`](guest/F-04-sign-in.svg) | F-04 | Sign in | Signed out |
| [`guest/F-05-sign-up.svg`](guest/F-05-sign-up.svg) | F-05 | Sign up | Signed out |
| [`guest/F-06-check-email.svg`](guest/F-06-check-email.svg) | F-06 | Check your email | Signed out |
| [`guest/F-09-room-list.svg`](guest/F-09-room-list.svg) | F-09 | Room list with free beds | Guest |
| [`guest/F-10-room-page.svg`](guest/F-10-room-page.svg) | F-10 | Room page | Guest |
| [`guest/F-11-booking-form.svg`](guest/F-11-booking-form.svg) | F-11 | Booking form | Guest |
| [`guest/F-12-extra-guest-form.svg`](guest/F-12-extra-guest-form.svg) | F-12 | Extra guest form | Guest |
| [`guest/F-13-shared-room-notice.svg`](guest/F-13-shared-room-notice.svg) | F-13 | Shared-room notice | Guest |
| [`guest/F-14-bill.svg`](guest/F-14-bill.svg) | F-14 | Bill page | Guest |
| [`guest/F-15-my-bookings.svg`](guest/F-15-my-bookings.svg) | F-15 | My bookings | Guest |
| [`guest/F-16-booking-detail.svg`](guest/F-16-booking-detail.svg) | F-16 | Booking detail | Guest |
| [`guest/F-17-longer-stay-request.svg`](guest/F-17-longer-stay-request.svg) | F-17 | Longer-stay request | Guest |
| [`guest/F-18-meeting-hall.svg`](guest/F-18-meeting-hall.svg) | F-18 | Meeting hall page | Guest |
| [`admin-incharge-superadmin/F-19-admin-home.svg`](admin-incharge-superadmin/F-19-admin-home.svg) | F-19 | Admin home | Admin |
| [`admin-incharge-superadmin/F-20-booking-requests.svg`](admin-incharge-superadmin/F-20-booking-requests.svg) | F-20 | Booking requests list | Admin |
| [`admin-incharge-superadmin/F-20-booking-review.svg`](admin-incharge-superadmin/F-20-booking-review.svg) | F-20 | Booking review (Approve / Reject) | Admin |
| [`admin-incharge-superadmin/F-21-extension-requests.svg`](admin-incharge-superadmin/F-21-extension-requests.svg) | F-21 | Extension requests | Admin |
| [`admin-incharge-superadmin/F-22-international-booking.svg`](admin-incharge-superadmin/F-22-international-booking.svg) | F-22 | International guest booking | Admin |
| [`admin-incharge-superadmin/F-23-block-rooms-beds.svg`](admin-incharge-superadmin/F-23-block-rooms-beds.svg) | F-23 | Block rooms or beds | Admin |
| [`admin-incharge-superadmin/F-24-change-room.svg`](admin-incharge-superadmin/F-24-change-room.svg) | F-24 | Change room | Admin |
| [`admin-incharge-superadmin/F-25-rooms-and-hall.svg`](admin-incharge-superadmin/F-25-rooms-and-hall.svg) | F-25 | Rooms and hall | Admin |
| [`admin-incharge-superadmin/F-26-rate-table.svg`](admin-incharge-superadmin/F-26-rate-table.svg) | F-26 | Rate table editor | Admin |
| [`admin-incharge-superadmin/F-27-incharge-bookings.svg`](admin-incharge-superadmin/F-27-incharge-bookings.svg) | F-27 | Incharge bookings | Incharge |
| [`admin-incharge-superadmin/F-28-check-in-out.svg`](admin-incharge-superadmin/F-28-check-in-out.svg) | F-28 | Check-in and check-out | Incharge |
| [`admin-incharge-superadmin/F-29-manage-accounts.svg`](admin-incharge-superadmin/F-29-manage-accounts.svg) | F-29 | Super Admin: manage accounts | Super Admin |

## Role menus

- **Guest**: Rooms, My bookings, Meeting hall, Profile
- **Admin**: Dashboard, Booking requests, Extension requests, International booking, Block rooms/beds, Change room, Rooms & hall, Rate table
- **Incharge**: Bookings, Today, Check-in/out
- **Super Admin**: Accounts, Dashboard, Booking requests, Extension requests, International booking, Block rooms/beds, Change room, Rooms & hall, Rate table
