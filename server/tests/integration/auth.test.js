import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { whyNotReady, resetDatabase, startApi } from './helpers.js';

const skip = await whyNotReady();

describe('auth: sign up, verify, sign in, reset password, profile', { skip: skip || false }, () => {
  let t;
  before(async () => {
    await resetDatabase();
    t = await startApi();
  });
  after(() => t?.stop());

  const email = 'new.guest@test.glink';
  const lastLink = () => t.outbox.at(-1).text.match(/token=([^\s]+)/)[1];

  test('sign up sends a verification email', async () => {
    const res = await t.api('POST', '/api/auth/signup', { body: { email, password: 'Passw0rd1' } });
    assert.equal(res.status, 201);
    assert.equal(t.outbox.at(-1).to, email);
    assert.match(t.outbox.at(-1).subject, /Verify/);
  });

  test('weak password and bad email are refused with field messages', async () => {
    const res = await t.api('POST', '/api/auth/signup', { body: { email: 'nope', password: 'short' } });
    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'VALIDATION_ERROR');
    assert.ok(res.body.fields.email && res.body.fields.password);
  });

  test('cannot sign in before verifying', async () => {
    const res = await t.api('POST', '/api/auth/login', { body: { email, password: 'Passw0rd1' } });
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'EMAIL_NOT_VERIFIED');
  });

  test('the link verifies the email, then sign in works', async () => {
    const v = await t.api('POST', '/api/auth/verify-email', { body: { token: decodeURIComponent(lastLink()) } });
    assert.equal(v.status, 200);
    const res = await t.api('POST', '/api/auth/login', { body: { email: 'New.Guest@test.glink', password: 'Passw0rd1' } });
    assert.equal(res.status, 200);
    assert.ok(res.body.token);
    assert.equal(res.body.user.role, 'Guest');
    assert.equal(res.body.user.password, undefined, 'password hash must never be sent');
  });

  test('a bad or tampered link is refused', async () => {
    const res = await t.api('POST', '/api/auth/verify-email', { body: { token: 'abc.def.ghi' } });
    assert.equal(res.status, 400);
    assert.equal(res.body.code, 'INVALID_LINK');
  });

  test('signing up again with a verified email is refused', async () => {
    const res = await t.api('POST', '/api/auth/signup', { body: { email, password: 'Passw0rd1' } });
    assert.equal(res.status, 409);
    assert.equal(res.body.code, 'EMAIL_TAKEN');
  });

  test('wrong password and unknown email get the same answer', async () => {
    const a = await t.api('POST', '/api/auth/login', { body: { email, password: 'WrongPass1' } });
    const b = await t.api('POST', '/api/auth/login', { body: { email: 'nobody@test.glink', password: 'WrongPass1' } });
    assert.equal(a.status, 401);
    assert.deepEqual(a.body, b.body);
  });

  test('forgot password: the link changes the password once', async () => {
    const f = await t.api('POST', '/api/auth/forgot-password', { body: { email } });
    assert.equal(f.status, 200);
    const token = decodeURIComponent(lastLink());
    const r = await t.api('POST', '/api/auth/reset-password', { body: { token, password: 'NewPassw0rd' } });
    assert.equal(r.status, 200);
    const again = await t.api('POST', '/api/auth/reset-password', { body: { token, password: 'Another1pass' } });
    assert.equal(again.status, 400, 'a used reset link must stop working');
    const login = await t.api('POST', '/api/auth/login', { body: { email, password: 'NewPassw0rd' } });
    assert.equal(login.status, 200);
  });

  test('profile: incomplete until name and phone are added', async () => {
    const { body } = await t.api('POST', '/api/auth/login', { body: { email, password: 'NewPassw0rd' } });
    const me = await t.api('GET', '/api/auth/me', { token: body.token });
    assert.equal(me.body.profile_complete, false);
    const bad = await t.api('PATCH', '/api/users/me', { token: body.token, body: { first_name: 'Pema', phone_number: 'abc' } });
    assert.equal(bad.status, 400);
    assert.ok(bad.body.fields.last_name && bad.body.fields.phone_number);
    const ok = await t.api('PATCH', '/api/users/me', {
      token: body.token,
      body: { first_name: 'Pema', last_name: 'Wangmo', phone_number: '17123456', gender: 'Female', citizenship_id: '11500000001' },
    });
    assert.equal(ok.status, 200);
    assert.equal(ok.body.profile_complete, true);
  });

  test('a CID already used by another account is refused', async () => {
    const other = await t.makeUser('Guest');
    const res = await t.api('PATCH', '/api/users/me', {
      token: other.token,
      body: { first_name: 'A', last_name: 'B', phone_number: '17123457', citizenship_id: '11500000001' },
    });
    assert.equal(res.status, 409);
    assert.equal(res.body.code, 'CID_TAKEN');
  });

  test('no token or a junk token gets 401', async () => {
    assert.equal((await t.api('GET', '/api/auth/me')).status, 401);
    assert.equal((await t.api('GET', '/api/auth/me', { token: 'junk' })).status, 401);
  });

  test('a switched-off account cannot sign in', async () => {
    const u = await t.makeUser('Guest');
    await t.db().query("UPDATE users SET status = 'Inactive' WHERE email = ?", [u.email]);
    const res = await t.api('POST', '/api/auth/login', { body: { email: u.email, password: u.password } });
    assert.equal(res.status, 403);
    assert.equal(res.body.code, 'ACCOUNT_INACTIVE');
    assert.equal((await t.api('GET', '/api/auth/me', { token: u.token })).status, 403, 'old tokens stop working too');
  });
});
