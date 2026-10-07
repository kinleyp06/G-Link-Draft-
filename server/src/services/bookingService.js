import { withTransaction } from '../config/db.js';
import * as catalog from '../models/catalogModel.js';
import * as bookings from '../models/bookingModel.js';
import { canFit } from './availability.js';
import { roomBill, extensionCost } from './billing.js';
import { profileComplete } from './userService.js';
import { checkStayDates, notFound, todayHere } from './stayRules.js';
import { AppError } from '../utils/AppError.js';
import { Validator } from '../utils/validate.js';
import { GENDERS, SELF_GUEST_TYPES, STAFF_ROLES, MAX_NIGHTS } from '../utils/constants.js';
import { nightsBetween } from '../utils/dates.js';
import { sendEmail } from '../emails/mailer.js';
import { templates } from '../emails/templates.js';

// Reads the list of people on a booking (F-12). Each needs a name; the rest is optional.
export function readGuests(v, list, { requirePassport = false, max = 19 } = {}) {
  if (list === undefined || list === null) return [];
  if (!Array.isArray(list)) {
    v.fail('guests', 'Guests must be a list.');
    return [];
  }
  if (list.length > max) v.fail('guests', `At most ${max} extra guests fit in this room.`);
  return list.slice(0, 20).map((g, i) => {
    const gv = new Validator(g || {});
    const guest = {
      full_name: gv.string('full_name', { label: 'Full name', max: 50 }),
      gender: gv.oneOf('gender', GENDERS, { label: 'Gender', required: false }),
      citizenship_id: gv.string('citizenship_id', {
        label: requirePassport ? 'Passport number' : 'CID / passport number',
        required: requirePassport,
        max: 20,
      }),
      nationality: gv.string('nationality', { label: 'Nationality', required: requirePassport, max: 50 }) || 'Bhutanese',
      phone_number: gv.phone('phone_number', { max: 15 }),
    };
    v.merge(`guests[${i}]`, gv);
    return guest;
  });
}

// Shared by quote and create: checks everything and works out the bill.
async function prepare(user, body, conn, { lock = false } = {}) {
  const v = new Validator(body);
  const roomId = v.int('room_id', { label: 'Room', min: 1 });
  const checkIn = v.date('check_in', { label: 'Check-in' });
  const checkOut = v.date('check_out', { label: 'Check-out' });
  const guestType = v.oneOf('guest_type', SELF_GUEST_TYPES, { label: 'Guest type' });
  const purpose = v.string('purpose', { label: 'Purpose of visit', required: false, max: 255 });
  let shareRoom = v.bool('share_room');
  const guests = readGuests(v, body?.guests);
  checkStayDates(v, checkIn, checkOut);
  v.done();

  const room = await catalog.findRoom(roomId, conn, { lock });
  if (!room || room.status !== 'Active' || room.guest_house_status !== 'Active') throw notFound('Room');

  const beds = 1 + guests.length;
  if (beds > room.total_beds) {
    throw new AppError(`Room ${room.room_number} has ${room.total_beds} bed(s); you asked for ${beds}.`, 400, 'TOO_MANY_GUESTS');
  }
  if (room.room_type === 'Dormitory') shareRoom = true; // a dormitory is always shared
  if (beds === room.total_beds) shareRoom = false; // the whole room is yours anyway

  const rate = await catalog.findRate(guestType, 'Room', conn);
  if (rate === undefined) throw new AppError(`No room rate is set for ${guestType}. Contact the admin.`, 409, 'NO_RATE');

  const occ = await bookings.occupancy(room.room_id, checkIn, checkOut, {}, conn);
  const fit = canFit({ totalBeds: room.total_beds, checkIn, checkOut, ...occ, beds, shareRoom });
  const bill = roomBill({ checkIn, checkOut, beds, rate });
  return { room, checkIn, checkOut, guestType, purpose, shareRoom, guests, beds, rate, bill, fit };
}

function requireProfile(user) {
  if (!profileComplete(user)) {
    throw new AppError('Please add your name and phone number in your profile before booking.', 400, 'PROFILE_INCOMPLETE');
  }
}

function noRoomError(p) {
  const msg = p.shareRoom
    ? `Only ${p.fit.free} bed(s) are free in room ${p.room.room_number} on those dates.`
    : `Room ${p.room.room_number} is not free for a private stay on those dates. Try sharing or another room.`;
  return new AppError(msg, 409, 'NOT_ENOUGH_BEDS');
}

// F-14: the bill before sending the request
export async function quote(user, body) {
  const p = await prepare(user, body);
  return {
    room: { room_id: p.room.room_id, room_number: p.room.room_number, room_type: p.room.room_type, guest_house_name: p.room.guest_house_name },
    check_in: p.checkIn,
    check_out: p.checkOut,
    guest_type: p.guestType,
    share_room: p.shareRoom,
    beds: p.beds,
    nights: p.bill.nights,
    rate: p.rate,
    total: p.bill.total,
    free_beds: p.fit.free,
    available: p.fit.ok,
  };
}

