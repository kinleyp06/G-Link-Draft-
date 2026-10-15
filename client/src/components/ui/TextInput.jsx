import Field, { useFieldIds, describedBy } from './Field.jsx';

export default function TextInput({ label, id, help, error, required, type = 'text', className = '', ...rest }) {
  const ids = useFieldIds(id);
  return (
    <Field label={label} {...ids} help={help} error={error} required={required}>
      <input
        id={ids.inputId}
        type={type}
        className={`ui-input ${className}`.trim()}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy(ids, help, error)}
        {...rest}
      />
    </Field>
  );
}
