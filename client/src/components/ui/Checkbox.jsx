import { useId } from 'react';

// A tick box with its label on the right. error shows in red underneath.
export default function Checkbox({ label, id, error, help, ...rest }) {
  const generated = useId();
  const inputId = id || generated;
  return (
    <div className="ui-field">
      <div className="ui-check">
        <input
          id={inputId}
          type="checkbox"
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? `${inputId}-error` : help ? `${inputId}-help` : undefined}
          {...rest}
        />
        <label htmlFor={inputId}>{label}</label>
      </div>
      {help && (
        <p className="ui-help" id={`${inputId}-help`}>
          {help}
        </p>
      )}
      {error && (
        <p className="ui-error" id={`${inputId}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
