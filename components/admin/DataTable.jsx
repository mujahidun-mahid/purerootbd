import { useEffect, useState } from 'react';
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
  footer,
  rowProps,
  pageSize = 0,
  loading = false
}) {
  const [page, setPage] = useState(1);
  const pageCount = pageSize > 0 ? Math.max(1, Math.ceil(rows.length / pageSize)) : 1;

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount));
  }, [pageCount]);

  const view = pageSize > 0 ? rows.slice((page - 1) * pageSize, page * pageSize) : rows;
  const keyOf = (row, i) => rowKey ? rowKey(row, i) : (row.id ?? row.key ?? (page - 1) * (pageSize || 0) + i);

  const cellStyle = (col) => (col.align ? { textAlign: col.align } : undefined);

  const pager = pageCount > 1 && (
    <>
      <span className="muted">
        {rows.length.toLocaleString()} rows · page {page} / {pageCount}
      </span>
      <span className="pager">
        <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          Prev
        </button>
        <button type="button" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>
          Next
        </button>
      </span>
    </>
  );

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
            {loading
              ? Array.from({ length: Math.min(pageSize || 6, 8) }).map((_, i) => (
                  <tr key={`sk-${i}`} className="skeleton-row" aria-hidden="true">
                    {columns.map((col) => (
                      <td key={col.key}>
                        <span className="skeleton" />
                      </td>
                    ))}
                  </tr>
                ))
              : view.map((row, i) => {
                  const { className: extraClass, ...rest } = rowProps ? rowProps(row, i) : {};
                  return (
                    <tr
                      key={keyOf(row, i)}
                      className={[(onRowClick ? 'clickable' : ''), extraClass].filter(Boolean).join(' ') || undefined}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      {...rest}
                    >
                      {columns.map((col) => (
                        <td key={col.key} className={col.className || undefined} style={cellStyle(col)}>
                          {col.render ? col.render(row, i) : row[col.key]}
                        </td>
                      ))}
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>

      {!loading && !rows.length && (
        <EmptyState
          icon={emptyIcon}
          text={filtered && emptyFilteredText ? emptyFilteredText : emptyText}
        />
      )}

      {!loading && (pager || footer) && rows.length > 0 && (
        <div className="table-foot">
          {pager}
          {footer}
        </div>
      )}
    </div>
  );
}
