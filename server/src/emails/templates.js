// Every email G-Link sends. Plain words; the same text is in docs/email-texts.
// Each function returns { subject, text, html }.

const escapeHtml = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function build(subject, lines, link) {
  const text = [...lines, ...(link ? ['', `${link.label}: ${link.url}`] : []), '', '— G-Link, Royal University of Bhutan'].join('\n');
  const html =
    lines.map((l) => `<p>${escapeHtml(l)}</p>`).join('') +
    (link ? `<p><a href="${escapeHtml(link.url)}">${escapeHtml(link.label)}</a></p>` : '') +
    '<p style="color:#666">— G-Link, Royal University of Bhutan</p>';
  return { subject, text, html };
}

export const ref = (id) => `GL-${String(id).padStart(4, '0')}`;
const hallRef = (id) => `GH-${String(id).padStart(4, '0')}`;
const nu = (n) => `Nu. ${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const stay = (b) => `Room ${b.room_number}, ${b.guest_house_name}, ${b.check_in} to ${b.check_out}`;

export const templates = {
  verifyEmail: ({ url }) =>
    build('Verify your G-Link email', ['Welcome to G-Link.', 'Click the link below to verify your email. It works for 24 hours.'], {
      label: 'Verify my email',
      url,
    }),

  resetPassword: ({ url }) =>
    build(
      'Reset your G-Link password',
      ['Someone asked to reset your G-Link password.', 'The link works for 1 hour. If it was not you, ignore this email.'],
      { label: 'Choose a new password', url }
    ),

  bookingReceived: (b) =>
    build(`Booking ${ref(b.booking_id)} received`, [
      `We received your booking request: ${stay(b)}.`,
      `Total: ${nu(b.total_amount)}. An admin will approve or reject it soon; we will email you.`,
    ]),

  bookingApproved: (b) =>
    build(`Booking ${ref(b.booking_id)} approved`, [
      `Your booking is approved: ${stay(b)}.`,
      `Total: ${nu(b.total_amount)}. Please pay at the guest house when you check in.`,
      ...(b.admin_note ? [`Note from the admin: ${b.admin_note}`] : []),
    ]),

  bookingRejected: (b) =>
    build(`Booking ${ref(b.booking_id)} rejected`, [
      `Sorry, your booking was rejected: ${stay(b)}.`,
      `Reason: ${b.admin_note}`,
    ]),

  bookingCancelled: (b) =>
    build(`Booking ${ref(b.booking_id)} cancelled`, [`Your booking was cancelled: ${stay(b)}.`, ...(b.admin_note ? [b.admin_note] : [])]),

  roomChanged: (b, reason) =>
    build(`Booking ${ref(b.booking_id)}: room changed`, [
      `Your room has been changed. New stay: ${stay(b)}.`,
      ...(reason ? [`Reason: ${reason}`] : []),
    ]),

  extensionReceived: (b, ext) =>
    build(`Booking ${ref(b.booking_id)}: request to stay longer received`, [
      `You asked to stay until ${ext.new_check_out} (now ${ext.current_check_out}).`,
      `Extra cost if approved: ${nu(ext.extra_amount)}. We will email you when an admin decides.`,
    ]),

  extensionApproved: (b, ext) =>
    build(`Booking ${ref(b.booking_id)}: longer stay approved`, [
      `You can now stay until ${ext.new_check_out}.`,
      `New total: ${nu(b.total_amount)}.`,
    ]),

  extensionRejected: (b, ext) =>
    build(`Booking ${ref(b.booking_id)}: longer stay not approved`, [
      `Your request to stay until ${ext.new_check_out} was not approved. Your stay still ends on ${ext.current_check_out}.`,
      ...(ext.admin_note ? [`Reason: ${ext.admin_note}`] : []),
    ]),

  hallReceived: (h) =>
    build(`Hall booking ${hallRef(h.hall_booking_id)} received`, [
      `We received your request for ${h.hall_name} on ${h.event_date}, ${h.start_time.slice(0, 5)}–${h.end_time.slice(0, 5)}.`,
      `Total: ${nu(h.total_amount)}. We will email you when an admin decides.`,
    ]),

  hallApproved: (h) =>
    build(`Hall booking ${hallRef(h.hall_booking_id)} approved`, [
      `${h.hall_name} is booked for you on ${h.event_date}, ${h.start_time.slice(0, 5)}–${h.end_time.slice(0, 5)}.`,
      `Total: ${nu(h.total_amount)}.`,
    ]),

  hallRejected: (h) =>
    build(`Hall booking ${hallRef(h.hall_booking_id)} rejected`, [
      `Sorry, your request for ${h.hall_name} on ${h.event_date} was rejected.`,
      `Reason: ${h.admin_note}`,
    ]),
};
