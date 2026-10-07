import { AppError } from '../utils/AppError.js';
import { addDays, nightsBetween, today } from '../utils/dates.js';
import { MAX_DAYS_AHEAD, MAX_NIGHTS } from '../utils/constants.js';
import { getConfig } from '../config/env.js';

export const todayHere = () => today(getConfig().timeZone);

// Checks a stay's dates after the Validator has checked their format.
// allowPast lets admins work with stays that already started (change room, extensions).
export function checkStayDates(v, checkIn, checkOut, { allowPast = false } = {}) {
  if (!checkIn || !checkOut) return;
  const now = todayHere();
  if (!allowPast && checkIn < now) v.fail('check_in', 'Check-in cannot be in the past.');
  if (checkIn > addDays(now, MAX_DAYS_AHEAD)) v.fail('check_in', 'You can book up to one year ahead.');
  if (checkOut <= checkIn) v.fail('check_out', 'Check-out must be after check-in.');
  else if (nightsBetween(checkIn, checkOut) > MAX_NIGHTS) v.fail('check_out', `A stay can be at most ${MAX_NIGHTS} nights.`);
}

export function notFound(what) {
  return new AppError(`${what} not found.`, 404, 'NOT_FOUND');
}
