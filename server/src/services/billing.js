import { nightsBetween } from '../utils/dates.js';

const round2 = (n) => Math.round(n * 100) / 100;

// Room bill: nights x beds x rate (rate is per bed per night).
export function roomBill({ checkIn, checkOut, beds, rate }) {
  const nights = nightsBetween(checkIn, checkOut);
  return { nights, beds, rate, total: round2(nights * beds * rate) };
}

// Extra cost of staying longer, at the rate the booking was made with.
export function extensionCost({ currentCheckOut, newCheckOut, beds, rate }) {
  const nights = nightsBetween(currentCheckOut, newCheckOut);
  return { nights, total: round2(nights * beds * rate) };
}

// What is still owed after payments.
export function balance(total, payments = []) {
  const paid = round2(payments.reduce((sum, p) => sum + Number(p.amount), 0));
  const due = round2(Math.max(0, total - paid));
  return { paid, due, is_paid: due === 0 };
}
