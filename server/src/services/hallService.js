import { withTransaction } from '../config/db.js';
import * as catalog from '../models/catalogModel.js';
import * as halls from '../models/hallBookingModel.js';
import { hallClashes } from './availability.js';
import { profileComplete } from './userService.js';
import { notFound, todayHere } from './stayRules.js';
import { AppError } from '../utils/AppError.js';
import { Validator } from '../utils/validate.js';
import { SELF_GUEST_TYPES } from '../utils/constants.js';
import { addDays } from '../utils/dates.js';
import { sendEmail } from '../emails/mailer.js';
import { templates } from '../emails/templates.js';

// F-18: request the meeting hall
export async function create(user, body) {
  if (!profileComplete(user)) {
    throw new AppError('Please add your name and phone number in your profile before booking.', 400, 'PROFILE_INCOMPLETE');
  }
  const v = new Validator(body);
  const hallId = v.int('hall_id', { label: 'Hall', min: 1 });
  const date = v.date('event_date', { label: 'Date' });
  const start = v.time('start_time', { label: 'Start time' });
  const end = v.time('end_time', { label: 'End time' });
  const attendees = v.int('attendees', { label: 'Number of people', min: 1, max: 5000 });
  const purpose = v.string('purpose', { label: 'Purpose', max: 255 });
  const guestType = v.oneOf('guest_type', SELF_GUEST_TYPES, { label: 'Guest type' });
  const now = todayHere();
  if (date && date < now) v.fail('event_date', 'The date cannot be in the past.');
  if (date && date > addDays(now, 365)) v.fail('event_date', 'You can book up to one year ahead.');
  if (start && end && end <= start) v.fail('end_time', 'End time must be after start time.');
  v.done();

  const booking = await withTransaction(async (conn) => {
    const hall = await catalog.findHall(hallId, conn, { lock: true });
    if (!hall || hall.status !== 'Active') throw notFound('Hall');
    if (attendees > hall.capacity) {
      throw new AppError(`${hall.name} seats ${hall.capacity} people.`, 400, 'VALIDATION_ERROR', {
        attendees: `At most ${hall.capacity} people.`,
      });
    }
    if (hallClashes(start, end, await halls.sameDay(hallId, date, 0, conn))) {
      throw new AppError('The hall is already booked for part of that time. Choose another time.', 409, 'HALL_TAKEN');
    }
    const rate = await catalog.findRate(guestType, 'Hall', conn);
    if (rate === undefined) throw new AppError(`No hall rate is set for ${guestType}. Contact the admin.`, 409, 'NO_RATE');
    const id = await halls.insert(
      { hall_id: hallId, user_id: user.user_id, event_date: date, start_time: start, end_time: end, attendees, purpose,
        guest_type: guestType, rate_amount: rate, total_amount: rate },
      conn
    );
    return halls.find(id, conn);
  });
  await sendEmail({ to: user.email, ...templates.hallReceived(booking) });
  return { hall_booking: booking };
}

export async function listMine(user) {
  return { hall_bookings: await halls.list({ userId: user.user_id }) };
}

// Taken time slots for a hall on one day, so the form can show them.
export async function takenSlots(query) {
  const v = new Validator(query);
  const hallId = v.int('hall_id', { label: 'Hall', min: 1 });
  const date = v.date('date', { label: 'Date' });
  v.done();
  const slots = await halls.sameDay(hallId, date);
  return { slots: slots.map((s) => ({ start_time: s.start_time.slice(0, 5), end_time: s.end_time.slice(0, 5) })) };
}

export async function cancel(user, id) {
  return withTransaction(async (conn) => {
    const h = await halls.find(id, conn, { lock: true });
    if (!h || h.user_id !== user.user_id) throw notFound('Hall booking');
    if (!['Pending', 'Approved'].includes(h.status)) throw new AppError('This hall booking can no longer be cancelled.', 409, 'CANNOT_CANCEL');
    await halls.setStatus(id, { status: 'Cancelled', adminNote: 'Cancelled by the guest.' }, conn);
    return { hall_booking: await halls.find(id, conn) };
  });
}
