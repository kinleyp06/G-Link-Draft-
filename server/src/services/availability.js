import { eachNight, overlaps } from '../utils/dates.js';

// Pure functions: no database. The models fetch the rows, these do the counting.

// Beds a booking takes up. A booking that does not agree to share takes the whole room.
export function bedsTaken(booking, totalBeds) {
  return booking.share_room ? booking.beds : totalBeds;
}

// Beds in use on each night of [checkIn, checkOut).
//   bookings: [{ check_in, check_out, beds, share_room }]  (Pending + Approved only)
//   blocks:   [{ start_date, end_date, beds }]
export function usageByNight({ totalBeds, checkIn, checkOut, bookings = [], blocks = [] }) {
  const usage = new Map(eachNight(checkIn, checkOut).map((n) => [n, 0]));
  for (const b of bookings) {
    if (!overlaps(b.check_in, b.check_out, checkIn, checkOut)) continue;
    for (const night of usage.keys()) {
      if (night >= b.check_in && night < b.check_out) usage.set(night, usage.get(night) + bedsTaken(b, totalBeds));
    }
  }
  for (const k of blocks) {
    if (!overlaps(k.start_date, k.end_date, checkIn, checkOut)) continue;
    for (const night of usage.keys()) {
      if (night >= k.start_date && night < k.end_date) usage.set(night, usage.get(night) + k.beds);
    }
  }
  return usage;
}

// Free beds for the whole stay = beds left on the busiest night (never below 0).
export function freeBeds(args) {
  const usage = usageByNight(args);
  if (usage.size === 0) return args.totalBeds;
  const busiest = Math.max(...usage.values());
  return Math.max(0, args.totalBeds - busiest);
}

// Can a new booking for `beds` people, sharing or not, fit?
export function canFit({ totalBeds, checkIn, checkOut, bookings, blocks, beds, shareRoom }) {
  const free = freeBeds({ totalBeds, checkIn, checkOut, bookings, blocks });
  const needed = shareRoom ? beds : totalBeds;
  return { ok: beds <= totalBeds && free >= needed, free };
}

// Does a hall booking [start, end) on one day clash with any other?
export function hallClashes(start, end, others) {
  return others.some((o) => start < o.end_time.slice(0, 5) && o.start_time.slice(0, 5) < end);
}
