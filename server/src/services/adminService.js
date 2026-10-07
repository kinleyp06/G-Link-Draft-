import { withTransaction, getPool } from '../config/db.js';
import * as catalog from '../models/catalogModel.js';
import * as bookings from '../models/bookingModel.js';
import * as halls from '../models/hallBookingModel.js';
import { canFit, freeBeds } from './availability.js';
import { roomBill } from './billing.js';
import { readGuests } from './bookingService.js';
import { checkStayDates, notFound, todayHere } from './stayRules.js';
import { AppError } from '../utils/AppError.js';
import { Validator } from '../utils/validate.js';
import { addDays } from '../utils/dates.js';
import { BOOKING_STATUSES, GUEST_TYPES, RATE_TYPES, ROOM_TYPES, USER_STATUSES } from '../utils/constants.js';
import { sendEmail } from '../emails/mailer.js';
import { templates } from '../emails/templates.js';

const emailGuest = (b, tpl) => sendEmail({ to: b.user_email, ...tpl });

// ---------------------------------------------------------------- F-19 dashboard
export async function dashboard() {
  const now = todayHere();
  const [pending, extensions, hallPending, rooms] = await Promise.all([
    bookings.listBookings({ status: 'Pending', order: 'upcoming' }),
    bookings.listExtensions({ status: 'Pending' }),
    halls.list({ status: 'Pending' }),
    catalog.listRooms(),
  ]);
  const occ = await bookings.occupancy(rooms.map((r) => r.room_id), now, addDays(now, 1));
  const free = rooms.reduce(
    (sum, r) =>
      sum +
      freeBeds({
        totalBeds: r.total_beds,
        checkIn: now,
        checkOut: addDays(now, 1),
        bookings: occ.bookings.filter((b) => b.room_id === r.room_id),
        blocks: occ.blocks.filter((k) => k.room_id === r.room_id),
      }),
    0
  );
  const [[inHouse]] = await getPool().query(
    "SELECT COALESCE(SUM(beds), 0) AS guests FROM bookings WHERE status = 'Approved' AND checked_in_at IS NOT NULL AND checked_out_at IS NULL"
  );
  const [[arrivals]] = await getPool().query("SELECT COUNT(*) AS n FROM bookings WHERE status = 'Approved' AND check_in = ?", [now]);
  return {
    today: now,
    counts: {
      pending_bookings: pending.length,
      pending_extensions: extensions.length,
      pending_hall_bookings: hallPending.length,
      guests_in_house: Number(inHouse.guests),
      arrivals_today: Number(arrivals.n),
      free_beds_tonight: free,
      total_beds: rooms.reduce((s, r) => s + r.total_beds, 0),
    },
    pending: pending.slice(0, 10),
  };
}

// ---------------------------------------------------------------- F-20 booking requests
export async function listBookings(query) {
  const v = new Validator(query);
  const status = v.oneOf('status', BOOKING_STATUSES, { label: 'Status', required: false });
  const guestHouseId = v.int('guest_house_id', { required: false, min: 1 });
  const q = v.string('q', { required: false, max: 100 });
  v.done();
  return { bookings: await bookings.listBookings({ status, guestHouseId, q, order: status === 'Pending' ? 'upcoming' : undefined }) };
}

export async function approve(admin, id, body) {
  const v = new Validator(body);
  const note = v.string('note', { label: 'Note', required: false, max: 255 });
  v.done();
  const booking = await withTransaction(async (conn) => {
    const b = await bookings.findBooking(id, conn, { lock: true });
    if (!b) throw notFound('Booking');
    if (b.status !== 'Pending') throw new AppError(`This booking is already ${b.status}.`, 409, 'NOT_PENDING');
    await catalog.findRoom(b.room_id, conn, { lock: true });
    // Pending bookings already hold their beds, but a block may have been added since.
    const occ = await bookings.occupancy(b.room_id, b.check_in, b.check_out, { excludeBookingId: id }, conn);
    const fit = canFit({ totalBeds: b.total_beds, checkIn: b.check_in, checkOut: b.check_out, ...occ, beds: b.beds, shareRoom: b.share_room });
    if (!fit.ok) throw new AppError('The room no longer has enough free beds. Change the room first, or reject.', 409, 'NOT_ENOUGH_BEDS');
    await bookings.setStatus(id, { status: 'Approved', adminNote: note, reviewedBy: admin.user_id }, conn);
    const updated = await bookings.findBooking(id, conn);
    await bookings.refreshSharing(updated, conn);
    return updated;
  });
  await emailGuest(booking, templates.bookingApproved(booking));
  return { booking };
}

