import * as bookings from '../models/bookingModel.js';
import * as halls from '../models/hallBookingModel.js';
import { todayHere } from '../services/stayRules.js';

// Runs every hour:
// - pending room / hall bookings that nobody reviewed before their date are cancelled (they hold beds)
// - approved hall bookings in the past become Completed
export async function runCleanup() {
  const now = todayHere();
  const expiredRooms = await bookings.expirePending(now);
  const expiredHalls = await halls.expirePending(now);
  const completedHalls = await halls.completePast(now);
  return { expiredRooms, expiredHalls, completedHalls };
}

export function scheduleCleanup(intervalMs = 60 * 60 * 1000) {
  const tick = async () => {
    try {
      const r = await runCleanup();
      if (r.expiredRooms || r.expiredHalls || r.completedHalls) console.log('[job] cleanup', r);
    } catch (err) {
      console.error(`[job] cleanup failed: ${err.message}`);
    }
  };
  setTimeout(tick, 10 * 1000).unref();
  return setInterval(tick, intervalMs).unref();
}
