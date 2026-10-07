import { Phone, X } from 'lucide-react';
import { StatusPill } from './ui';
import { statuses, money, formatDate } from './constants';

export default function DetailModal({ item, history = [], onClose, onStatus }) {
  if (item.customerView) {
    const c = item.customerView;
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={17} />
          </button>

          <div className="admin-kicker">Customer Profile</div>
          <h2>{c.name}</h2>
          <div className="muted">
            <Phone size={13} style={{ marginRight: 5 }} />
            {c.phone}
          </div>

          <div className="customer-detail-grid">
            <div>
              <span>Orders Placed</span>
              <strong>{c.orders}</strong>
            </div>
            <div>
              <span>Lifetime Value</span>
              <strong>{money(c.total)}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{c.email || '—'}</strong>
            </div>
            <div>
              <span>Last Order</span>
              <strong>{formatDate(c.lastOrder)}</strong>
            </div>
          </div>

          {c.address && (
            <div className="detail-box">
              <span>Delivery Address</span>
              <strong>{c.address}</strong>
            </div>
          )}

          {Array.isArray(c.allOrders) && c.allOrders.length > 0 && (
            <>
              <h3>Order History</h3>
              <div className="detail-items">
                {c.allOrders.map((ord, idx) => (
                  <div key={idx}>
                    <span>
                      {ord.order_number} ({formatDate(ord.date)})
                    </span>
                    <b>
                      {money(ord.total)} • {ord.status}
                    </b>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  const o = item;
  const relatedHistory = history
    .filter((x) => x.order_id === o.id)
    .sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));
  const c = o.customer || {};

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="detail-modal order-detail" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          <X size={17} />
        </button>

        <div className="order-detail-head">
          <div>
            <div className="admin-kicker">Order Details</div>
            <h2>{o.order_number}</h2>
            <p>
              {c.name || 'Customer'} •{' '}
              <a href={`tel:${o.phone}`} style={{ color: 'var(--a-brand)' }}>
                {o.phone}
              </a>
            </p>
          </div>
          <StatusPill status={o.status} />
        </div>

        <div className="detail-summary">
          <div>
            <span>Total Amount</span>
            <strong>{money(o.total)}</strong>
          </div>
          <div>
            <span>Payment Method</span>
            <strong>{o.payment_method === 'cod' ? 'Cash on Delivery' : o.payment_method}</strong>
          </div>
          <div>
            <span>Placed At</span>
            <strong>{formatDate(o.placed_at)}</strong>
          </div>
        </div>

        <div className="detail-box">
          <span>Delivery Information</span>
          <div>
            <strong>{c.name}</strong> • {o.phone}
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

        <h3>Ordered Items</h3>
        <div className="detail-items">
          {(o.items || []).map((x, i) => (
            <div key={i}>
              <span>
                {x.name} • {x.size} × {x.qty}
              </span>
              <b>{money(Number(x.price) * Number(x.qty))}</b>
            </div>
          ))}
        </div>

        <h3>Status Timeline</h3>
        <div className="timeline">
          {(relatedHistory.length
            ? relatedHistory
            : [{ status: o.status, changed_at: o.updated_at || o.placed_at }]
          ).map((x, i, arr) => (
            <div className="timeline-row" key={i}>
              <i className={i === arr.length - 1 ? 'current' : ''} />
              <div>
                <strong>{x.status}</strong>
                <small>{formatDate(x.changed_at)}</small>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-actions">
          <span>Change Status</span>
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
          <button type="button" className="btn btn-outline btn-sm" onClick={onClose} style={{ marginLeft: 'auto' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
