import { getPool } from '../config/db.js';

const db = (conn) => conn || getPool();
const HOLDS_BEDS = "('Pending','Approved')";

const BOOKING_SELECT = `
  SELECT b.*, r.room_number, r.room_type, r.total_beds, r.guest_house_id, g.name AS guest_house_name,
         u.email AS user_email, u.first_name AS user_first_name, u.last_name AS user_last_name,
         u.phone_number AS user_phone_number,
         (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.booking_id = b.booking_id) AS amount_paid
  FROM bookings b
  JOIN rooms r ON r.room_id = b.room_id
  JOIN guest_houses g ON g.guest_house_id = r.guest_house_id
  JOIN users u ON u.user_id = b.user_id`;

function shape(row) {
  if (!row) return row;
  return {
    ...row,
    share_room: Boolean(row.share_room),
    is_international: Boolean(row.is_international),
    ref: `GL-${String(row.booking_id).padStart(4, '0')}`,
    amount_due: Math.max(0, Math.round((row.total_amount - row.amount_paid) * 100) / 100),
  };
}

export async function findBooking(id, conn, { lock = false } = {}) {
  if (lock) await db(conn).query('SELECT booking_id FROM bookings WHERE booking_id = ? FOR UPDATE', [id]);
  const [rows] = await db(conn).query(`${BOOKING_SELECT} WHERE b.booking_id = ?`, [id]);
  return shape(rows[0]);
}

// filters: userId, status, guestHouseId, roomId, q (name/email/ref), from/to (stays touching that range)
export async function listBookings(filters = {}, conn) {
  const where = [];
  const params = [];
  if (filters.userId) {
    where.push('b.user_id = ?');
    params.push(filters.userId);
  }
  if (filters.status) {
    const list = [].concat(filters.status);
    where.push(`b.status IN (${list.map(() => '?').join(',')})`);
    params.push(...list);
  }
  if (filters.guestHouseId) {
    where.push('r.guest_house_id = ?');
    params.push(filters.guestHouseId);
  }
  if (filters.from && filters.to) {
    where.push('b.check_in <= ? AND b.check_out >= ?');
    params.push(filters.to, filters.from);
  }
  if (filters.q) {
    const q = String(filters.q).trim();
    const idFromRef = /^gl-?0*(\d+)$/i.exec(q)?.[1];
    where.push(
      `(u.email LIKE ? OR CONCAT_WS(' ', u.first_name, u.last_name) LIKE ? OR b.booking_id = ?
        OR EXISTS (SELECT 1 FROM booking_guests bg WHERE bg.booking_id = b.booking_id AND (bg.full_name LIKE ? OR bg.citizenship_id = ?)))`
    );
    params.push(`%${q}%`, `%${q}%`, Number(idFromRef || 0), `%${q}%`, q);
  }
  const order = filters.order === 'upcoming' ? 'b.check_in ASC' : 'b.created_at DESC';
  const [rows] = await db(conn).query(
    `${BOOKING_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${order}, b.booking_id DESC LIMIT 500`,
    params
  );
  return rows.map(shape);
}

// Everything that holds beds in these rooms during [checkIn, checkOut).
export async function occupancy(roomIds, checkIn, checkOut, { excludeBookingId = 0 } = {}, conn) {
  const ids = [].concat(roomIds);
  if (ids.length === 0) return { bookings: [], blocks: [] };
  const marks = ids.map(() => '?').join(',');
  const [bookings] = await db(conn).query(
    `SELECT booking_id, room_id, check_in, check_out, beds, share_room FROM bookings
     WHERE room_id IN (${marks}) AND status IN ${HOLDS_BEDS} AND check_in < ? AND check_out > ? AND booking_id <> ?`,
    [...ids, checkOut, checkIn, excludeBookingId]
  );
  const [blocks] = await db(conn).query(
    `SELECT room_block_id, room_id, start_date, end_date, beds FROM room_blocks
     WHERE room_id IN (${marks}) AND start_date < ? AND end_date > ?`,
    [...ids, checkOut, checkIn]
  );
  return {
    bookings: bookings.map((b) => ({ ...b, share_room: Boolean(b.share_room) })),
    blocks,
  };
}

