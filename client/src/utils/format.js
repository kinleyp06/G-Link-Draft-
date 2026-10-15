const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// '2026-10-12' -> '12 Oct 2026'
export function formatDate(value, { year = true } = {}) {
  if (!value) return '';
  const [y, m, d] = String(value).slice(0, 10).split('-');
  return `${Number(d)} ${MONTHS[Number(m) - 1]}${year ? ` ${y}` : ''}`;
}

// '2026-10-12 14:05:00' -> '12 Oct 2026, 14:05'
export function formatDateTime(value) {
  if (!value) return '';
  return `${formatDate(value)}, ${String(value).slice(11, 16)}`;
}

export function money(n) {
  return `Nu. ${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function nights(checkIn, checkOut) {
  return Math.round((Date.parse(checkOut) - Date.parse(checkIn)) / 86400000);
}

// Today in Bhutan as 'YYYY-MM-DD'
export function todayStr(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Thimphu', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

export function addDaysStr(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function personName(first, last, fallback = '') {
  return [first, last].filter(Boolean).join(' ') || fallback;
}

export const GUEST_TYPES = ['RUB Staff', 'RUB Student', 'Official', 'Private'];
export const ALL_GUEST_TYPES = [...GUEST_TYPES, 'International'];
