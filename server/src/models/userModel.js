import { getPool } from '../config/db.js';

const db = (conn) => conn || getPool();

// Fields that are safe to send to the browser (never the password hash).
export const PUBLIC_FIELDS =
  'user_id, first_name, last_name, email, email_verified, phone_number, citizenship_id, gender, sid, department, role, status, created_at';

export function toPublic(user) {
  if (!user) return user;
  const { password, ...rest } = user;
  return { ...rest, email_verified: Boolean(rest.email_verified) };
}

export async function findByEmail(email, conn) {
  const [rows] = await db(conn).query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0];
}

export async function findById(id, conn) {
  const [rows] = await db(conn).query('SELECT * FROM users WHERE user_id = ?', [id]);
  return rows[0];
}

export async function create({ email, passwordHash, role = 'Guest', emailVerified = false }, conn) {
  const [result] = await db(conn).query('INSERT INTO users (email, password, role, email_verified) VALUES (?, ?, ?, ?)', [
    email,
    passwordHash,
    role,
    emailVerified,
  ]);
  return result.insertId;
}

export async function markVerified(id, conn) {
  await db(conn).query('UPDATE users SET email_verified = TRUE WHERE user_id = ?', [id]);
}

export async function setPassword(id, passwordHash, conn) {
  await db(conn).query('UPDATE users SET password = ? WHERE user_id = ?', [passwordHash, id]);
}

const PROFILE_COLUMNS = ['first_name', 'last_name', 'phone_number', 'citizenship_id', 'gender', 'sid', 'department'];

export async function updateProfile(id, fields, conn) {
  const cols = PROFILE_COLUMNS.filter((c) => c in fields);
  if (cols.length === 0) return;
  await db(conn).query(`UPDATE users SET ${cols.map((c) => `${c} = ?`).join(', ')} WHERE user_id = ?`, [
    ...cols.map((c) => fields[c]),
    id,
  ]);
}

export async function list({ q, role } = {}, conn) {
  const where = [];
  const params = [];
  if (q) {
    where.push("(email LIKE ? OR CONCAT_WS(' ', first_name, last_name) LIKE ?)");
    params.push(`%${q}%`, `%${q}%`);
  }
  if (role) {
    where.push('role = ?');
    params.push(role);
  }
  const [rows] = await db(conn).query(
    `SELECT ${PUBLIC_FIELDS} FROM users ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY created_at DESC LIMIT 500`,
    params
  );
  return rows.map(toPublic);
}

export async function updateRoleStatus(id, { role, status }, conn) {
  const sets = [];
  const params = [];
  if (role) {
    sets.push('role = ?');
    params.push(role);
  }
  if (status) {
    sets.push('status = ?');
    params.push(status);
  }
  if (sets.length) await db(conn).query(`UPDATE users SET ${sets.join(', ')} WHERE user_id = ?`, [...params, id]);
}

export async function countActiveSuperAdmins(conn) {
  const [rows] = await db(conn).query("SELECT COUNT(*) AS n FROM users WHERE role = 'Super Admin' AND status = 'Active'");
  return rows[0].n;
}