export async function insertBooking(f, conn) {
  const [r] = await db(conn).query(
    `INSERT INTO bookings (user_id, room_id, check_in, check_out, beds, guest_type, purpose, share_room, is_international,
       rate_amount, total_amount, status, reviewed_by, reviewed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      f.user_id,
      f.room_id,
      f.check_in,
      f.check_out,
      f.beds,
      f.guest_type,
      f.purpose,
      f.share_room,
      f.is_international || false,
      f.rate_amount,
      f.total_amount,
      f.status || 'Pending',
      f.reviewed_by || null,
      f.reviewed_by ? new Date() : null,
    ]
  );
  return r.insertId;
}

export async function insertGuests(bookingId, guests, conn) {
  for (const g of guests) {
    await db(conn).query(
      'INSERT INTO booking_guests (booking_id, full_name, gender, citizenship_id, nationality, phone_number) VALUES (?, ?, ?, ?, ?, ?)',
      [bookingId, g.full_name, g.gender || null, g.citizenship_id || null, g.nationality || 'Bhutanese', g.phone_number || null]
    );
  }
}

export async function listGuests(bookingId, conn) {
  const [rows] = await db(conn).query('SELECT * FROM booking_guests WHERE booking_id = ? ORDER BY booking_guest_id', [bookingId]);
  return rows;
}

export async function setStatus(id, { status, adminNote, reviewedBy }, conn) {
  await db(conn).query(
    `UPDATE bookings SET status = ?, admin_note = COALESCE(?, admin_note),
       reviewed_by = COALESCE(?, reviewed_by), reviewed_at = IF(? IS NULL, reviewed_at, NOW())
     WHERE booking_id = ?`,
    [status, adminNote ?? null, reviewedBy ?? null, reviewedBy ?? null, id]
  );
}

export async function setRoom(id, roomId, conn) {
  await db(conn).query('UPDATE bookings SET room_id = ? WHERE booking_id = ?', [roomId, id]);
}

export async function setCheckOut(id, checkOut, total, conn) {
  await db(conn).query('UPDATE bookings SET check_out = ?, total_amount = ? WHERE booking_id = ?', [checkOut, total, id]);
}

export async function markCheckedIn(id, conn) {
  await db(conn).query('UPDATE bookings SET checked_in_at = NOW() WHERE booking_id = ?', [id]);
}

export async function markCheckedOut(id, conn) {
  await db(conn).query("UPDATE bookings SET checked_out_at = NOW(), status = 'Completed' WHERE booking_id = ?", [id]);
}

// ---------- room sharing ----------
// Rebuilds the sharing rows for an approved booking (both directions).
export async function refreshSharing(booking, conn) {
  await clearSharing(booking.booking_id, conn);
  const [others] = await db(conn).query(
    `SELECT booking_id FROM bookings WHERE room_id = ? AND status = 'Approved' AND booking_id <> ?
       AND check_in < ? AND check_out > ?`,
    [booking.room_id, booking.booking_id, booking.check_out, booking.check_in]
  );
  for (const o of others) {
    await db(conn).query(
      'INSERT IGNORE INTO room_sharing (booking_id, shared_with_booking_id) VALUES (?, ?), (?, ?)',
      [booking.booking_id, o.booking_id, o.booking_id, booking.booking_id]
    );
  }
  return others.length;
}

export async function clearSharing(bookingId, conn) {
  await db(conn).query('DELETE FROM room_sharing WHERE booking_id = ? OR shared_with_booking_id = ?', [bookingId, bookingId]);
}

// Other guests in the same room (no names: privacy). Returns { bookings, beds }.
export async function sharingSummary(bookingId, conn) {
  const [rows] = await db(conn).query(
    `SELECT COUNT(*) AS bookings, COALESCE(SUM(b.beds), 0) AS beds FROM room_sharing s
     JOIN bookings b ON b.booking_id = s.shared_with_booking_id
     WHERE s.booking_id = ? AND b.status IN ('Approved','Completed')`,
    [bookingId]
  );
  return { bookings: Number(rows[0].bookings), beds: Number(rows[0].beds) };
}

// ---------- extensions ----------
const EXT_SELECT = `
  SELECT e.*, b.user_id, b.room_id, b.check_in, b.beds, b.status AS booking_status, r.room_number, g.name AS guest_house_name,
         u.email AS user_email, u.first_name AS user_first_name, u.last_name AS user_last_name
  FROM stay_extensions e
  JOIN bookings b ON b.booking_id = e.booking_id
  JOIN rooms r ON r.room_id = b.room_id
  JOIN guest_houses g ON g.guest_house_id = r.guest_house_id
  JOIN users u ON u.user_id = b.user_id`;

export async function insertExtension(f, conn) {
  const [r] = await db(conn).query(
    'INSERT INTO stay_extensions (booking_id, current_check_out, new_check_out, reason, extra_amount) VALUES (?, ?, ?, ?, ?)',
    [f.booking_id, f.current_check_out, f.new_check_out, f.reason, f.extra_amount]
  );
  return r.insertId;
}

export async function findExtension(id, conn, { lock = false } = {}) {
  if (lock) await db(conn).query('SELECT stay_extension_id FROM stay_extensions WHERE stay_extension_id = ? FOR UPDATE', [id]);
  const [rows] = await db(conn).query(`${EXT_SELECT} WHERE e.stay_extension_id = ?`, [id]);
  return rows[0];
}

export async function listExtensions({ status, bookingId } = {}, conn) {
  const where = [];
  const params = [];
  if (status) {
    where.push('e.status = ?');
    params.push(status);
  }
  if (bookingId) {
    where.push('e.booking_id = ?');
    params.push(bookingId);
  }
  const [rows] = await db(conn).query(
    `${EXT_SELECT} ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY e.created_at DESC LIMIT 500`,
    params
  );
  return rows;
}

export async function setExtensionStatus(id, { status, adminNote, reviewedBy }, conn) {
  await db(conn).query(
    'UPDATE stay_extensions SET status = ?, admin_note = ?, reviewed_by = ?, reviewed_at = NOW() WHERE stay_extension_id = ?',
    [status, adminNote || null, reviewedBy, id]
  );
}

// ---------- room blocks ----------
export async function listBlocks({ fromDate } = {}, conn) {
  const [rows] = await db(conn).query(
    `SELECT k.*, r.room_number, r.total_beds, g.name AS guest_house_name FROM room_blocks k
     JOIN rooms r ON r.room_id = k.room_id JOIN guest_houses g ON g.guest_house_id = r.guest_house_id
     ${fromDate ? 'WHERE k.end_date > ?' : ''} ORDER BY k.start_date`,
    fromDate ? [fromDate] : []
  );
  return rows;
}

export async function insertBlock(f, conn) {
  const [r] = await db(conn).query(
    'INSERT INTO room_blocks (room_id, beds, start_date, end_date, reason, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    [f.room_id, f.beds, f.start_date, f.end_date, f.reason, f.created_by]
  );
  return r.insertId;
}

export async function deleteBlock(id, conn) {
  const [r] = await db(conn).query('DELETE FROM room_blocks WHERE room_block_id = ?', [id]);
  return r.affectedRows;
}

// ---------- payments ----------
export async function listPayments({ bookingId, hallBookingId }, conn) {
  const [rows] = await db(conn).query(
    `SELECT p.*, u.email AS recorded_by_email FROM payments p JOIN users u ON u.user_id = p.recorded_by
     WHERE ${bookingId ? 'p.booking_id = ?' : 'p.hall_booking_id = ?'} ORDER BY p.paid_at`,
    [bookingId || hallBookingId]
  );
  return rows;
}

export async function insertPayment(f, conn) {
  const [r] = await db(conn).query(
    'INSERT INTO payments (booking_id, hall_booking_id, amount, method, reference_no, recorded_by) VALUES (?, ?, ?, ?, ?, ?)',
    [f.booking_id || null, f.hall_booking_id || null, f.amount, f.method, f.reference_no || null, f.recorded_by]
  );
  return r.insertId;
}

// ---------- jobs ----------
export async function expirePending(beforeDate, conn) {
  const [r] = await db(conn).query(
    `UPDATE bookings SET status = 'Cancelled', admin_note = 'Cancelled automatically: not reviewed before the check-in date.'
     WHERE status = 'Pending' AND check_in < ?`,
    [beforeDate]
  );
  return r.affectedRows;
}
