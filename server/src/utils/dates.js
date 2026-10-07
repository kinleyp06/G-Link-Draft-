// Dates are plain 'YYYY-MM-DD' strings everywhere. Maths is done in UTC so
// daylight saving or the server's time zone never shifts a day.

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDate(value) {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function addDays(date, days) {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Nights between check-in and check-out (check-out morning is not a night).
export function nightsBetween(checkIn, checkOut) {
  return Math.round((Date.parse(`${checkOut}T00:00:00Z`) - Date.parse(`${checkIn}T00:00:00Z`)) / 86400000);
}

// Every night from start up to (not including) end.
export function eachNight(start, end) {
  const nights = [];
  for (let d = start; d < end; d = addDays(d, 1)) nights.push(d);
  return nights;
}

// Two stays [aStart, aEnd) and [bStart, bEnd) share at least one night.
export function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

// Today's date in the given time zone (Bhutan by default).
export function today(timeZone = 'Asia/Thimphu', now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
