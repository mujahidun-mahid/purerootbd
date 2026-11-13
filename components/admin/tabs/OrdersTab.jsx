'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronRight,
  Download,
  CreditCard,
  Clock,
  Trash2,
  X
} from 'lucide-react';
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

function fullAddress(c) {
  return [c.address, c.area, c.district, c.division].filter(Boolean).join(', ');
}

function paymentIcon(method) {
  if (!method) return <CreditCard size={14} />;
  return <CreditCard size={14} />;
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
  history = []
}) {
  const [dateRange, setDateRange] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

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

  const selectedOrder = view.find((o) => o.id === selectedOrderId) ||
    (selectedOrderId ? rows.find((o) => o.id === selectedOrderId) : null);

  function getCsrfTokenFromCookie() {
    if (typeof document === 'undefined') return '';
    const match = document.cookie.match(/(?:^|; )csrf_token=([^;]+)/);
    return match ? match[1] : '';
  }

  function deleteOrder(o) {
    if (!window.confirm(`Delete order ${o.order_number}? This cannot be undone.`)) return;
    const csrf = getCsrfTokenFromCookie();
    const headers = { 'content-type': 'application/json' };
    if (csrf) headers['X-CSRF-Token'] = csrf;
    fetch('/api/admin/orders?id=' + encodeURIComponent(o.id), {
      method: 'DELETE',
      headers
    }).then(() => {
      setSelectedOrderId(null);
      window.location.reload();
    });
  }

  function handleStatusChange(id, newStatus) {
    onStatus(id, newStatus);
  }

  const hasFilters = Boolean(query) || statusFilter !== 'all' || dateRange !== 'all';
  const isEmpty = rows.length === 0;

  return (
    <div className="orders-page">
      {/* ============================================================
         HEADER TOOLBAR
         ============================================================ */}
      <div className="orders-toolbar">
        <div className="orders-toolbar-left">
          <div className="orders-kicker">Orders Database</div>
          <h1 className="orders-title">
            Orders <span className="orders-count">({rows.length} of {allOrdersCount})</span>
          </h1>
          {hasFilters && (
            <p className="orders-hint">
              {view.length} order{view.length !== 1 ? 's' : ''} matching current filters
            </p>
          )}
        </div>

        <div className="orders-toolbar-right">
          <select
            className="orders-filter"
            value={dateRange}
            onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
            aria-label="Date range"
          >
            {DATE_RANGES.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>

          <select
            className="orders-filter"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            aria-label="Status filter"
          >
            <option value="all">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search order #, customer, phone…"
            className="orders-search"
          />

          <button
            type="button"
            className="btn btn-outline"
            onClick={onExport}
            title="Download CSV for couriers"
          >
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* ============================================================
         EMPTY STATE
         ============================================================ */}
      {isEmpty && (
        <div className="orders-empty">
          <EmptyState
            text={
              hasFilters
                ? 'No matching orders found. Try clearing the search, status, or date filter.'
                : 'No orders in database yet.'
            }
          />
        </div>
      )}

      {/* ============================================================
         ORDER LIST + DETAIL PANEL
         ============================================================ */}
      {!isEmpty && (
        <div className="orders-body">
          {/* Orders List */}
          <div className="orders-list-wrap">
            <ul className="orders-list">
              {view.map((o) => {
                const c = o.customer || {};
                const items = o.items || [];
                const itemCount = items.reduce((s, x) => s + Number(x.qty || 1), 0);
                const isSelected = selectedOrderId === o.id;
                const firstItem = items[0];
                const mainImage = firstItem?.image || '';
                const mainName = firstItem?.name || 'No items';

                return (
                  <li key={o.id} className={`orders-row ${isSelected ? 'is-selected' : ''}`}>
                    <button
                      type="button"
                      className="orders-row-head"
                      onClick={() => setSelectedOrderId(o.id)}
                    >
                      <div className="orders-thumb">
                        {mainImage ? (
                          <img src={mainImage} alt={mainName} />
                        ) : (
                          <span className="orders-thumb-empty">📦</span>
                        )}
                      </div>
                      <div className="orders-order-col">
                        <div className="orders-order-number">{o.order_number}</div>
                        <div className="orders-order-date">{formatDateTime(o.placed_at)}</div>
                      </div>
                      <div className="orders-customer-col">
                        <div className="orders-customer-name">{c.name || 'Customer'}</div>
                        <div className="orders-customer-phone">{o.phone}</div>
                      </div>
                      <div className="orders-product-col">
                        <div className="orders-product-name">{mainName}</div>
                        {items.length > 1 && (
                          <div className="orders-product-more">+{items.length - 1} more</div>
                        )}
                        <div className="orders-product-qty">
                          {itemCount} item{itemCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="orders-payment-col">
                        <div className="orders-payment-badge">
                          <span className="orders-payment-icon">
                            <CreditCard size={12} />
                          </span>
                          {paymentLabel(o.payment_method)}
                        </div>
                      </div>
                      <div className="orders-total-col">
                        <div className="orders-total-value">{money(o.total)}</div>
                      </div>
                      <div className="orders-status-col">
                        <StatusPill status={o.status} />
                      </div>
                      <div className="orders-action-col">
                        <button
                          type="button"
                          className="orders-view-btn"
                          onClick={(e) => { e.stopPropagation(); setSelectedOrderId(o.id); }}
                          aria-label={`View order ${o.order_number}`}
                        >
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right-Side Detail Panel */}
          <div className="orders-detail-panel-wrap">
            {selectedOrder ? (
              <OrderDetailPanel
                order={selectedOrder}
                history={history}
                onStatus={handleStatusChange}
                onClose={() => setSelectedOrderId(null)}
                onDelete={() => {
                  deleteOrder(selectedOrder);
                  setSelectedOrderId(null);
                }}
              />
            ) : (
              <div className="orders-detail-empty">
                <div className="orders-detail-empty-icon">
                  <Clock size={24} />
                </div>
                <h3 className="orders-detail-empty-title">Select an order</h3>
                <p className="orders-detail-empty-desc">
                  Click an order in the list to view its details, items, delivery address, and timeline.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   ORDER DETAIL PANEL COMPONENT
   Shared between desktop side panel and mobile drawer overlay
   ============================================================ */

function OrderDetailPanel({ order, history, onStatus, onClose, onDelete }) {
  const c = order.customer || {};
  const items = order.items || [];
  const itemCount = items.reduce((s, x) => s + Number(x.qty || 1), 0);
  const relatedHistory = history
    .filter((x) => x.order_id === order.id)
    .sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));
  const timelineRows = relatedHistory.length
    ? relatedHistory
    : [{ status: order.status, changed_at: order.updated_at || order.placed_at }];

  return (
    <div className="orders-detail-panel">
      <div className="orders-detail-panel-header">
        <button
          type="button"
          className="orders-detail-panel-close"
          onClick={onClose}
          aria-label="Close order details"
        >
          <X size={16} />
        </button>
        <div className="orders-detail-panel-head">
          <div className="orders-detail-panel-kicker">Order Details</div>
          <h2>{order.order_number}</h2>
          <div className="orders-detail-panel-meta">
            <StatusPill status={order.status} className="orders-detail-panel-status" />
            <span className="orders-detail-panel-date">{formatDateTime(order.placed_at)}</span>
          </div>
        </div>
      </div>

      <div className="orders-detail-panel-scroll">
        <div className="orders-detail-panel-body">

          {/* Order Summary */}
          <div className="orders-detail-section">
            <div className="orders-detail-section-head">
              <span className="orders-detail-section-label">Order Summary</span>
            </div>
            <div className="orders-detail-grid">
              <div className="orders-detail-item">
                <span className="orders-detail-item-label">Order Date</span>
                <span className="orders-detail-item-value">{formatDate(order.placed_at)}</span>
              </div>
              <div className="orders-detail-item">
                <span className="orders-detail-item-label">Payment Method</span>
                <span className="orders-detail-item-value">
                  {order.payment_method === 'cod' ? 'Cash on Delivery' : order.payment_method}
                </span>
              </div>
              <div className="orders-detail-item">
                <span className="orders-detail-item-label">Items</span>
                <span className="orders-detail-item-value">
                  {itemCount} item{itemCount !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="orders-detail-item">
                <span className="orders-detail-item-label">Order Total</span>
                <span className="orders-detail-item-value orders-detail-item-total">
                  {money(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="orders-detail-section">
            <div className="orders-detail-section-head">
              <span className="orders-detail-section-label">Customer Information</span>
            </div>
            <div className="orders-detail-grid">
              <div className="orders-detail-item orders-detail-item-full">
                <span className="orders-detail-item-label">Name</span>
                <span className="orders-detail-item-value orders-detail-item-value-bold">
                  {c.name || 'Customer'}
                </span>
              </div>
              <div className="orders-detail-item orders-detail-item-full">
                <span className="orders-detail-item-label">Phone</span>
                <span className="orders-detail-item-value">
                  <a href={`tel:${order.phone}`} className="orders-detail-item-link">
                    {order.phone}
                  </a>
                </span>
              </div>
              {c.email && (
                <div className="orders-detail-item orders-detail-item-full">
                  <span className="orders-detail-item-label">Email</span>
                  <span className="orders-detail-item-value">
                    <a href={`mailto:${c.email}`} className="orders-detail-item-link">
                      {c.email}
                    </a>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="orders-detail-section">
            <div className="orders-detail-section-head">
              <span className="orders-detail-section-label">Delivery Address</span>
            </div>
            <div className="orders-detail-address">
              <div className="orders-detail-address-lines">
                <span className="orders-detail-address-name">{c.name || 'Customer'}</span>
                <span className="orders-detail-address-phone">{order.phone}</span>
                {c.email && <span className="orders-detail-address-email">{c.email}</span>}
                <div className="orders-detail-address-street">{fullAddress(c)}</div>
                {c.notes && (
                  <div className="orders-detail-address-note">
                    <span className="orders-detail-address-note-label">Customer Note:</span>
                    <span>{c.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Ordered Items */}
          <div className="orders-detail-section">
            <div className="orders-detail-section-head">
              <span className="orders-detail-section-label">
                Ordered Items ({items.length})
              </span>
            </div>
            <div className="orders-detail-items-list">
              {items.map((x, i) => {
                const unit = Number(x.price) || 0;
                const qty = Number(x.qty) || 1;
                return (
                  <div key={i} className="orders-detail-item-row">
                    <div className="orders-detail-item-thumb">
                      {x.image ? (
                        <img src={x.image} alt={x.name || 'Ordered product'} />
                      ) : (
                        <span className="orders-detail-item-thumb-empty">📦</span>
                      )}
                    </div>
                    <div className="orders-detail-item-info">
                      <div className="orders-detail-item-name">{x.name}</div>
                      <div className="orders-detail-item-meta">
                        {x.size} · ৳{unit.toLocaleString('en-BD')} × {qty}
                      </div>
                    </div>
                    <div className="orders-detail-item-price">{money(unit * qty)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status & Timeline */}
          <div className="orders-detail-section">
            <div className="orders-detail-section-head">
              <span className="orders-detail-section-label">Status &amp; Timeline</span>
            </div>
            <div className="orders-detail-status-select">
              <span className="orders-detail-status-label">Update Status</span>
              <select
                className="orders-detail-status-select-input"
                value={order.status}
                onChange={(e) => onStatus(order.id, e.target.value)}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
                {!statuses.includes(order.status) && (
                  <option value={order.status || ''}>{order.status || 'Unknown'}</option>
                )}
              </select>
            </div>
            <div className="orders-detail-timeline">
              {timelineRows.map((x, i) => (
                <div key={i} className="orders-detail-timeline-row">
                  <div className="orders-detail-timeline-dot">
                    <span
                      className={
                        i === timelineRows.length - 1
                          ? 'orders-detail-timeline-dot-current'
                          : ''
                      }
                    />
                  </div>
                  <div className="orders-detail-timeline-content">
                    <div className="orders-detail-timeline-status">{x.status}</div>
                    <div className="orders-detail-timeline-date">
                      {formatDate(x.changed_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="orders-detail-actions">
            <button
              type="button"
              className="btn btn-outline btn-sm orders-detail-delete-btn"
              onClick={onDelete}
            >
              <Trash2 size={14} /> Delete Order
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}