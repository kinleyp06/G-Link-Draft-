import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isValidDate, addDays, nightsBetween, eachNight, overlaps, today } from '../../src/utils/dates.js';

test('isValidDate accepts real dates only', () => {
  assert.equal(isValidDate('2026-10-12'), true);
  assert.equal(isValidDate('2028-02-29'), true);
  assert.equal(isValidDate('2026-02-30'), false);
  assert.equal(isValidDate('12/10/2026'), false);
  assert.equal(isValidDate(20261012), false);
});

test('addDays crosses months and years', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
});

test('nightsBetween and eachNight leave out the check-out morning', () => {
  assert.equal(nightsBetween('2026-10-12', '2026-10-14'), 2);
  assert.deepEqual(eachNight('2026-10-12', '2026-10-14'), ['2026-10-12', '2026-10-13']);
});

test('overlaps: back-to-back stays do not overlap', () => {
  assert.equal(overlaps('2026-10-12', '2026-10-14', '2026-10-14', '2026-10-16'), false);
  assert.equal(overlaps('2026-10-12', '2026-10-15', '2026-10-14', '2026-10-16'), true);
});

test('today uses the given time zone', () => {
  // 20:00 UTC on 7 Oct is already 8 Oct in Bhutan (UTC+6)
  assert.equal(today('Asia/Thimphu', new Date('2026-10-07T20:00:00Z')), '2026-10-08');
  assert.equal(today('UTC', new Date('2026-10-07T20:00:00Z')), '2026-10-07');
});
