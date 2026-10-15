import { useId } from 'react';

// Shared wrapper: label, help text and red error message linked to the input.
export function useFieldIds(id) {
  const generated = useId();
  const inputId = id || generated;
  return { inputId, helpId: `${inputId}-help`, errorId: `${inputId}-error` };
}

export function describedBy({ helpId, errorId }, help, error) {
  return [help && helpId, error && errorId].filter(Boolean).join(' ') || undefined;
}

export default function Field({ label, inputId, helpId, errorId, help, error, required, children }) {
  return (
    <div className="ui-field">
      <label className="ui-label" htmlFor={inputId}>
        {label}
        {required && (
          <span className="ui-required" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {help && (
        <p className="ui-help" id={helpId}>
          {help}
        </p>
      )}
      {error && (
        <p className="ui-error" id={errorId} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
