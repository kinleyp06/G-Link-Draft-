// columns: [{ key, header, render?(row) }], rows: array of objects.
// On small screens the table scrolls sideways inside its own box, never the page.
export default function Table({ columns, rows, rowKey = 'id', caption, emptyMessage = 'Nothing to show yet.' }) {
  return (
    <div className="ui-table-wrap" tabIndex={0} role="region" aria-label={caption || 'Table'}>
      <table className="ui-table">
        {caption && <caption>{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} scope="col">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="ui-table-empty" colSpan={columns.length}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={typeof rowKey === 'function' ? rowKey(row) : (row[rowKey] ?? i)}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
