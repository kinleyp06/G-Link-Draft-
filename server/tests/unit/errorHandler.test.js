import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { notFound, errorHandler } from '../../src/middleware/errorHandler.js';
import { AppError } from '../../src/utils/AppError.js';
import { createApp } from '../../src/app.js';

// Minimal fake of Express's res object
function fakeRes() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test('AppError is sent as is', () => {
  const res = fakeRes();
  errorHandler(new AppError('Room not found', 404, 'ROOM_NOT_FOUND'), {}, res, () => {});
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { message: 'Room not found', code: 'ROOM_NOT_FOUND' });
});

test('unknown error gives a safe 500 without details', (t) => {
  t.mock.method(console, 'error', () => {});
  const res = fakeRes();
  errorHandler(new Error('ER_SECRET: password=hunter2 at db.js:12'), {}, res, () => {});
  assert.equal(res.statusCode, 500);
  assert.equal(res.body.code, 'INTERNAL_ERROR');
  assert.deepEqual(Object.keys(res.body).sort(), ['code', 'message']);
  assert.doesNotMatch(res.body.message, /hunter2|ER_SECRET|db\.js/);
});

test('notFound passes a 404 AppError on', () => {
  let passed;
  notFound({ method: 'GET', originalUrl: '/nope' }, fakeRes(), (err) => (passed = err));
  assert.ok(passed instanceof AppError);
  assert.equal(passed.statusCode, 404);
  assert.equal(passed.code, 'NOT_FOUND');
});

// Same rules checked through the real app over HTTP
let server;
let base;

before(async () => {
  const app = createApp({
    clientUrl: 'http://localhost:5173',
    checkDb: async () => ({ ok: false, message: 'MySQL refused the login.' }),
  });
  app.post('/echo', (req, res) => res.json(req.body));
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());

test('GET /health returns { status: "ok" }', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok' });
});

test('bad JSON gives 400 BAD_JSON', async () => {
  const res = await fetch(`${base}/echo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"email": ',
  });
  assert.equal(res.status, 400);
  assert.deepEqual(await res.json(), { message: 'The request body is not valid JSON.', code: 'BAD_JSON' });
});

test('unknown route gives 404 NOT_FOUND', async () => {
  const res = await fetch(`${base}/no-such-route`);
  assert.equal(res.status, 404);
  assert.equal((await res.json()).code, 'NOT_FOUND');
});

test('GET /health/db gives 503 DB_DOWN when the database is down', async () => {
  const res = await fetch(`${base}/health/db`);
  assert.equal(res.status, 503);
  assert.deepEqual(await res.json(), { message: 'MySQL refused the login.', code: 'DB_DOWN' });
});
