// Variants: primary (main action), secondary, danger (delete / reject).
export default function Button({
  variant = 'primary',
  size,
  block = false,
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  const classes = [
    'ui-btn',
    `ui-btn--${variant}`,
    size === 'small' && 'ui-btn--small',
    block && 'ui-btn--block',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...rest}>
      {loading && <span className="ui-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
