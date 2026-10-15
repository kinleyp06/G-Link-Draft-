import { useState } from 'react';
import Field, { useFieldIds, describedBy } from './Field.jsx';

export default function PasswordInput({ label = 'Password', id, help, error, required, ...rest }) {
  const ids = useFieldIds(id);
  const [visible, setVisible] = useState(false);
  return (
    <Field label={label} {...ids} help={help} error={error} required={required}>
      <div className="ui-password">
        <input
          id={ids.inputId}
          type={visible ? 'text' : 'password'}
          className="ui-input"
          required={required}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={describedBy(ids, help, error)}
          {...rest}
        />
        <button
          type="button"
          className="ui-btn ui-btn--secondary"
          onClick={() => setVisible((v) => !v)}
          aria-controls={ids.inputId}
          aria-pressed={visible}
        >
          {visible ? 'Hide' : 'Show'}
          <span className="visually-hidden"> password</span>
        </button>
      </div>
    </Field>
  );
}
