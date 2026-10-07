import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freeBeds, canFit, bedsTaken, hallClashes } from '../../src/services/availability.js';

const stay = { checkIn: '2026-10-12', checkOut: '2026-10-15' };

test('an empty room has all its beds free', () => {
  assert.equal(freeBeds({ totalBeds: 6, ...stay }), 6);
});

test('free beds are counted on the busiest night', () => {
  const bookings = [
    { check_in: '2026-10-12', check_out: '2026-10-13', beds: 2, share_room: true },
    { check_in: '2026-10-13', check_out: '2026-10-15', beds: 1, share_room: true },
    { check_in: '2026-10-14', check_out: '2026-10-16', beds: 3, share_room: true },
  ];
  // nights: 12 -> 2, 13 -> 1, 14 -> 4  => busiest 4, free 2
  assert.equal(freeBeds({ totalBeds: 6, ...stay, bookings }), 2);
});

test('blocked beds count as used', () => {
  const blocks = [{ start_date: '2026-10-13', end_date: '2026-10-14', beds: 5 }];
  assert.equal(freeBeds({ totalBeds: 6, ...stay, blocks }), 1);
});

test('stays outside the dates do not count', () => {
  const bookings = [{ check_in: '2026-10-15', check_out: '2026-10-17', beds: 6, share_room: true }];
  assert.equal(freeBeds({ totalBeds: 6, ...stay, bookings }), 6);
});

test('a booking that does not share takes the whole room', () => {
  assert.equal(bedsTaken({ beds: 1, share_room: false }, 2), 2);
  const bookings = [{ check_in: '2026-10-12', check_out: '2026-10-13', beds: 1, share_room: false }];
  assert.equal(freeBeds({ totalBeds: 2, ...stay, bookings }), 0);
});

test('canFit: sharing needs only your beds, private needs the whole room', () => {
  const bookings = [{ check_in: '2026-10-12', check_out: '2026-10-13', beds: 1, share_room: true }];
  assert.equal(canFit({ totalBeds: 2, ...stay, bookings, blocks: [], beds: 1, shareRoom: true }).ok, true);
  assert.equal(canFit({ totalBeds: 2, ...stay, bookings, blocks: [], beds: 1, shareRoom: false }).ok, false);
  assert.equal(canFit({ totalBeds: 2, ...stay, bookings: [], blocks: [], beds: 3, shareRoom: true }).ok, false);
});

test('hallClashes: touching times are fine, overlapping are not', () => {
  const others = [{ start_time: '09:00:00', end_time: '12:00:00' }];
  assert.equal(hallClashes('12:00', '14:00', others), false);
  assert.equal(hallClashes('11:30', '14:00', others), true);
  assert.equal(hallClashes('07:00', '09:00', others), false);
});
