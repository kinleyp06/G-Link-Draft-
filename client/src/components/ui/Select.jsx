import Field, { useFieldIds, describedBy } from './Field.jsx';

// options: [{ value, label }] or plain strings
export default function Select({ label, id, help, error, required, options = [], placeholder, ...rest }) {
  const ids = useFieldIds(id);
  return (
    <Field label={label} {...ids} help={help} error={error} required={required}>
      <select
        id={ids.inputId}
        className="ui-select"
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy(ids, help, error)}
        {...rest}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const { value, label: text } = typeof opt === 'string' ? { value: opt, label: opt } : opt;
          return (
            <option key={value} value={value}>
              {text}
            </option>
          );
        })}
      </select>
    </Field>
  );
}
