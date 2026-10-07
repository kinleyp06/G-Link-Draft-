import { getPool } from '../config/db.js';

const db = (conn) => conn || getPool();

const SELECT = `
  SELECT hb.*, h.name AS hall_name, h.capacity, g.name AS guest_house_name,
         u.email AS user_email, u.first_name AS user_first_name, u.last_name AS user_last_name,
         (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.hall_booking_id = hb.hall_booking_id) AS amount_paid
  FROM hall_bookings hb
  JOIN halls h ON h.hall_id = hb.hall_id
  JOIN guest_houses g ON g.guest_house_id = h.guest_house_id
  JOIN users u ON u.user_id = hb.user_id`;

const shape = (row) =>
  row && {
    ...row,
    start_time: row.start_time.slice(0, 5),
    end_time: row.end_time.slice(0, 5),
    ref: `GH-${String(row.hall_booking_id).padStart(4, '0')}`,
    amount_due: Math.max(0, Math.round((row.total_amount - row.amount_paid) * 100) / 100),
  };

export async function find(id, conn, { lock = false } = {}) {
  if (lock) await db(conn).query('SELECT hall_booking_id FROM hall_bookings WHERE hall_booking_id = ? FOR UPDATE', [id]);
  const [rows] = await db(conn).query(`${SELECT} WHERE hb.hall_booking_id = ?`, [id]);
  return shape(rows[0]);
}

export async function list({ userId, status, hallId, date } = {}, conn) {
  const where = [];
  const params = [];
  if (userId) {
    where.push('hb.user_id = ?');
    params.push(userId);
  }
  if (status) {
    const s = [].concat(status);
    where.push(`hb.status IN (${s.map(() => '?').join(',')})`);
    params.push(...s);
  }
  if (hallId) {
    where.push('hb.hall_id = ?');
    params.push(hallId);
  }
  if (date) {
    where.push('hb.event_date = ?');
    params.push(date);
  }
  const [rows] = await db(conn).query(
    `${SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY hb.event_date DESC, hb.start_time LIMIT 500`,
    params
  );
  return rows.map(shape);
}

// Pending + Approved bookings of a hall on one day (they hold the time slot).
export async function sameDay(hallId, date, excludeId = 0, conn) {
  const [rows] = await db(conn).query(
    `SELECT hall_booking_id, start_time, end_time FROM hall_bookings
     WHERE hall_id = ? AND event_date = ? AND status IN ('Pending','Approved') AND hall_booking_id <> ?`,
    [hallId, date, excludeId]
  );
  return rows;
}

export async function insert(f, conn) {
  const [r] = await db(conn).query(
    `INSERT INTO hall_bookings (hall_id, user_id, event_date, start_time, end_time, attendees, purpose, guest_type, rate_amount, total_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [f.hall_id, f.user_id, f.event_date, f.start_time, f.end_time, f.attendees, f.purpose, f.guest_type, f.rate_amount, f.total_amount]
  );
  return r.insertId;
}

export async function setStatus(id, { status, adminNote, reviewedBy }, conn) {
  await db(conn).query(
    `UPDATE hall_bookings SET status = ?, admin_note = COALESCE(?, admin_note),
       reviewed_by = COALESCE(?, reviewed_by), reviewed_at = IF(? IS NULL, reviewed_at, NOW())
     WHERE hall_booking_id = ?`,
    [status, adminNote ?? null, reviewedBy ?? null, reviewedBy ?? null, id]
  );
}

export async function completePast(beforeDate, conn) {
  const [r] = await db(conn).query(
    "UPDATE hall_bookings SET status = 'Completed' WHERE status = 'Approved' AND event_date < ?",
    [beforeDate]
  );
  return r.affectedRows;
}

export async function expirePending(beforeDate, conn) {
  const [r] = await db(conn).query(
    `UPDATE hall_bookings SET status = 'Cancelled', admin_note = 'Cancelled automatically: not reviewed before the event date.'
     WHERE status = 'Pending' AND event_date < ?`,
    [beforeDate]
  );
  return r.affectedRows;
}
