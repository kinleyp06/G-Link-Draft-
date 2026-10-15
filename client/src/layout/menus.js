// Side menu for each role (from the plan). Super Admin = Accounts plus the admin pages.
const ADMIN = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/requests', label: 'Booking requests' },
  { to: '/admin/extensions', label: 'Extension requests' },
  { to: '/admin/international', label: 'International booking' },
  { to: '/admin/blocks', label: 'Block rooms/beds' },
  { to: '/admin/change-room', label: 'Change room' },
  { to: '/admin/rooms', label: 'Rooms & hall' },
  { to: '/admin/rates', label: 'Rate table' },
];

export const MENUS = {
  Guest: [
    { to: '/rooms', label: 'Rooms' },
    { to: '/bookings', label: 'My bookings' },
    { to: '/hall', label: 'Meeting hall' },
    { to: '/profile', label: 'Profile' },
  ],
  Admin: ADMIN,
  Incharge: [
    { to: '/incharge/bookings', label: 'Bookings' },
    { to: '/incharge/today', label: 'Today' },
    { to: '/incharge/desk', label: 'Check-in/out' },
  ],
  'Super Admin': [{ to: '/super/accounts', label: 'Accounts' }, ...ADMIN],
};
