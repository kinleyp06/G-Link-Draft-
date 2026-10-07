// Test setup: builds a fresh test database from ../database/schema and starts the API.
// Needs MySQL and these settings (in the environment or server/.env):
//   TEST_DB_HOST, TEST_DB_USER, TEST_DB_PASSWORD, TEST_DB_NAME (default g_link_test)
//   SCHEMA_DIR (default ../database, the database branch merged in)
// The test database is DROPPED and re-created on every run: never point it at real data.
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const here = path.dirname(fileURLToPath(import.meta.url));
const dbDir = path.resolve(here, '../../', process.env.SCHEMA_DIR || '../database');
const testDb = process.env.TEST_DB_NAME || 'g_link_test';

export async function whyNotReady() {
  if (!process.env.TEST_DB_USER) return 'TEST_DB_USER is not set (see server/.env.example).';
  if (testDb === (process.env.DB_NAME || 'g_link') || testDb === 'g_link') return 'TEST_DB_NAME must not be the real database.';
  if (!fs.existsSync(path.join(dbDir, 'schema'))) return `No schema folder at ${dbDir}/schema (merge the database branch or set SCHEMA_DIR).`;
  try {
    const conn = await mysql.createConnection(connOptions());
    await conn.end();
  } catch (err) {
    return `Cannot reach MySQL for tests: ${err.code || err.message}`;
  }
  return null;
}

function connOptions() {
  return {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: Number(process.env.TEST_DB_PORT || 3306),
    user: process.env.TEST_DB_USER,
    password: process.env.TEST_DB_PASSWORD || '',
    multipleStatements: true,
  };
}

function sqlFor(file) {
  // The scripts say USE g_link; run them against the test database instead.
  return fs
    .readFileSync(file, 'utf8')
    .replace(/^\s*USE\s+g_link\s*;/gim, '')
    .replace(/^\s*CREATE DATABASE[\s\S]*?;/im, '');
}

export async function resetDatabase() {
  const conn = await mysql.createConnection(connOptions());
  await conn.query(`DROP DATABASE IF EXISTS \`${testDb}\``);
  await conn.query(`CREATE DATABASE \`${testDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${testDb}\``);
  const files = fs
    .readdirSync(path.join(dbDir, 'schema'))
    .filter((f) => /^\d\d_.*\.sql$/.test(f) && !f.startsWith('00_'))
    .sort();
  for (const f of files) await conn.query(sqlFor(path.join(dbDir, 'schema', f)));
  await conn.query(sqlFor(path.join(dbDir, 'seed', '01_sample_data.sql')));
  await conn.end();
}

// Starts the API against the test database. Returns helpers for the tests.
export async function startApi() {
  Object.assign(process.env, {
    NODE_ENV: 'test',
    DB_HOST: process.env.TEST_DB_HOST || 'localhost',
    DB_PORT: process.env.TEST_DB_PORT || '3306',
    DB_USER: process.env.TEST_DB_USER,
    DB_PASSWORD: process.env.TEST_DB_PASSWORD || '',
    DB_NAME: testDb,
    JWT_SECRET: 'integration-test-secret',
    EMAIL_HOST: '',
    CLIENT_URL: 'http://localhost:5173',
  });
  const { createApp } = await import('../../src/app.js');
  const { getPool, closePool } = await import('../../src/config/db.js');
  const { outbox } = await import('../../src/emails/mailer.js');
  const { hashPassword } = await import('../../src/services/authService.js');
  const { todayHere } = await import('../../src/services/stayRules.js');
  const { addDays } = await import('../../src/utils/dates.js');

  const server = createApp({ clientUrl: 'http://localhost:5173', rateLimits: false }).listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;

  async function api(method, url, { body, token } = {}) {
    const res = await fetch(`${base}${url}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, body: await res.json() };
  }

  let n = 0;
  // Makes a verified user with a complete profile and signs them in.
  async function makeUser(role = 'Guest', extra = {}) {
    n += 1;
    const email = `${role.replace(' ', '').toLowerCase()}${n}-${Date.now()}@test.glink`;
    const password = 'Passw0rd!';
    await getPool().query(
      `INSERT INTO users (email, password, role, email_verified, first_name, last_name, phone_number)
       VALUES (?, ?, ?, TRUE, ?, ?, ?)`,
      [email, await hashPassword(password), role, extra.first_name ?? 'Test', extra.last_name ?? role, extra.phone_number ?? '17000000']
    );
    const login = await api('POST', '/api/auth/login', { body: { email, password } });
    return { email, password, token: login.body.token, user: login.body.user };
  }

  const roomId = async (number) => (await getPool().query('SELECT room_id FROM rooms WHERE room_number = ?', [number]))[0][0].room_id;
  const day = (n) => addDays(todayHere(), n);

  async function stop() {
    await new Promise((r) => server.close(r));
    await closePool();
  }

  return { api, makeUser, outbox, roomId, day, db: getPool, stop };
}