export async function reject(admin, id, body) {
  const v = new Validator(body);
  const note = v.string('note', { label: 'Reason', max: 255 });
  v.done();
  const booking = await withTransaction(async (conn) => {
    const b = await bookings.findBooking(id, conn, { lock: true });
    if (!b) throw notFound('Booking');
    if (b.status !== 'Pending') throw new AppError(`This booking is already ${b.status}.`, 409, 'NOT_PENDING');
    await bookings.setStatus(id, { status: 'Rejected', adminNote: note, reviewedBy: admin.user_id }, conn);
    return bookings.findBooking(id, conn);
  });
  await emailGuest(booking, templates.bookingRejected(booking));
  return { booking };
}

// Admin cancels an approved booking (e.g. the guest phoned to cancel).
export async function cancelBooking(admin, id, body) {
  const v = new Validator(body);
  const note = v.string('note', { label: 'Reason', max: 255 });
  v.done();
  const booking = await withTransaction(async (conn) => {
    const b = await bookings.findBooking(id, conn, { lock: true });
    if (!b) throw notFound('Booking');
    if (!['Pending', 'Approved'].includes(b.status) || b.checked_in_at) {
      throw new AppError('This booking can no longer be cancelled.', 409, 'CANNOT_CANCEL');
    }
    await bookings.setStatus(id, { status: 'Cancelled', adminNote: note, reviewedBy: admin.user_id }, conn);
    await bookings.clearSharing(id, conn);
    return bookings.findBooking(id, conn);
  });
  await emailGuest(booking, templates.bookingCancelled(booking));
  return { booking };
}

// ---------------------------------------------------------------- F-24 change room
export async function changeRoom(admin, id, body) {
  const v = new Validator(body);
  const roomId = v.int('room_id', { label: 'New room', min: 1 });
  const reason = v.string('reason', { label: 'Reason', required: false, max: 255 });
  v.done();
  const booking = await withTransaction(async (conn) => {
    const b = await bookings.findBooking(id, conn, { lock: true });
    if (!b) throw notFound('Booking');
    if (!['Pending', 'Approved'].includes(b.status)) throw new AppError(`A ${b.status} booking cannot be moved.`, 409, 'CANNOT_MOVE');
    if (roomId === b.room_id) throw new AppError('The booking is already in that room.', 400, 'SAME_ROOM');
    const room = await catalog.findRoom(roomId, conn, { lock: true });
    if (!room || room.status !== 'Active') throw notFound('Room');
    if (b.beds > room.total_beds) throw new AppError(`Room ${room.room_number} has only ${room.total_beds} bed(s).`, 409, 'NOT_ENOUGH_BEDS');
    const shareRoom = room.room_type === 'Dormitory' ? true : b.beds === room.total_beds ? false : b.share_room;
    // Only the nights still to come matter if the guest is already in.
    const from = b.checked_in_at && todayHere() > b.check_in ? todayHere() : b.check_in;
    const occ = await bookings.occupancy(room.room_id, from, b.check_out, { excludeBookingId: id }, conn);
    const fit = canFit({ totalBeds: room.total_beds, checkIn: from, checkOut: b.check_out, ...occ, beds: b.beds, shareRoom });
    if (!fit.ok) throw new AppError(`Room ${room.room_number} does not have enough free beds on those dates.`, 409, 'NOT_ENOUGH_BEDS');
    await bookings.setRoom(id, room.room_id, conn);
    await conn.query('UPDATE bookings SET share_room = ? WHERE booking_id = ?', [shareRoom, id]);
    const updated = await bookings.findBooking(id, conn);
    if (updated.status === 'Approved') await bookings.refreshSharing(updated, conn);
    return updated;
  });
  await emailGuest(booking, templates.roomChanged(booking, reason));
  return { booking };
}

// Rooms an existing booking could move to (F-24 list).
export async function roomsForBooking(id) {
  const b = await bookings.findBooking(id);
  if (!b) throw notFound('Booking');
  const rooms = (await catalog.listRooms()).filter((r) => r.room_id !== b.room_id);
  const occ = await bookings.occupancy(rooms.map((r) => r.room_id), b.check_in, b.check_out, { excludeBookingId: id });
  return {
    booking: b,
    rooms: rooms.map((r) => {
      const fb = freeBeds({
        totalBeds: r.total_beds,
        checkIn: b.check_in,
        checkOut: b.check_out,
        bookings: occ.bookings.filter((x) => x.room_id === r.room_id),
        blocks: occ.blocks.filter((x) => x.room_id === r.room_id),
      });
      return { ...r, free_beds: fb, fits: fb >= b.beds && b.beds <= r.total_beds };
    }),
  };
}

