// Coloured message box: type = info | success | warning | danger
export default function Notice({ type = 'info', title, children }) {
  return (
    <div className={`notice notice--${type}`} role={type === 'danger' ? 'alert' : undefined}>
      {title && <strong className="notice__title">{title}</strong>}
      {children}
    </div>
  );
}
