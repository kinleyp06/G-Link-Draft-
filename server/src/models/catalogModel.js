import { getPool } from '../config/db.js';

const db = (conn) => conn || getPool();

// ---------- guest houses ----------
export async function listGuestHouses({ activeOnly = true } = {}, conn) {
  const [rows] = await db(conn).query(
    `SELECT * FROM guest_houses ${activeOnly ? "WHERE status = 'Active'" : ''} ORDER BY name`
  );
  return rows;
}

export async function findGuestHouse(id, conn) {
  const [rows] = await db(conn).query('SELECT * FROM guest_houses WHERE guest_house_id = ?', [id]);
  return rows[0];
}

export async function createGuestHouse(f, conn) {
  const [r] = await db(conn).query(
    'INSERT INTO guest_houses (name, location, description, contact_phone, status) VALUES (?, ?, ?, ?, ?)',
    [f.name, f.location, f.description, f.contact_phone, f.status || 'Active']
  );
  return r.insertId;
}

export async function updateGuestHouse(id, f, conn) {
  await db(conn).query(
    'UPDATE guest_houses SET name = ?, location = ?, description = ?, contact_phone = ?, status = ? WHERE guest_house_id = ?',
    [f.name, f.location, f.description, f.contact_phone, f.status, id]
  );
}

// ---------- rooms ----------
const ROOM_SELECT = `
  SELECT r.*, g.name AS guest_house_name, g.location AS guest_house_location, g.status AS guest_house_status
  FROM rooms r JOIN guest_houses g ON g.guest_house_id = r.guest_house_id`;

export async function listRooms({ guestHouseId, activeOnly = true } = {}, conn) {
  const where = [];
  const params = [];
  if (activeOnly) where.push("r.status = 'Active' AND g.status = 'Active'");
  if (guestHouseId) {
    where.push('r.guest_house_id = ?');
    params.push(guestHouseId);
  }
  const [rows] = await db(conn).query(
    `${ROOM_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY g.name, r.room_number`,
    params
  );
  return rows;
}

export async function findRoom(id, conn, { lock = false } = {}) {
  const [rows] = await db(conn).query(`${ROOM_SELECT} WHERE r.room_id = ? ${lock ? 'FOR UPDATE' : ''}`, [id]);
  return rows[0];
}

export async function createRoom(f, conn) {
  const [r] = await db(conn).query(
    'INSERT INTO rooms (guest_house_id, room_number, room_type, total_beds, description, status) VALUES (?, ?, ?, ?, ?, ?)',
    [f.guest_house_id, f.room_number, f.room_type, f.total_beds, f.description, f.status || 'Active']
  );
  return r.insertId;
}

export async function updateRoom(id, f, conn) {
  await db(conn).query(
    'UPDATE rooms SET guest_house_id = ?, room_number = ?, room_type = ?, total_beds = ?, description = ?, status = ? WHERE room_id = ?',
    [f.guest_house_id, f.room_number, f.room_type, f.total_beds, f.description, f.status, id]
  );
}

// ---------- halls ----------
const HALL_SELECT = `
  SELECT h.*, g.name AS guest_house_name FROM halls h JOIN guest_houses g ON g.guest_house_id = h.guest_house_id`;

export async function listHalls({ activeOnly = true } = {}, conn) {
  const [rows] = await db(conn).query(
    `${HALL_SELECT} ${activeOnly ? "WHERE h.status = 'Active' AND g.status = 'Active'" : ''} ORDER BY g.name, h.name`
  );
  return rows;
}

export async function findHall(id, conn, { lock = false } = {}) {
  const [rows] = await db(conn).query(`${HALL_SELECT} WHERE h.hall_id = ? ${lock ? 'FOR UPDATE' : ''}`, [id]);
  return rows[0];
}

export async function createHall(f, conn) {
  const [r] = await db(conn).query(
    'INSERT INTO halls (guest_house_id, name, capacity, description, status) VALUES (?, ?, ?, ?, ?)',
    [f.guest_house_id, f.name, f.capacity, f.description, f.status || 'Active']
  );
  return r.insertId;
}

export async function updateHall(id, f, conn) {
  await db(conn).query(
    'UPDATE halls SET guest_house_id = ?, name = ?, capacity = ?, description = ?, status = ? WHERE hall_id = ?',
    [f.guest_house_id, f.name, f.capacity, f.description, f.status, id]
  );
}

// ---------- rates ----------
export async function listRates(conn) {
  const [rows] = await db(conn).query('SELECT guest_type, rate_type, amount, updated_at FROM rates ORDER BY rate_id');
  return rows;
}

export async function findRate(guestType, rateType, conn) {
  const [rows] = await db(conn).query('SELECT amount FROM rates WHERE guest_type = ? AND rate_type = ?', [guestType, rateType]);
  return rows[0]?.amount;
}

export async function upsertRate({ guest_type, rate_type, amount }, userId, conn) {
  await db(conn).query(
    `INSERT INTO rates (guest_type, rate_type, amount, updated_by) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE amount = VALUES(amount), updated_by = VALUES(updated_by)`,
    [guest_type, rate_type, amount, userId]
  );
}
