import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig } from '../../src/config/env.js';

const minimal = { DB_HOST: 'localhost', DB_USER: 'glink_test', DB_NAME: 'g_link' };

test('fills in defaults', () => {
  const config = loadConfig(minimal);
  assert.equal(config.port, 5000);
  assert.equal(config.clientUrl, 'http://localhost:5173');
  assert.deepEqual(config.db, {
    host: 'localhost',
    port: 3306,
    user: 'glink_test',
    password: '',
    database: 'g_link',
  });
});

test('uses given values', () => {
  const config = loadConfig({ ...minimal, PORT: '8080', DB_PORT: '3307', DB_PASSWORD: 'pw', CLIENT_URL: 'http://x' });
  assert.equal(config.port, 8080);
  assert.equal(config.db.port, 3307);
  assert.equal(config.db.password, 'pw');
  assert.equal(config.clientUrl, 'http://x');
});

test('lists every missing required setting', () => {
  assert.throws(() => loadConfig({}), {
    message: /Missing settings in server\/\.env: DB_HOST, DB_USER, DB_NAME/,
  });
});

test('treats blank values as missing', () => {
  assert.throws(() => loadConfig({ ...minimal, DB_USER: '  ' }), { message: /: DB_USER\./ });
});