// ---------------------------------------------------------------- F-22 international guest
export async function internationalBooking(admin, body) {
  const v = new Validator(body);
  const roomId = v.int('room_id', { label: 'Room', min: 1 });
  const checkIn = v.date('check_in', { label: 'Check-in' });
  const checkOut = v.date('check_out', { label: 'Check-out' });
  const purpose = v.string('purpose', { label: 'Purpose of visit', required: false, max: 255 });
  const guests = readGuests(v, body?.guests, { requirePassport: true });
  const shareWanted = v.bool('share_room');
  if (guests.length === 0) v.fail('guests', 'Add at least one guest.');
  checkStayDates(v, checkIn, checkOut);
  v.done();

  return withTransaction(async (conn) => {
    const room = await catalog.findRoom(roomId, conn, { lock: true });
    if (!room || room.status !== 'Active') throw notFound('Room');
    const beds = guests.length;
    if (beds > room.total_beds) throw new AppError(`Room ${room.room_number} has ${room.total_beds} bed(s).`, 400, 'TOO_MANY_GUESTS');
    const shareRoom = room.room_type === 'Dormitory' ? true : beds === room.total_beds ? false : shareWanted;
    const rate = await catalog.findRate('International', 'Room', conn);
    if (rate === undefined) throw new AppError('No room rate is set for International guests.', 409, 'NO_RATE');
    const occ = await bookings.occupancy(room.room_id, checkIn, checkOut, {}, conn);
    const fit = canFit({ totalBeds: room.total_beds, checkIn, checkOut, ...occ, beds, shareRoom });
    if (!fit.ok) throw new AppError(`Only ${fit.free} bed(s) are free in room ${room.room_number} on those dates.`, 409, 'NOT_ENOUGH_BEDS');
    const bill = roomBill({ checkIn, checkOut, beds, rate });
    const id = await bookings.insertBooking(
      { user_id: admin.user_id, room_id: room.room_id, check_in: checkIn, check_out: checkOut, beds, guest_type: 'International',
        purpose, share_room: shareRoom, is_international: true, rate_amount: rate, total_amount: bill.total,
        status: 'Approved', reviewed_by: admin.user_id },
      conn
    );
    await bookings.insertGuests(id, guests, conn);
    const created = await bookings.findBooking(id, conn);
    await bookings.refreshSharing(created, conn);
    return { booking: created };
  });
}

// ---------------------------------------------------------------- F-21 extensions
export async function listExtensions(query) {
  const v = new Validator(query);
  const status = v.oneOf('status', ['Pending', 'Approved', 'Rejected'], { required: false });
  v.done();
  const list = await bookings.listExtensions({ status });
  // Show whether the extra nights are free, so the admin knows before clicking.
  const withFree = await Promise.all(
    list.map(async (e) => {
      if (e.status !== 'Pending') return { ...e, room_free: null };
      const occ = await bookings.occupancy(e.room_id, e.current_check_out, e.new_check_out, { excludeBookingId: e.booking_id });
      const b = await bookings.findBooking(e.booking_id);
      const fit = canFit({ totalBeds: b.total_beds, checkIn: e.current_check_out, checkOut: e.new_check_out, ...occ, beds: b.beds, shareRoom: b.share_room });
      return { ...e, room_free: fit.ok };
    })
  );
  return { extensions: withFree };
}

export async function decideExtension(admin, extId, approveIt, body) {
  const v = new Validator(body);
  const note = v.string('note', { label: 'Reason', required: !approveIt, max: 255 });
  v.done();
  const { booking, ext } = await withTransaction(async (conn) => {
    const e = await bookings.findExtension(extId, conn, { lock: true });
    if (!e) throw notFound('Extension request');
    if (e.status !== 'Pending') throw new AppError(`This request is already ${e.status}.`, 409, 'NOT_PENDING');
    const b = await bookings.findBooking(e.booking_id, conn, { lock: true });
    if (approveIt) {
      if (b.status !== 'Approved') throw new AppError(`The booking is ${b.status}; it cannot be extended.`, 409, 'CANNOT_EXTEND');
      if (b.check_out !== e.current_check_out) throw new AppError('The booking dates changed since this request. Ask the guest to send a new one.', 409, 'STALE_REQUEST');
      await catalog.findRoom(b.room_id, conn, { lock: true });
      const occ = await bookings.occupancy(b.room_id, e.current_check_out, e.new_check_out, { excludeBookingId: b.booking_id }, conn);
      const fit = canFit({ totalBeds: b.total_beds, checkIn: e.current_check_out, checkOut: e.new_check_out, ...occ, beds: b.beds, shareRoom: b.share_room });
      if (!fit.ok) throw new AppError('The room is not free for the extra nights.', 409, 'NOT_ENOUGH_BEDS');
      await bookings.setCheckOut(b.booking_id, e.new_check_out, Math.round((b.total_amount + e.extra_amount) * 100) / 100, conn);
      await bookings.refreshSharing(await bookings.findBooking(b.booking_id, conn), conn);
    }
    await bookings.setExtensionStatus(extId, { status: approveIt ? 'Approved' : 'Rejected', adminNote: note, reviewedBy: admin.user_id }, conn);
    return { booking: await bookings.findBooking(b.booking_id, conn), ext: await bookings.findExtension(extId, conn) };
  });
  await emailGuest(booking, approveIt ? templates.extensionApproved(booking, ext) : templates.extensionRejected(booking, ext));
  return { extension: ext, booking };
}

