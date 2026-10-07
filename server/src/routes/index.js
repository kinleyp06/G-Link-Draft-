import { Router } from 'express';
import { asyncHandler as h } from '../utils/asyncHandler.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { ADMIN_ROLES, STAFF_ROLES } from '../utils/constants.js';
import * as auth from '../controllers/authController.js';
import * as catalog from '../controllers/catalogController.js';
import * as booking from '../controllers/bookingController.js';
import * as admin from '../controllers/adminController.js';
import * as staff from '../controllers/staffController.js';

// All routes are mounted under /api. See docs/api/README.md.
export function apiRouter({ limits = true } = {}) {
  const r = Router();
  const limit = limits
    ? rateLimit({ max: 10, key: (req) => `${req.ip}|${String(req.body?.email || '').toLowerCase()}` })
    : (req, res, next) => next();

  // ---- auth (F-04 to F-08)
  r.post('/auth/signup', limit, h(auth.signup));
  r.post('/auth/verify-email', h(auth.verifyEmail));
  r.post('/auth/resend-verification', limit, h(auth.resendVerification));
  r.post('/auth/login', limit, h(auth.login));
  r.post('/auth/forgot-password', limit, h(auth.forgotPassword));
  r.post('/auth/reset-password', limit, h(auth.resetPassword));
  r.get('/auth/me', requireAuth, h(auth.me));
  r.patch('/users/me', requireAuth, h(auth.updateProfile));
  r.post('/users/me/password', requireAuth, h(auth.changePassword));

  // ---- catalogue (public: anyone can look at rooms)
  r.get('/guest-houses', h(catalog.guestHouses));
  r.get('/rooms', h(catalog.rooms));
  r.get('/rooms/:id', h(catalog.room));
  r.get('/halls', h(catalog.halls));
  r.get('/rates', h(catalog.rates));

  // ---- guest bookings (F-11 to F-18)
  r.post('/bookings/quote', requireAuth, h(booking.quote));
  r.post('/bookings', requireAuth, h(booking.create));
  r.get('/bookings/mine', requireAuth, h(booking.listMine));
  r.get('/bookings/:id', requireAuth, h(booking.detail));
  r.post('/bookings/:id/cancel', requireAuth, h(booking.cancel));
  r.post('/bookings/:id/extensions', requireAuth, h(booking.requestExtension));
  r.get('/hall-bookings/mine', requireAuth, h(booking.listMyHall));
  r.get('/hall-bookings/slots', requireAuth, h(booking.hallSlots));
  r.post('/hall-bookings', requireAuth, h(booking.createHall));
  r.post('/hall-bookings/:id/cancel', requireAuth, h(booking.cancelHall));

  // ---- admin (F-19 to F-26); Super Admin can do everything an Admin can
  const isAdmin = [requireAuth, requireRole(...ADMIN_ROLES)];
  r.get('/admin/dashboard', isAdmin, h(admin.dashboard));
  r.get('/admin/bookings', isAdmin, h(admin.listBookings));
  r.post('/admin/bookings/international', isAdmin, h(admin.international));
  r.post('/admin/bookings/:id/approve', isAdmin, h(admin.approve));
  r.post('/admin/bookings/:id/reject', isAdmin, h(admin.reject));
  r.post('/admin/bookings/:id/cancel', isAdmin, h(admin.cancel));
  r.get('/admin/bookings/:id/rooms', isAdmin, h(admin.roomsForBooking));
  r.post('/admin/bookings/:id/change-room', isAdmin, h(admin.changeRoom));
  r.get('/admin/availability', isAdmin, h(admin.availability));
  r.get('/admin/extensions', isAdmin, h(admin.listExtensions));
  r.post('/admin/extensions/:id/approve', isAdmin, h(admin.approveExtension));
  r.post('/admin/extensions/:id/reject', isAdmin, h(admin.rejectExtension));
  r.get('/admin/room-blocks', isAdmin, h(admin.listBlocks));
  r.post('/admin/room-blocks', isAdmin, h(admin.createBlock));
  r.delete('/admin/room-blocks/:id', isAdmin, h(admin.deleteBlock));
  r.get('/admin/catalog', isAdmin, h(admin.catalogAll));
  r.post('/admin/guest-houses', isAdmin, h(admin.createGuestHouse));
  r.put('/admin/guest-houses/:id', isAdmin, h(admin.updateGuestHouse));
  r.post('/admin/rooms', isAdmin, h(admin.createRoom));
  r.put('/admin/rooms/:id', isAdmin, h(admin.updateRoom));
  r.post('/admin/halls', isAdmin, h(admin.createHall));
  r.put('/admin/halls/:id', isAdmin, h(admin.updateHall));
  r.put('/admin/rates', isAdmin, h(admin.saveRates));
  r.get('/admin/hall-bookings', isAdmin, h(admin.listHallBookings));
  r.post('/admin/hall-bookings/:id/approve', isAdmin, h(admin.approveHall));
  r.post('/admin/hall-bookings/:id/reject', isAdmin, h(admin.rejectHall));

  // ---- incharge (F-27, F-28); admins can use these screens too
  const isStaff = [requireAuth, requireRole(...STAFF_ROLES)];
  r.get('/incharge/bookings', isStaff, h(staff.listBookings));
  r.get('/incharge/today', isStaff, h(staff.today));
  r.post('/incharge/bookings/:id/check-in', isStaff, h(staff.checkIn));
  r.post('/incharge/bookings/:id/check-out', isStaff, h(staff.checkOut));
  r.post('/incharge/payments', isStaff, h(staff.recordPayment));

  // ---- super admin (F-29)
  const isSuper = [requireAuth, requireRole('Super Admin')];
  r.get('/super/users', isSuper, h(staff.listUsers));
  r.patch('/super/users/:id', isSuper, h(staff.updateUser));

  return r;
}
