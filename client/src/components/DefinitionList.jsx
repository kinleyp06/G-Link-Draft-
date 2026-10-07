// Label / value pairs for detail cards. items: [[label, value], ...]
export default function DefinitionList({ items }) {
  return (
    <dl className="dl">
      {items
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([label, value]) => (
          <div key={label} className="dl__row">
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
    </dl>
  );
}