// ---------------------------------------------------------------- F-23 room blocks
export async function listBlocks() {
  return { blocks: await bookings.listBlocks({ fromDate: todayHere() }) };
}

export async function createBlock(admin, body) {
  const v = new Validator(body);
  const roomId = v.int('room_id', { label: 'Room', min: 1 });
  const beds = v.int('beds', { label: 'Beds to block', min: 1, max: 20 });
  const start = v.date('start_date', { label: 'From' });
  const end = v.date('end_date', { label: 'To' });
  const reason = v.string('reason', { label: 'Reason', max: 255 });
  if (start && end && end <= start) v.fail('end_date', '"To" must be after "From".');
  if (start && start < todayHere()) v.fail('start_date', '"From" cannot be in the past.');
  v.done();
  return withTransaction(async (conn) => {
    const room = await catalog.findRoom(roomId, conn, { lock: true });
    if (!room) throw notFound('Room');
    if (beds > room.total_beds) throw new AppError(`Room ${room.room_number} has only ${room.total_beds} bed(s).`, 400, 'TOO_MANY_BEDS');
    const occ = await bookings.occupancy(roomId, start, end, {}, conn);
    const free = freeBeds({ totalBeds: room.total_beds, checkIn: start, checkOut: end, ...occ });
    if (beds > free) {
      throw new AppError(`Only ${free} bed(s) are free in room ${room.room_number} on those dates; bookings hold the rest.`, 409, 'BEDS_BOOKED');
    }
    const id = await bookings.insertBlock({ room_id: roomId, beds, start_date: start, end_date: end, reason, created_by: admin.user_id }, conn);
    return { block: (await bookings.listBlocks({}, conn)).find((k) => k.room_block_id === id) };
  });
}

export async function deleteBlock(id) {
  if (!(await bookings.deleteBlock(id))) throw notFound('Block');
  return { message: 'Block removed.' };
}

// ---------------------------------------------------------------- F-25 rooms, halls, guest houses
function readGuestHouse(body) {
  const v = new Validator(body);
  const f = {
    name: v.string('name', { label: 'Name', max: 100 }),
    location: v.string('location', { label: 'Location', max: 100 }),
    description: v.string('description', { label: 'Description', required: false, max: 500 }),
    contact_phone: v.phone('contact_phone', { label: 'Contact phone' }),
    status: v.oneOf('status', USER_STATUSES, { label: 'Status', required: false }) || 'Active',
  };
  v.done();
  return f;
}

function readRoom(body) {
  const v = new Validator(body);
  const f = {
    guest_house_id: v.int('guest_house_id', { label: 'Guest house', min: 1 }),
    room_number: v.string('room_number', { label: 'Room number', max: 10 }),
    room_type: v.oneOf('room_type', ROOM_TYPES, { label: 'Room type' }),
    total_beds: v.int('total_beds', { label: 'Beds', min: 1, max: 20 }),
    description: v.string('description', { label: 'Description', required: false, max: 500 }),
    status: v.oneOf('status', USER_STATUSES, { label: 'Status', required: false }) || 'Active',
  };
  if (f.room_type === 'Single' && f.total_beds > 1) v.fail('total_beds', 'A single room has 1 bed.');
  v.done();
  return f;
}

function readHall(body) {
  const v = new Validator(body);
  const f = {
    guest_house_id: v.int('guest_house_id', { label: 'Guest house', min: 1 }),
    name: v.string('name', { label: 'Name', max: 100 }),
    capacity: v.int('capacity', { label: 'Capacity', min: 1, max: 5000 }),
    description: v.string('description', { label: 'Description', required: false, max: 500 }),
    status: v.oneOf('status', USER_STATUSES, { label: 'Status', required: false }) || 'Active',
  };
  v.done();
  return f;
}

