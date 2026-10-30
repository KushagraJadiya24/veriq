const MAX_ROWS = 500;

function cell(v) {
  if (v === null || v === undefined) return <span className="cell-null">null</span>;
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

export default function DataTable({ rows }) {
  if (!rows || rows.length === 0) {
    return <p className="empty-note">The query ran and returned no rows.</p>;
  }
  const columns = Object.keys(rows[0]);
  const numeric = columns.map((c) =>
    rows.every((r) => r[c] === null || typeof r[c] === "number")
  );
  const shown = rows.slice(0, MAX_ROWS);

  return (
    <div className="table-wrap" tabIndex={0} role="region" aria-label="Query results">
      <table className="table">
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={c} className={numeric[i] ? "num" : undefined}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((r, ri) => (
            <tr key={ri}>
              {columns.map((c, i) => (
                <td key={c} className={numeric[i] ? "num" : undefined}>
                  {cell(r[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {rows.length > MAX_ROWS && (
        <p className="table__note">
          Showing the first {MAX_ROWS} of {rows.length} rows.
        </p>
      )}
    </div>
  );
}
