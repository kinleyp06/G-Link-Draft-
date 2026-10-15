import { withTransaction } from '../config/db.js';
import * as bookings from '../models/bookingModel.js';
import * as halls from '../models/hallBookingModel.js';
import { notFound, todayHere } from './stayRules.js';
import { AppError } from '../utils/AppError.js';
import { Validator } from '../utils/validate.js';
import { addDays } from '../utils/dates.js';
import { PAYMENT_METHODS } from '../utils/constants.js';

// F-27: approved stays. range = today | week | all
export async function listBookings(query) {
  const v = new Validator(query);
  const range = v.oneOf('range', ['today', 'week', 'all'], { required: false }) || 'week';
  const q = v.string('q', { required: false, max: 100 });
  v.done();
  const now = todayHere();
  const filters = { status: ['Approved', 'Completed'], q, order: 'upcoming' };
  if (range === 'today') Object.assign(filters, { from: now, to: now });
  if (range === 'week') Object.assign(filters, { from: now, to: addDays(now, 7) });
  let list = await bookings.listBookings(filters);
  if (range !== 'all') list = list.filter((b) => b.status === 'Approved' || b.checked_out_at?.slice(0, 10) === now);
  return { range, today: now, bookings: list };
}

// "Today" screen: who arrives, who leaves, who is in the house.
export async function today() {
  const now = todayHere();
  const list = await bookings.listBookings({ status: ['Approved', 'Completed'], from: now, to: now, order: 'upcoming' });
  return {
    today: now,
    arrivals: list.filter((b) => b.status === 'Approved' && b.check_in === now && !b.checked_in_at),
    departures: list.filter((b) => b.status === 'Approved' && b.check_out === now && b.checked_in_at),
    in_house: list.filter((b) => b.status === 'Approved' && b.checked_in_at && !b.checked_out_at),
    overdue: (await bookings.listBookings({ status: 'Approved', order: 'upcoming' })).filter(
      (b) => b.check_out < now && b.checked_in_at && !b.checked_out_at
    ),
    hall_today: await halls.list({ date: now, status: 'Approved' }),
  };
}

// F-28
export async function checkIn(id) {
  return withTransaction(async (conn) => {
    const b = await bookings.findBooking(id, conn, { lock: true });
    if (!b) throw notFound('Booking');
    if (b.status !== 'Approved') throw new AppError(`Only an approved booking can be checked in (this one is ${b.status}).`, 409, 'NOT_APPROVED');
    if (b.checked_in_at) throw new AppError('This guest is already checked in.', 409, 'ALREADY_CHECKED_IN');
    const now = todayHere();
    if (now < b.check_in) throw new AppError(`Check-in opens on ${b.check_in}.`, 409, 'TOO_EARLY');
    if (now >= b.check_out) throw new AppError('This stay has already ended.', 409, 'STAY_ENDED');
    await bookings.markCheckedIn(id, conn);
    return { booking: await bookings.findBooking(id, conn) };
  });
}

export async function checkOut(id) {
  return withTransaction(async (conn) => {
    const b = await bookings.findBooking(id, conn, { lock: true });
    if (!b) throw notFound('Booking');
    if (b.status !== 'Approved' || !b.checked_in_at) throw new AppError('Only a checked-in guest can be checked out.', 409, 'NOT_CHECKED_IN');
    await bookings.markCheckedOut(id, conn);
    return { booking: await bookings.findBooking(id, conn) };
  });
}

// Record money received for a room booking or a hall booking.
export async function recordPayment(staff, body) {
  const v = new Validator(body);
  const bookingId = v.int('booking_id', { required: false, min: 1 });
  const hallBookingId = v.int('hall_booking_id', { required: false, min: 1 });
  const amount = v.money('amount', { label: 'Amount' });
  const method = v.oneOf('method', PAYMENT_METHODS, { label: 'Payment method' });
  const referenceNo = v.string('reference_no', { label: 'Receipt / reference number', required: method !== 'Cash', max: 50 });
  if (!bookingId === !hallBookingId) v.fail('booking_id', 'Choose one booking.');
  if (amount === 0) v.fail('amount', 'Amount must be more than 0.');
  v.done();

  return withTransaction(async (conn) => {
    const target = bookingId ? await bookings.findBooking(bookingId, conn, { lock: true }) : await halls.find(hallBookingId, conn, { lock: true });
    if (!target) throw notFound('Booking');
    if (!['Approved', 'Completed'].includes(target.status)) {
      throw new AppError(`Payments can only be recorded for approved bookings (this one is ${target.status}).`, 409, 'NOT_APPROVED');
    }
    if (amount > target.amount_due) {
      throw new AppError(`Only Nu. ${target.amount_due} is still due.`, 400, 'VALIDATION_ERROR', { amount: `At most Nu. ${target.amount_due}.` });
    }
    await bookings.insertPayment(
      { booking_id: bookingId, hall_booking_id: hallBookingId, amount, method, reference_no: referenceNo, recorded_by: staff.user_id },
      conn
    );
    return bookingId
      ? { booking: await bookings.findBooking(bookingId, conn), payments: await bookings.listPayments({ bookingId }, conn) }
      : { hall_booking: await halls.find(hallBookingId, conn), payments: await bookings.listPayments({ hallBookingId }, conn) };
  });
}
