import * as catalog from '../models/catalogModel.js';
import * as bookings from '../models/bookingModel.js';
import { freeBeds } from './availability.js';
import { Validator } from '../utils/validate.js';
import { checkStayDates, notFound } from './stayRules.js';

async function roomRates() {
  const rates = await catalog.listRates();
  return Object.fromEntries(rates.filter((r) => r.rate_type === 'Room').map((r) => [r.guest_type, r.amount]));
}

// Adds free_beds for the chosen dates to each room.
async function withFreeBeds(rooms, checkIn, checkOut) {
  if (!checkIn || !checkOut) return rooms.map((r) => ({ ...r, free_beds: null }));
  const occ = await bookings.occupancy(
    rooms.map((r) => r.room_id),
    checkIn,
    checkOut
  );
  return rooms.map((r) => ({
    ...r,
    free_beds: freeBeds({
      totalBeds: r.total_beds,
      checkIn,
      checkOut,
      bookings: occ.bookings.filter((b) => b.room_id === r.room_id),
      blocks: occ.blocks.filter((k) => k.room_id === r.room_id),
    }),
  }));
}

function readDates(query, opts) {
  const v = new Validator(query);
  const checkIn = v.date('check_in', { label: 'Check-in', required: false });
  const checkOut = v.date('check_out', { label: 'Check-out', required: Boolean(checkIn) });
  if (checkOut && !checkIn) v.fail('check_in', 'Check-in is required.');
  checkStayDates(v, checkIn, checkOut, opts);
  const guestHouseId = v.int('guest_house_id', { required: false, min: 1 });
  v.done();
  return { checkIn, checkOut, guestHouseId };
}

// F-09: room list with free beds
export async function listRooms(query, { allowPast = false } = {}) {
  const { checkIn, checkOut, guestHouseId } = readDates(query, { allowPast });
  const rooms = await catalog.listRooms({ guestHouseId });
  return { check_in: checkIn, check_out: checkOut, rates: await roomRates(), rooms: await withFreeBeds(rooms, checkIn, checkOut) };
}

// F-10: one room
export async function getRoom(id, query) {
  const { checkIn, checkOut } = readDates(query);
  const room = await catalog.findRoom(id);
  if (!room || room.status !== 'Active' || room.guest_house_status !== 'Active') throw notFound('Room');
  const [withFree] = await withFreeBeds([room], checkIn, checkOut);
  return { room: withFree, rates: await roomRates() };
}

export async function listGuestHouses() {
  return { guest_houses: await catalog.listGuestHouses() };
}

export async function listHalls() {
  const rates = await catalog.listRates();
  return {
    halls: await catalog.listHalls(),
    rates: Object.fromEntries(rates.filter((r) => r.rate_type === 'Hall').map((r) => [r.guest_type, r.amount])),
  };
}

export async function listRates() {
  return { rates: await catalog.listRates() };
}
