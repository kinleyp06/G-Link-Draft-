// Booking status pill: Pending, Approved, Rejected, Cancelled, Completed.
export default function StatusBadge({ status }) {
  const key = String(status || '').toLowerCase();
  return <span className={`ui-badge ui-badge--${key}`}>{status}</span>;
}
