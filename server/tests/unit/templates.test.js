import { test } from 'node:test';
import assert from 'node:assert/strict';
import { templates, ref } from '../../src/emails/templates.js';

const booking = {
  booking_id: 12,
  room_number: 'A-102',
  guest_house_name: 'CST Guest House',
  check_in: '2026-10-12',
  check_out: '2026-10-14',
  total_amount: 1200,
  admin_note: '<b>No rooms</b>',
};

test('booking reference looks like GL-0012', () => {
  assert.equal(ref(12), 'GL-0012');
});

test('every template gives subject, text and html', () => {
  const ext = { new_check_out: '2026-10-16', current_check_out: '2026-10-14', extra_amount: 600 };
  const hall = { hall_booking_id: 3, hall_name: 'Hall', event_date: '2026-10-15', start_time: '09:00', end_time: '13:00', total_amount: 2000, admin_note: 'x' };
  const all = [
    templates.verifyEmail({ url: 'http://x/verify?token=a' }),
    templates.resetPassword({ url: 'http://x/reset?token=a' }),
    templates.bookingReceived(booking),
    templates.bookingApproved(booking),
    templates.bookingRejected(booking),
    templates.bookingCancelled(booking),
    templates.roomChanged(booking, 'Repairs'),
    templates.extensionReceived(booking, ext),
    templates.extensionApproved(booking, ext),
    templates.extensionRejected(booking, ext),
    templates.hallReceived(hall),
    templates.hallApproved(hall),
    templates.hallRejected(hall),
  ];
  for (const m of all) {
    assert.ok(m.subject && m.text && m.html);
  }
});

test('html escapes admin text', () => {
  const m = templates.bookingRejected(booking);
  assert.match(m.text, /Reason: <b>No rooms<\/b>/);
  assert.doesNotMatch(m.html, /<b>No rooms/);
  assert.match(m.html, /&lt;b&gt;No rooms/);
  assert.match(m.subject, /GL-0012 rejected/);
});