function duplicate(err, message, field) {
  if (err.code === 'ER_DUP_ENTRY') throw new AppError(message, 409, 'DUPLICATE', { [field]: message });
  if (err.code === 'ER_NO_REFERENCED_ROW_2') throw new AppError('That guest house does not exist.', 400, 'VALIDATION_ERROR', { guest_house_id: 'Choose a guest house.' });
  throw err;
}

export async function catalogAll() {
  const [guestHouses, rooms, hallList] = await Promise.all([
    catalog.listGuestHouses({ activeOnly: false }),
    catalog.listRooms({ activeOnly: false }),
    catalog.listHalls({ activeOnly: false }),
  ]);
  return { guest_houses: guestHouses, rooms, halls: hallList };
}

export async function saveGuestHouse(id, body) {
  const f = readGuestHouse(body);
  try {
    if (id) {
      if (!(await catalog.findGuestHouse(id))) throw notFound('Guest house');
      await catalog.updateGuestHouse(id, f);
    } else id = await catalog.createGuestHouse(f);
  } catch (err) {
    duplicate(err, 'A guest house with this name already exists.', 'name');
  }
  return { guest_house: await catalog.findGuestHouse(id) };
}

export async function saveRoom(id, body) {
  const f = readRoom(body);
  try {
    if (id) {
      const current = await catalog.findRoom(id);
      if (!current) throw notFound('Room');
      if (f.total_beds < current.total_beds) {
        const occ = await bookings.occupancy(id, todayHere(), addDays(todayHere(), 400));
        if (occ.bookings.some((b) => b.beds > f.total_beds)) {
          throw new AppError('Some upcoming bookings need more beds than that. Move them first.', 409, 'BEDS_IN_USE');
        }
      }
      await catalog.updateRoom(id, f);
    } else id = await catalog.createRoom(f);
  } catch (err) {
    duplicate(err, 'This guest house already has a room with that number.', 'room_number');
  }
  return { room: await catalog.findRoom(id) };
}

export async function saveHall(id, body) {
  const f = readHall(body);
  try {
    if (id) {
      if (!(await catalog.findHall(id))) throw notFound('Hall');
      await catalog.updateHall(id, f);
    } else id = await catalog.createHall(f);
  } catch (err) {
    duplicate(err, 'This guest house already has a hall with that name.', 'name');
  }
  return { hall: await catalog.findHall(id) };
}

// ---------------------------------------------------------------- F-26 rate table
export async function saveRates(admin, body) {
  const list = body?.rates;
  if (!Array.isArray(list) || list.length === 0) throw new AppError('Send at least one rate.', 400, 'VALIDATION_ERROR');
  const v = new Validator({});
  const clean = list.map((r, i) => {
    const rv = new Validator(r || {});
    const row = {
      guest_type: rv.oneOf('guest_type', GUEST_TYPES, { label: 'Guest type' }),
      rate_type: rv.oneOf('rate_type', RATE_TYPES, { label: 'Rate type' }),
      amount: rv.money('amount', { label: 'Amount' }),
    };
    v.merge(`rates[${i}]`, rv);
    return row;
  });
  v.done();
  await withTransaction(async (conn) => {
    for (const r of clean) await catalog.upsertRate(r, admin.user_id, conn);
  });
  return { rates: await catalog.listRates() };
}

// ---------------------------------------------------------------- hall requests
export async function listHallBookings(query) {
  const v = new Validator(query);
  const status = v.oneOf('status', BOOKING_STATUSES, { required: false });
  v.done();
  return { hall_bookings: await halls.list({ status }) };
}

export async function decideHall(admin, id, approveIt, body) {
  const v = new Validator(body);
  const note = v.string('note', { label: 'Reason', required: !approveIt, max: 255 });
  v.done();
  const h = await withTransaction(async (conn) => {
    const hb = await halls.find(id, conn, { lock: true });
    if (!hb) throw notFound('Hall booking');
    if (hb.status !== 'Pending') throw new AppError(`This hall booking is already ${hb.status}.`, 409, 'NOT_PENDING');
    await halls.setStatus(id, { status: approveIt ? 'Approved' : 'Rejected', adminNote: note, reviewedBy: admin.user_id }, conn);
    return halls.find(id, conn);
  });
  await sendEmail({ to: h.user_email, ...(approveIt ? templates.hallApproved(h) : templates.hallRejected(h)) });
  return { hall_booking: h };
}
