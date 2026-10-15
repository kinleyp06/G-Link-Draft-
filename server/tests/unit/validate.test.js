import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Validator, idParam } from '../../src/utils/validate.js';
import { AppError } from '../../src/utils/AppError.js';

test('collects one message per field and throws a 400 with fields', () => {
  const v = new Validator({ email: 'nope', password: 'short' });
  v.email('email');
  v.password('password');
  v.string('name', { label: 'Name' });
  assert.throws(
    () => v.done(),
    (err) =>
      err instanceof AppError &&
      err.statusCode === 400 &&
      err.code === 'VALIDATION_ERROR' &&
      err.fields.email === 'Enter a valid email address.' &&
      err.fields.password === 'Password must be at least 8 characters.' &&
      err.fields.name === 'Name is required.'
  );
});

test('cleans good values', () => {
  const v = new Validator({ email: '  Pema@RUB.edu.bt ', n: '3', d: '2026-10-12', t: '09:30', ok: 'true' });
  assert.equal(v.email('email'), 'pema@rub.edu.bt');
  assert.equal(v.int('n', { min: 1, max: 5 }), 3);
  assert.equal(v.date('d'), '2026-10-12');
  assert.equal(v.time('t'), '09:30');
  assert.equal(v.bool('ok'), true);
  v.done();
});

test('password needs letters and numbers', () => {
  const v = new Validator({ a: 'abcdefgh', b: 'abcd1234' });
  v.password('a');
  assert.equal(v.password('b'), 'abcd1234');
  assert.match(v.fields.a, /letters and numbers/);
});

test('money allows at most 2 decimals and no negatives', () => {
  const v = new Validator({ a: '10.555', b: -1, c: '99.50' });
  v.money('a');
  v.money('b');
  assert.equal(v.money('c'), 99.5);
  assert.ok(v.fields.a && v.fields.b);
});

test('oneOf only accepts listed values', () => {
  const v = new Validator({ role: 'Boss' });
  v.oneOf('role', ['Guest', 'Admin']);
  assert.match(v.fields.role, /one of: Guest, Admin/);
});

test('merge prefixes nested fields', () => {
  const v = new Validator({});
  const g = new Validator({});
  g.string('full_name', { label: 'Full name' });
  v.merge('guests[0]', g);
  assert.equal(v.fields['guests[0].full_name'], 'Full name is required.');
});

test('idParam refuses junk', () => {
  assert.equal(idParam('12'), 12);
  assert.throws(() => idParam('12abc'), AppError);
  assert.throws(() => idParam('0'), AppError);
});
