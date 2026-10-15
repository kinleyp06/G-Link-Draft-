export default function Loading({ label = 'Loading…' }) {
  return (
    <div className="page-state" role="status">
      <span className="ui-spinner" aria-hidden="true" /> {label}
    </div>
  );
}