// F-11 to F-14: send the booking request
export async function create(user, body) {
  requireProfile(user);
  const booking = await withTransaction(async (conn) => {
    const p = await prepare(user, body, conn, { lock: true }); // room row locked: no double booking
    if (!p.fit.ok) throw noRoomError(p);
    const id = await bookings.insertBooking(
      {
        user_id: user.user_id,
        room_id: p.room.room_id,
        check_in: p.checkIn,
        check_out: p.checkOut,
        beds: p.beds,
        guest_type: p.guestType,
        purpose: p.purpose,
        share_room: p.shareRoom,
        rate_amount: p.rate,
        total_amount: p.bill.total,
      },
      conn
    );
    await bookings.insertGuests(id, p.guests, conn);
    return bookings.findBooking(id, conn);
  });
  await sendEmail({ to: user.email, ...templates.bookingReceived(booking) });
  return { booking };
}

// F-15
export async function listMine(user, query) {
  const now = todayHere();
  let list = await bookings.listBookings({ userId: user.user_id });
  if (query?.when === 'upcoming') list = list.filter((b) => b.check_out >= now && ['Pending', 'Approved'].includes(b.status));
  if (query?.when === 'past') list = list.filter((b) => !(b.check_out >= now && ['Pending', 'Approved'].includes(b.status)));
  return { bookings: list };
}

// Owner, or any staff member, may see a booking.
export async function loadVisible(user, id) {
  const booking = await bookings.findBooking(id);
  if (!booking) throw notFound('Booking');
  if (booking.user_id !== user.user_id && !STAFF_ROLES.includes(user.role)) throw notFound('Booking');
  return booking;
}

// F-16 (also used by staff screens)
export async function detail(user, id) {
  const booking = await loadVisible(user, id);
  const [guests, extensions, payments, sharing] = await Promise.all([
    bookings.listGuests(id),
    bookings.listExtensions({ bookingId: id }),
    bookings.listPayments({ bookingId: id }),
    bookings.sharingSummary(id),
  ]);
  return { booking, guests, extensions, payments, sharing };
}

export async function cancel(user, id) {
  const booking = await withTransaction(async (conn) => {
    const b = await bookings.findBooking(id, conn, { lock: true });
    if (!b || b.user_id !== user.user_id) throw notFound('Booking');
    if (!['Pending', 'Approved'].includes(b.status) || b.checked_in_at) {
      throw new AppError('This booking can no longer be cancelled.', 409, 'CANNOT_CANCEL');
    }
    await bookings.setStatus(id, { status: 'Cancelled', adminNote: 'Cancelled by the guest.' }, conn);
    await bookings.clearSharing(id, conn);
    return bookings.findBooking(id, conn);
  });
  await sendEmail({ to: user.email, ...templates.bookingCancelled(booking) });
  return { booking };
}

// F-17: ask to stay longer
export async function requestExtension(user, id, body) {
  const v = new Validator(body);
  const newCheckOut = v.date('new_check_out', { label: 'New check-out date' });
  const reason = v.string('reason', { label: 'Reason', max: 255 });
  v.done();

  const { booking, ext } = await withTransaction(async (conn) => {
    const b = await bookings.findBooking(id, conn, { lock: true });
    if (!b || b.user_id !== user.user_id) throw notFound('Booking');
    if (b.status !== 'Approved') throw new AppError('Only an approved booking can be extended.', 409, 'CANNOT_EXTEND');
    if (newCheckOut <= b.check_out) {
      throw new AppError('The new check-out date must be after the current one.', 400, 'VALIDATION_ERROR', {
        new_check_out: `Choose a date after ${b.check_out}.`,
      });
    }
    if (nightsBetween(b.check_in, newCheckOut) > MAX_NIGHTS) {
      throw new AppError(`A stay can be at most ${MAX_NIGHTS} nights.`, 400, 'VALIDATION_ERROR', {
        new_check_out: `A stay can be at most ${MAX_NIGHTS} nights.`,
      });
    }
    const pending = await bookings.listExtensions({ bookingId: id, status: 'Pending' }, conn);
    if (pending.length) throw new AppError('You already have a request waiting for this booking.', 409, 'EXTENSION_PENDING');
    const cost = extensionCost({ currentCheckOut: b.check_out, newCheckOut, beds: b.beds, rate: b.rate_amount });
    const extId = await bookings.insertExtension(
      { booking_id: id, current_check_out: b.check_out, new_check_out: newCheckOut, reason, extra_amount: cost.total },
      conn
    );
    return { booking: b, ext: await bookings.findExtension(extId, conn) };
  });
  await sendEmail({ to: user.email, ...templates.extensionReceived(booking, ext) });
  return { extension: ext };
}

