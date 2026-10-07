import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { whyNotReady, resetDatabase, startApi } from './helpers.js';

const skip = await whyNotReady();

describe('admin tools, incharge desk, halls and super admin', { skip: skip || false }, () => {
  let t, guest, admin, incharge, superAdmin, dorm;
  before(async () => {
    await resetDatabase();
    t = await startApi();
    guest = await t.makeUser('Guest');
    admin = await t.makeUser('Admin');
    incharge = await t.makeUser('Incharge');
    superAdmin = await t.makeUser('Super Admin');
    dorm = await t.roomId('A-102');
  });
  after(() => t?.stop());

  test('block beds: they stop showing as free; blocking booked beds is refused', async () => {
    const res = await t.api('POST', '/api/admin/room-blocks', {
      token: admin.token,
      body: { room_id: dorm, beds: 4, start_date: t.day(5), end_date: t.day(8), reason: 'Repairs' },
    });
    assert.equal(res.status, 201);
    const rooms = await t.api('GET', `/api/rooms/${dorm}?check_in=${t.day(6)}&check_out=${t.day(7)}`);
    assert.equal(rooms.body.room.free_beds, 2);
    const tooMany = await t.api('POST', '/api/admin/room-blocks', {
      token: admin.token,
      body: { room_id: dorm, beds: 3, start_date: t.day(6), end_date: t.day(7), reason: 'More repairs' },
    });
    assert.equal(tooMany.status, 409);
    const del = await t.api('DELETE', `/api/admin/room-blocks/${res.body.block.room_block_id}`, { token: admin.token });
    assert.equal(del.status, 200);
  });

  test('international booking: passport needed, starts Approved at the International rate', async () => {
    const noPassport = await t.api('POST', '/api/admin/bookings/international', {
      token: admin.token,
      body: { room_id: dorm, check_in: t.day(3), check_out: t.day(5), guests: [{ full_name: 'Jane Doe' }] },
    });
    assert.equal(noPassport.status, 400);
    assert.ok(noPassport.body.fields['guests[0].citizenship_id']);
    const res = await t.api('POST', '/api/admin/bookings/international', {
      token: admin.token,
      body: {
        room_id: dorm,
        check_in: t.day(3),
        check_out: t.day(5),
        guests: [{ full_name: 'Jane Doe', citizenship_id: 'P1234567', nationality: 'Australian' }],
      },
    });
    assert.equal(res.status, 201);
    assert.equal(res.body.booking.status, 'Approved');
    assert.equal(res.body.booking.is_international, true);
    assert.equal(res.body.booking.total_amount, 3000);
  });

  test('rate table: admin changes a rate; new bookings use it, old ones keep theirs', async () => {
    const res = await t.api('PUT', '/api/admin/rates', {
      token: admin.token,
      body: { rates: [{ guest_type: 'RUB Staff', rate_type: 'Room', amount: 350 }] },
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.rates.find((r) => r.guest_type === 'RUB Staff' && r.rate_type === 'Room').amount, 350);
    const bad = await t.api('PUT', '/api/admin/rates', { token: admin.token, body: { rates: [{ guest_type: 'Boss', rate_type: 'Room', amount: -1 }] } });
    assert.equal(bad.status, 400);
    const q = await t.api('POST', '/api/bookings/quote', {
      token: guest.token,
      body: { room_id: dorm, check_in: t.day(9), check_out: t.day(10), guest_type: 'RUB Staff' },
    });
    assert.equal(q.body.total, 350);
  });

  test('rooms & hall: add and edit a room; duplicate room numbers are refused', async () => {
    const cat = await t.api('GET', '/api/admin/catalog', { token: admin.token });
    const gh = cat.body.guest_houses[0].guest_house_id;
    const room = { guest_house_id: gh, room_number: 'C-301', room_type: 'Double', total_beds: 2, description: 'New' };
    const res = await t.api('POST', '/api/admin/rooms', { token: admin.token, body: room });
    assert.equal(res.status, 201);
    const dup = await t.api('POST', '/api/admin/rooms', { token: admin.token, body: room });
    assert.equal(dup.status, 409);
    const edit = await t.api('PUT', `/api/admin/rooms/${res.body.room.room_id}`, { token: admin.token, body: { ...room, status: 'Inactive' } });
    assert.equal(edit.body.room.status, 'Inactive');
    const list = await t.api('GET', '/api/rooms');
    assert.ok(!list.body.rooms.some((r) => r.room_number === 'C-301'), 'inactive rooms are hidden from guests');
    const single = await t.api('POST', '/api/admin/rooms', { token: admin.token, body: { ...room, room_number: 'C-302', room_type: 'Single' } });
    assert.equal(single.status, 400);
  });

  let stayId;
  test('incharge: check-in is refused before the date, works on the day', async () => {
    const early = await t.api('POST', '/api/bookings', {
      token: guest.token,
      body: { room_id: dorm, check_in: t.day(2), check_out: t.day(3), guest_type: 'RUB Staff' },
    });
    await t.api('POST', `/api/admin/bookings/${early.body.booking.booking_id}/approve`, { token: admin.token, body: {} });
    const no = await t.api('POST', `/api/incharge/bookings/${early.body.booking.booking_id}/check-in`, { token: incharge.token });
    assert.equal(no.status, 409);
    assert.equal(no.body.code, 'TOO_EARLY');

    const now = await t.api('POST', '/api/bookings', {
      token: guest.token,
      body: { room_id: dorm, check_in: t.day(0), check_out: t.day(2), guest_type: 'RUB Staff' },
    });
    stayId = now.body.booking.booking_id;
    const pendingIn = await t.api('POST', `/api/incharge/bookings/${stayId}/check-in`, { token: incharge.token });
    assert.equal(pendingIn.body.code, 'NOT_APPROVED');
    await t.api('POST', `/api/admin/bookings/${stayId}/approve`, { token: admin.token, body: {} });
    const today = await t.api('GET', '/api/incharge/today', { token: incharge.token });
    assert.ok(today.body.arrivals.some((b) => b.booking_id === stayId));
    const ok = await t.api('POST', `/api/incharge/bookings/${stayId}/check-in`, { token: incharge.token });
    assert.equal(ok.status, 200);
    assert.ok(ok.body.booking.checked_in_at);
    const twice = await t.api('POST', `/api/incharge/bookings/${stayId}/check-in`, { token: incharge.token });
    assert.equal(twice.body.code, 'ALREADY_CHECKED_IN');
  });

  test('payments: cannot pay more than is due; reference needed except for cash', async () => {
    const over = await t.api('POST', '/api/incharge/payments', { token: incharge.token, body: { booking_id: stayId, amount: 99999, method: 'Cash' } });
    assert.equal(over.status, 400);
    const noRef = await t.api('POST', '/api/incharge/payments', { token: incharge.token, body: { booking_id: stayId, amount: 100, method: 'mBoB' } });
    assert.ok(noRef.body.fields.reference_no);
    const part = await t.api('POST', '/api/incharge/payments', { token: incharge.token, body: { booking_id: stayId, amount: 200, method: 'Cash' } });
    assert.equal(part.status, 201);
    assert.equal(part.body.booking.amount_due, 500);
    const rest = await t.api('POST', '/api/incharge/payments', {
      token: incharge.token,
      body: { booking_id: stayId, amount: 500, method: 'mBoB', reference_no: 'MB123' },
    });
    assert.equal(rest.body.booking.amount_due, 0);
    assert.equal(rest.body.payments.length, 2);
  });

  test('check-out completes the stay; guests cannot use the desk', async () => {
    assert.equal((await t.api('POST', `/api/incharge/bookings/${stayId}/check-out`, { token: guest.token })).status, 403);
    const res = await t.api('POST', `/api/incharge/bookings/${stayId}/check-out`, { token: incharge.token });
    assert.equal(res.body.booking.status, 'Completed');
    assert.ok(res.body.booking.checked_out_at);
  });

  test('meeting hall: request, clash refused, admin approves', async () => {
    const halls = await t.api('GET', '/api/halls');
    const hallId = halls.body.halls[0].hall_id;
    const body = { hall_id: hallId, event_date: t.day(4), start_time: '09:00', end_time: '12:00', attendees: 30, purpose: 'Meeting', guest_type: 'RUB Staff' };
    const res = await t.api('POST', '/api/hall-bookings', { token: guest.token, body });
    assert.equal(res.status, 201);
    assert.equal(res.body.hall_booking.total_amount, 2000);
    const clash = await t.api('POST', '/api/hall-bookings', { token: guest.token, body: { ...body, start_time: '11:00', end_time: '13:00' } });
    assert.equal(clash.status, 409);
    const after = await t.api('POST', '/api/hall-bookings', { token: guest.token, body: { ...body, start_time: '12:00', end_time: '13:00' } });
    assert.equal(after.status, 201);
    const tooMany = await t.api('POST', '/api/hall-bookings', { token: guest.token, body: { ...body, event_date: t.day(5), attendees: 500 } });
    assert.equal(tooMany.status, 400);
    const slots = await t.api('GET', `/api/hall-bookings/slots?hall_id=${hallId}&date=${t.day(4)}`, { token: guest.token });
    assert.equal(slots.body.slots.length, 2);
    const ok = await t.api('POST', `/api/admin/hall-bookings/${res.body.hall_booking.hall_booking_id}/approve`, { token: admin.token, body: {} });
    assert.equal(ok.body.hall_booking.status, 'Approved');
    assert.match(t.outbox.at(-1).subject, /Hall booking GH-\d+ approved/);
  });

  test('dashboard counts', async () => {
    const res = await t.api('GET', '/api/admin/dashboard', { token: admin.token });
    assert.equal(res.status, 200);
    assert.equal(typeof res.body.counts.free_beds_tonight, 'number');
    assert.ok(res.body.counts.pending_hall_bookings >= 1);
  });

  test('super admin: change roles; cannot change self or remove the last super admin', async () => {
    assert.equal((await t.api('GET', '/api/super/users', { token: admin.token })).status, 403);
    const list = await t.api('GET', `/api/super/users?q=${encodeURIComponent(guest.email)}`, { token: superAdmin.token });
    const g = list.body.users[0];
    const res = await t.api('PATCH', `/api/super/users/${g.user_id}`, { token: superAdmin.token, body: { role: 'Incharge' } });
    assert.equal(res.body.user.role, 'Incharge');
    assert.equal(res.body.user.password, undefined);
    const self = await t.api('PATCH', `/api/super/users/${superAdmin.user.user_id}`, { token: superAdmin.token, body: { status: 'Inactive' } });
    assert.equal(self.body.code, 'SELF_CHANGE');
    // A second super admin can demote the first...
    const s2 = await t.makeUser('Super Admin');
    const demote = await t.api('PATCH', `/api/super/users/${superAdmin.user.user_id}`, { token: s2.token, body: { role: 'Admin' } });
    assert.equal(demote.status, 200);
    assert.equal((await t.api('GET', '/api/super/users', { token: superAdmin.token })).status, 403, 'the change takes effect at once');
    // ...and an inactive super admin can be demoted even when s2 is the only active one.
    const s3 = await t.makeUser('Super Admin');
    await t.db().query("UPDATE users SET status = 'Inactive' WHERE email = ?", [s3.email]);
    const inactive = await t.api('PATCH', `/api/super/users/${s3.user.user_id}`, { token: s2.token, body: { role: 'Guest' } });
    assert.equal(inactive.status, 200);
  });

  test('cleanup job cancels pending bookings whose date has passed', async () => {
    await t.db().query(
      `INSERT INTO bookings (user_id, room_id, check_in, check_out, beds, guest_type, rate_amount, total_amount)
       VALUES (?, ?, ?, ?, 1, 'RUB Staff', 300, 300)`,
      [guest.user.user_id, dorm, t.day(-2), t.day(-1)]
    );
    const { runCleanup } = await import('../../src/jobs/dailyCleanup.js');
    const r = await runCleanup();
    assert.equal(r.expiredRooms, 1);
  });
});
