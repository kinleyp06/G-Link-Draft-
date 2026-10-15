import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { whyNotReady, resetDatabase, startApi } from './helpers.js';

const skip = await whyNotReady();

describe('guest booking flow and admin decisions', { skip: skip || false }, () => {
  let t, guest, guest2, admin, dorm, dbl, single;
  before(async () => {
    await resetDatabase();
    t = await startApi();
    guest = await t.makeUser('Guest');
    guest2 = await t.makeUser('Guest');
    admin = await t.makeUser('Admin');
    dorm = await t.roomId('A-102'); // 6 beds, dormitory
    dbl = await t.roomId('A-101'); // 2 beds, double
    single = await t.roomId('B-201'); // 1 bed
  });
  after(() => t?.stop());

  const req = (over = {}) => ({
    room_id: dorm,
    check_in: t.day(10),
    check_out: t.day(12),
    guest_type: 'RUB Staff',
    purpose: 'Workshop',
    guests: [{ full_name: 'Karma Dorji', gender: 'Male' }],
    ...over,
  });

  test('room list shows free beds and rates for the dates', async () => {
    const res = await t.api('GET', `/api/rooms?check_in=${t.day(10)}&check_out=${t.day(12)}`);
    assert.equal(res.status, 200);
    const a102 = res.body.rooms.find((r) => r.room_id === dorm);
    assert.equal(a102.free_beds, 6);
    assert.equal(res.body.rates['RUB Staff'], 300);
  });

  test('past dates and stays longer than 30 nights are refused', async () => {
    const past = await t.api('GET', `/api/rooms?check_in=${t.day(-1)}&check_out=${t.day(1)}`);
    assert.equal(past.status, 400);
    const long = await t.api('POST', '/api/bookings/quote', { token: guest.token, body: req({ check_out: t.day(41) }) });
    assert.equal(long.status, 400);
    assert.ok(long.body.fields.check_out);
  });

  test('quote gives the bill without saving', async () => {
    const res = await t.api('POST', '/api/bookings/quote', { token: guest.token, body: req() });
    assert.equal(res.status, 200);
    assert.equal(res.body.nights, 2);
    assert.equal(res.body.beds, 2);
    assert.equal(res.body.total, 1200);
    assert.equal(res.body.share_room, true, 'a dormitory is always shared');
  });

  let bookingId;
  test('booking request is saved as Pending and emailed', async () => {
    const res = await t.api('POST', '/api/bookings', { token: guest.token, body: req() });
    assert.equal(res.status, 201);
    bookingId = res.body.booking.booking_id;
    assert.equal(res.body.booking.status, 'Pending');
    assert.equal(res.body.booking.total_amount, 1200);
    assert.match(t.outbox.at(-1).subject, /received/);
    const rooms = await t.api('GET', `/api/rooms?check_in=${t.day(10)}&check_out=${t.day(12)}`);
    assert.equal(rooms.body.rooms.find((r) => r.room_id === dorm).free_beds, 4, 'pending bookings hold their beds');
  });

  test('a booking for more people than free beds is refused', async () => {
    const guests = Array.from({ length: 4 }, (_, i) => ({ full_name: `Guest ${i}` }));
    const res = await t.api('POST', '/api/bookings', { token: guest2.token, body: req({ guests }) });
    assert.equal(res.status, 409);
    assert.equal(res.body.code, 'NOT_ENOUGH_BEDS');
  });

  test('two people asking for the last bed at the same time: only one gets it', async () => {
    const g3 = await t.makeUser('Guest');
    const body = { room_id: single, check_in: t.day(20), check_out: t.day(21), guest_type: 'Private' };
    const [a, b] = await Promise.all([
      t.api('POST', '/api/bookings', { token: guest2.token, body }),
      t.api('POST', '/api/bookings', { token: g3.token, body }),
    ]);
    assert.deepEqual([a.status, b.status].sort(), [201, 409]);
  });

  test('a private booking in a double takes the whole room', async () => {
    const res = await t.api('POST', '/api/bookings', {
      token: guest2.token,
      body: { room_id: dbl, check_in: t.day(10), check_out: t.day(11), guest_type: 'Private', share_room: false },
    });
    assert.equal(res.status, 201);
    const rooms = await t.api('GET', `/api/rooms/${dbl}?check_in=${t.day(10)}&check_out=${t.day(11)}`);
    assert.equal(rooms.body.room.free_beds, 0);
  });

  test('without a complete profile you cannot book', async () => {
    const res = await t.api('POST', '/api/auth/signup', { body: { email: 'np@test.glink', password: 'Passw0rd1' } });
    assert.equal(res.status, 201);
    await t.db().query("UPDATE users SET email_verified = TRUE WHERE email = 'np@test.glink'");
    const login = await t.api('POST', '/api/auth/login', { body: { email: 'np@test.glink', password: 'Passw0rd1' } });
    const b = await t.api('POST', '/api/bookings', { token: login.body.token, body: req() });
    assert.equal(b.status, 400);
    assert.equal(b.body.code, 'PROFILE_INCOMPLETE');
  });

  test('guests cannot see other people\'s bookings or use admin pages', async () => {
    assert.equal((await t.api('GET', `/api/bookings/${bookingId}`, { token: guest2.token })).status, 404);
    const res = await t.api('POST', `/api/admin/bookings/${bookingId}/approve`, { token: guest.token, body: {} });
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'FORBIDDEN');
  });

  test('admin sees the request and approves it; guest is emailed', async () => {
    const list = await t.api('GET', '/api/admin/bookings?status=Pending', { token: admin.token });
    assert.ok(list.body.bookings.some((b) => b.booking_id === bookingId));
    const res = await t.api('POST', `/api/admin/bookings/${bookingId}/approve`, { token: admin.token, body: {} });
    assert.equal(res.status, 200);
    assert.equal(res.body.booking.status, 'Approved');
    assert.equal(t.outbox.at(-1).to, guest.email);
    assert.match(t.outbox.at(-1).subject, /approved/);
    const again = await t.api('POST', `/api/admin/bookings/${bookingId}/approve`, { token: admin.token, body: {} });
    assert.equal(again.status, 409);
  });

  test('approved bookings in the same room on the same nights are recorded as sharing', async () => {
    const other = await t.api('POST', '/api/bookings', { token: guest2.token, body: req({ guests: [] }) });
    await t.api('POST', `/api/admin/bookings/${other.body.booking.booking_id}/approve`, { token: admin.token, body: {} });
    const detail = await t.api('GET', `/api/bookings/${bookingId}`, { token: guest.token });
    assert.deepEqual(detail.body.sharing, { bookings: 1, beds: 1 });
    assert.equal(detail.body.guests.length, 1);
  });

  test('reject needs a reason', async () => {
    const b = await t.api('POST', '/api/bookings', { token: guest.token, body: req({ check_in: t.day(30), check_out: t.day(31) }) });
    const id = b.body.booking.booking_id;
    const noReason = await t.api('POST', `/api/admin/bookings/${id}/reject`, { token: admin.token, body: {} });
    assert.equal(noReason.status, 400);
    const res = await t.api('POST', `/api/admin/bookings/${id}/reject`, { token: admin.token, body: { note: 'Guest house closed.' } });
    assert.equal(res.body.booking.status, 'Rejected');
    assert.match(t.outbox.at(-1).text, /Guest house closed/);
  });

  test('guest can cancel, which frees the beds', async () => {
    const b = await t.api('POST', '/api/bookings', { token: guest.token, body: req({ check_in: t.day(40), check_out: t.day(41) }) });
    const id = b.body.booking.booking_id;
    const res = await t.api('POST', `/api/bookings/${id}/cancel`, { token: guest.token });
    assert.equal(res.body.booking.status, 'Cancelled');
    const rooms = await t.api('GET', `/api/rooms/${dorm}?check_in=${t.day(40)}&check_out=${t.day(41)}`);
    assert.equal(rooms.body.room.free_beds, 6);
    assert.equal((await t.api('POST', `/api/bookings/${id}/cancel`, { token: guest.token })).status, 409);
  });

  test('longer stay: request, then admin approves and the bill grows', async () => {
    const res = await t.api('POST', `/api/bookings/${bookingId}/extensions`, {
      token: guest.token,
      body: { new_check_out: t.day(14), reason: 'Workshop extended' },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.extension.extra_amount, 1200);
    const dup = await t.api('POST', `/api/bookings/${bookingId}/extensions`, { token: guest.token, body: { new_check_out: t.day(15), reason: 'x' } });
    assert.equal(dup.body.code, 'EXTENSION_PENDING');
    const list = await t.api('GET', '/api/admin/extensions?status=Pending', { token: admin.token });
    const ext = list.body.extensions[0];
    assert.equal(ext.room_free, true);
    const ok = await t.api('POST', `/api/admin/extensions/${ext.stay_extension_id}/approve`, { token: admin.token, body: {} });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.booking.check_out, t.day(14));
    assert.equal(ok.body.booking.total_amount, 2400);
  });

  test('longer stay is refused when the room is full on the extra nights', async () => {
    const big = Array.from({ length: 5 }, (_, i) => ({ full_name: `Group ${i}` }));
    const g = await t.makeUser('Guest');
    const full = await t.api('POST', '/api/bookings', { token: g.token, body: req({ check_in: t.day(14), check_out: t.day(16), guests: big }) });
    assert.equal(full.status, 201);
    const res = await t.api('POST', `/api/bookings/${bookingId}/extensions`, { token: guest.token, body: { new_check_out: t.day(15), reason: 'More work' } });
    const list = await t.api('GET', '/api/admin/extensions?status=Pending', { token: admin.token });
    const ext = list.body.extensions.find((e) => e.stay_extension_id === res.body.extension.stay_extension_id);
    assert.equal(ext.room_free, false);
    const no = await t.api('POST', `/api/admin/extensions/${ext.stay_extension_id}/approve`, { token: admin.token, body: {} });
    assert.equal(no.status, 409);
    const rej = await t.api('POST', `/api/admin/extensions/${ext.stay_extension_id}/reject`, { token: admin.token, body: { note: 'Room is full.' } });
    assert.equal(rej.body.extension.status, 'Rejected');
  });

  test('change room moves the booking when the new room has space', async () => {
    const options = await t.api('GET', `/api/admin/bookings/${bookingId}/rooms`, { token: admin.token });
    assert.ok(options.body.rooms.length > 0);
    const p01 = await t.roomId('P-01');
    const res = await t.api('POST', `/api/admin/bookings/${bookingId}/change-room`, { token: admin.token, body: { room_id: p01, reason: 'Repairs' } });
    assert.equal(res.status, 200);
    assert.equal(res.body.booking.room_number, 'P-01');
    assert.match(t.outbox.at(-1).subject, /room changed/);
    const tooSmall = await t.api('POST', `/api/admin/bookings/${bookingId}/change-room`, { token: admin.token, body: { room_id: single } });
    assert.equal(tooSmall.status, 409);
  });
});
