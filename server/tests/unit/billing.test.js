import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roomBill, extensionCost, balance } from '../../src/services/billing.js';

test('room bill = nights x beds x rate', () => {
  assert.deepEqual(roomBill({ checkIn: '2026-10-12', checkOut: '2026-10-14', beds: 2, rate: 300 }), {
    nights: 2,
    beds: 2,
    rate: 300,
    total: 1200,
  });
});

test('extension costs the extra nights at the same rate', () => {
  assert.deepEqual(extensionCost({ currentCheckOut: '2026-10-14', newCheckOut: '2026-10-17', beds: 1, rate: 150.5 }), {
    nights: 3,
    total: 451.5,
  });
});

test('balance after payments', () => {
  assert.deepEqual(balance(1200, [{ amount: 500 }, { amount: '200.50' }]), { paid: 700.5, due: 499.5, is_paid: false });
  assert.deepEqual(balance(1200, [{ amount: 1200 }]), { paid: 1200, due: 0, is_paid: true });
});
