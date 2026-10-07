import Field, { useFieldIds, describedBy } from './Field.jsx';

export default function Textarea({ label, id, help, error, required, rows = 3, ...rest }) {
  const ids = useFieldIds(id);
  return (
    <Field label={label} {...ids} help={help} error={error} required={required}>
      <textarea
        id={ids.inputId}
        className="ui-input ui-textarea"
        rows={rows}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy(ids, help, error)}
        {...rest}
      />
    </Field>
  );
}
