import mysql from 'mysql2/promise';
import { getConfig } from './env.js';
import { describeDbError } from '../utils/dbErrors.js';

let pool;

// One shared connection pool for the whole app, created on first use.
export function getPool() {
  if (!pool) {
    const { db } = getConfig();
    pool = mysql.createPool({
      host: db.host,
      port: db.port,
      user: db.user,
      password: db.password,
      database: db.database,
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 5000,
      charset: 'utf8mb4',
      // DATE / DATETIME come back as plain strings ('2026-10-12'), DECIMAL as numbers
      dateStrings: true,
      decimalNumbers: true,
    });
  }
  return pool;
}

// Checks the database is reachable. Never throws.
export async function testConnection() {
  try {
    await getPool().query('SELECT 1');
    return { ok: true, message: 'Connected to the database.' };
  } catch (err) {
    return { ok: false, message: describeDbError(err) };
  }
}

// Runs fn(conn) inside a transaction; commits if it finishes, rolls back if it throws.
export async function withTransaction(fn) {
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function closePool() {
  if (pool) {
    await pool.end();
    pool = undefined;
  }
}
