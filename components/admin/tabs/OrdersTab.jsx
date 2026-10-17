import { useEffect, useState } from 'react';
import { ChevronDown, Download, Trash2 } from 'lucide-react';
import { EmptyState, SearchField, StatusPill } from '../ui';
import { statuses, money, formatDateTime, formatDate } from '../constants';

const DATE_RANGES = [
  ['all', 'All Time'],
  ['today', 'Today'],
  ['7d', 'Last 7 Days'],
  ['30d', 'Last 30 Days']
];

const PAGE_SIZE = 20;

function inDateRange(order, range) {
  if (range === 'all') return true;
  const placed = new Date(order.placed_at).getTime();
  if (Number.isNaN(placed)) return true;
  if (range === 'today') {
    return new Date(order.placed_at).toDateString() === new Date().toDateString();
  }
  const days = range === '7d' ? 7 : 30;
  return Date.now() - placed <= days * 86400000;
}

function paymentLabel(method) {
  if (!method) return '—';
  return method === 'cod' ? 'Cash on Delivery' : String(method);
}

export default function OrdersTab({
  orders,
  allOrdersCount,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  onStatus,
  onExport,
  history = [],
  password
}) {
  const [dateRange, setDateRange] = useState('all');
  const [openIds, setOpenIds] = useState(() => new Set());
  const [page, setPage] = useState(1);

  const rows = orders.filter((o) => inDateRange(o, dateRange));
  const filtered = Boolean(query) || statusFilter !== 'all' || dateRange !== 'all';
  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, dateRange]);

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount));
  }, [pageCount]);

  const start = (page - 1) * PAGE_SIZE;
  const view = rows.slice(start, start + PAGE_SIZE);

  function toggle(id) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function deleteOrder(o) {
    if (!window.confirm(`Delete order ${o.order_number}? This cannot be undone.`)) return;
    fetch('/api/admin/orders?id=' + encodeURIComponent(o.id), {
      method: 'DELETE',
      headers: { 'x-admin-password': password || '' }
    }).then(() => window.location.reload());
  }

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <div>
          <div className="admin-kicker">Orders Database</div>
          <h2>
            All Orders <em>({rows.length} of {allOrdersCount})</em>
          </h2>
          <p className="orders-hint">Click an order to expand its items, delivery info and timeline.</p>
        </div>

        <div className="admin-toolbar-right">
          <select
            className="filter"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            aria-label="Date range"
          >
            {DATE_RANGES.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>

          <select
            className="filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search order #, customer, phone…"
          />

          <button type="button" className="btn btn-outline" onClick={onExport} title="Download CSV for couriers">
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="table-card">
          <EmptyState
            text={
              filtered
                ? 'No matching orders found. Try clearing the search, status, or date filter.'
                : 'No orders in database yet.'
            }
          />
        </div>
      ) : (
        <>
          <div className="order-cards">
            {view.map((o) => {
              const c = o.customer || {};
              const items = o.items || [];
              const itemCount = items.reduce((s, x) => s + Number(x.qty || 1), 0);
              const open = openIds.has(o.id);
              const relatedHistory = history
                .filter((x) => x.order_id === o.id)
                .sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));
              const timelineRows = relatedHistory.length
                ? relatedHistory
                : [{ status: o.status, changed_at: o.updated_at || o.placed_at }];

              return (
                <article key={o.id} className={`order-card${open ? ' is-open' : ''}`}>
                  <button
                    type="button"
                    className="order-card-head"
                    onClick={() => toggle(o.id)}
                    aria-expanded={open}
                    aria-controls={`order-body-${o.id}`}
                  >
                    <span className="oc-cell oc-order">
                      <strong>{o.order_number}</strong>
                      <small>{formatDate(o.placed_at)}</small>
                    </span>
                    <span className="oc-cell oc-customer">
                      <strong>{c.name || 'Customer'}</strong>
                      <small>{o.phone}</small>
                    </span>
                    <span className="oc-cell oc-payment">
                      <strong>{paymentLabel(o.payment_method)}</strong>
                      <small>Payment</small>
                    </span>
                    <span className="oc-cell oc-items">
                      <strong>{itemCount}</strong>
                      <small>item{itemCount === 1 ? '' : 's'}</small>
                    </span>
                    <span className="oc-cell oc-total">
                      <strong>{money(o.total)}</strong>
                      <small>Total</small>
                    </span>
                    <span className="oc-cell oc-status">
                      <StatusPill status={o.status} />
                    </span>
                    <ChevronDown size={18} className="oc-chevron" aria-hidden="true" />
                  </button>

                  <div className="order-card-body" id={`order-body-${o.id}`}>
                    <div className="oc-inner">
                      <div className="oc-pad">
                        <div className="order-card-grid">
                          <div className="oc-section">
                            <h4>Ordered Items ({items.length})</h4>
                            <div className="detail-items">
                              {items.map((x, i) => {
                                const unit = Number(x.price) || 0;
                                const qty = Number(x.qty) || 1;
                                return (
                                  <div key={i}>
                                    <span className="order-line">
                                      {x.image ? (
                                        <img
                                          className="order-thumb"
                                          src={x.image}
                                          alt={x.name || 'Ordered product'}
                                        />
                                      ) : (
                                        <span className="order-thumb order-thumb-empty" aria-hidden="true">
                                          📦
                                        </span>
                                      )}
                                      <span>
                                        <strong className="order-line-name">{x.name}</strong>
                                        <small className="order-line-meta">
                                          {x.size} · ৳{unit.toLocaleString('en-BD')} × {qty}
                                        </small>
                                      </span>
                                    </span>
                                    <b>{money(unit * qty)}</b>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="oc-totals">
                              <div>
                                <span>Subtotal</span>
                                <b>{money(o.subtotal)}</b>
                              </div>
                              <div>
                                <span>Delivery Fee</span>
                                <b>{money(o.delivery_fee)}</b>
                              </div>
                              <div className="oc-total-row">
                                <span>Total</span>
                                <b>{money(o.total)}</b>
                              </div>
                            </div>
                          </div>

                          <div className="oc-section">
                            <h4>Delivery Information</h4>
                            <div className="detail-box" style={{ marginTop: 0 }}>
                              <div>
                                <strong>{c.name || 'Customer'}</strong> • {o.phone}
                                {c.email ? ` • ${c.email}` : ''}
                              </div>
                              <div style={{ color: 'var(--a-ink-2)' }}>
                                {c.address}
                                {c.area ? `, ${c.area}` : ''}
                                {c.district ? `, ${c.district}` : ''}
                                {c.division ? `, ${c.division}` : ''}
                              </div>
                              {c.notes && <div className="note">Customer Note: {c.notes}</div>}
                            </div>

                            <h4>Status Timeline</h4>
                            <div className="timeline">
                              {timelineRows.map((x, i) => (
                                <div className="timeline-row" key={i}>
                                  <i className={i === timelineRows.length - 1 ? 'current' : ''} />
                                  <div>
                                    <strong>{x.status}</strong>
                                    <small>{formatDate(x.changed_at)}</small>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="oc-actions">
                          <span>Update Status</span>
                          <select
                            className="status-select"
                            value={o.status}
                            onChange={(e) => onStatus(o.id, e.target.value)}
                          >
                            {statuses.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                            {!statuses.includes(o.status) && (
                              <option value={o.status || ''}>{o.status || 'Unknown'}</option>
                            )}
                          </select>

                          <button
                            type="button"
                            className="btn btn-outline btn-sm danger oc-delete"
                            onClick={() => deleteOrder(o)}
                            title="Delete Order"
                          >
                            <Trash2 size={14} /> Delete Order
                          </button>

                          <span className="oc-ref">Placed {formatDateTime(o.placed_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {pageCount > 1 && (
            <div className="orders-foot">
              <span>
                {rows.length.toLocaleString()} orders · page {page} / {pageCount}
              </span>
              <span className="pager">
                <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Prev
                </button>
                <button type="button" disabled={page >= pageCount} onClick={() => setPage(page + 1)}>
                  Next
                </button>
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
