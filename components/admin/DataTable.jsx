import { EmptyState } from './ui';

export default function DataTable({
  columns = [],
  rows = [],
  rowKey,
  onRowClick,
  emptyText = 'No records yet.',
  emptyFilteredText,
  filtered = false,
  emptyIcon,
  compact = false,
  minWidth,
  footer
}) {
  const keyOf = (row, i) =>
    rowKey ? rowKey(row, i) : (row.id ?? row.key ?? i);

  const cellStyle = (col) => (col.align ? { textAlign: col.align } : undefined);

  return (
    <div className={`table-card${compact ? ' is-compact' : ''}`}>
      <div className="table-scroll">
        <table style={minWidth ? { minWidth } : undefined}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={col.headerClassName || undefined}
                  style={cellStyle(col)}
                  aria-label={col.header || undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={keyOf(row, i)}
                className={onRowClick ? 'clickable' : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={col.className || undefined}
                    style={cellStyle(col)}
                  >
                    {col.render ? col.render(row, i) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!rows.length && (
        <EmptyState
          icon={emptyIcon}
          text={filtered && emptyFilteredText ? emptyFilteredText : emptyText}
        />
      )}

      {footer && rows.length > 0 && <div className="table-foot">{footer}</div>}
    </div>
  );
}
