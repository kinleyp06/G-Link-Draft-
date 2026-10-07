import { useEffect, useId, useRef } from 'react';

// Closes with Escape, a click on the dark backdrop, or the X button.
export default function Modal({ open, title, onClose, children, footer }) {
  const titleId = useId();
  const dialogRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement;
    dialogRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="ui-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className="ui-modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={dialogRef} tabIndex={-1}>
        <div className="ui-modal__header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="ui-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="ui-modal__body">{children}</div>
        {footer && <div className="ui-modal__footer">{footer}</div>}
      </div>
    </div>
  );
}
