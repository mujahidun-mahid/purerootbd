import { useState } from 'react';
import { Plus, Pencil, Trash2, Ticket, Percent, TicketCheck } from 'lucide-react';
import { Alert, EmptyState, ModalShell, Field, StatCard, Toggle } from '../ui';
import DataTable from '../DataTable';
import { money, formatDate } from '../constants';
import { useLocalCollection } from '../useLocalData';
import { seedCoupons } from '../mockData';

const blank = {
  code: '',
  type: 'percent',
  value: 10,
  minSpend: 500,
  limit: 100,
  used: 0,
  active: true,
  expires: ''
};

export default function PromotionsTab() {
  const { items: coupons, save, remove } = useLocalCollection('coupons', seedCoupons);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  const active = coupons.filter((c) => c.active);
  const redemptions = coupons.reduce((s, c) => s + Number(c.used || 0), 0);
  const usageCap = coupons.reduce((s, c) => s + Number(c.limit || 0), 0);

  function openNew() {
    setError('');
    setNotice('');
    setEditing({ ...blank });
  }

  function openEdit(coupon) {
    setError('');
    setNotice('');
    setEditing({ ...coupon });
  }

  function saveCoupon() {
    const code = String(editing.code || '').trim().toUpperCase();
    if (!code) return setError('Coupon code is required.');
    if (Number(editing.value) < 0) return setError('Value cannot be negative.');
    save({ ...editing, code });
    setNotice(`Coupon ${code} saved.`);
    setEditing(null);
  }

  function deleteCoupon(coupon) {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;
    remove(coupon.id);
    setNotice(`Coupon ${coupon.code} deleted.`);
  }

  const typeLabel = (c) =>
    c.type === 'percent'
      ? `${c.value}% off`
      : c.type === 'flat'
        ? `${money(c.value)} off`
        : 'Free delivery';

  const columns = [
    {
      key: 'code',
      header: 'Code',
      render: (c) => (
        <>
          <strong>{c.code}</strong>
          <small>{typeLabel(c)}</small>
        </>
      )
    },
    { key: 'minSpend', header: 'Min Spend', render: (c) => money(c.minSpend) },
    {
      key: 'usage',
      header: 'Usage',
      render: (c) => (
        <span>
          {c.used}/{c.limit}
        </span>
      )
    },
    { key: 'expires', header: 'Expires', render: (c) => (c.expires ? formatDate(c.expires) : '—') },
    {
      key: 'active',
      header: 'Status',
      render: (c) => <span className={`pill ${c.active ? 'pill-on' : 'pill-off'}`}>{c.active ? 'Live' : 'Paused'}</span>
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (c) => (
        <span className="row-actions">
          <button type="button" className="btn btn-sm" onClick={() => openEdit(c)}>
            <Pencil size={13} /> Edit
          </button>
          <button type="button" className="btn btn-sm danger" onClick={() => deleteCoupon(c)}>
            <Trash2 size={13} /> Delete
          </button>
        </span>
      )
    }
  ];

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <div>
          <div className="admin-kicker">Marketing</div>
          <h2>
            Promotions <em>({active.length} live)</em>
          </h2>
        </div>
        <div className="admin-toolbar-right">
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <Plus size={15} /> Add Coupon
          </button>
        </div>
      </div>

      {notice && <Alert onClose={() => setNotice('')}>{notice}</Alert>}

      <div className="kpi-row">
        <StatCard label="Live Coupons" value={active.length} sub="Accepting redemptions" icon={TicketCheck} tone="green" />
        <StatCard
          label="Total Redemptions"
          value={redemptions.toLocaleString()}
          sub="All-time uses"
          icon={Percent}
        />
        <StatCard
          label="Usage Capacity"
          value={usageCap ? Math.round((redemptions / usageCap) * 100) + '%' : '—'}
          sub="Of combined limits"
          icon={Ticket}
          tone="gold"
        />
        <StatCard label="Coupon Codes" value={coupons.length} sub="Total configured" icon={Ticket} />
      </div>

      <DataTable
        columns={columns}
        rows={coupons}
        rowKey={(c) => c.id}
        emptyText="No coupons yet — create your first promotion."
        emptyIcon={Ticket}
      />

      {editing && (
        <ModalShell
          kicker="Coupon Editor"
          title={editing.code ? `Edit ${editing.code}` : 'New Coupon'}
          onClose={() => setEditing(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveCoupon}>
                Save Coupon
              </button>
            </>
          }
        >
          {error && (
            <div className="full">
              <Alert type="error" onClose={() => setError('')}>
                {error}
              </Alert>
            </div>
          )}
          <Field label="Coupon Code">
            <input
              className="input"
              value={editing.code}
              placeholder="e.g. WELCOME10"
              onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Discount Type">
            <select
              className="input"
              value={editing.type}
              onChange={(e) => setEditing({ ...editing, type: e.target.value })}
            >
              <option value="percent">Percentage (%)</option>
              <option value="flat">Flat amount (৳)</option>
              <option value="free-delivery">Free delivery</option>
            </select>
          </Field>
          <Field label={editing.type === 'percent' ? 'Percent Off' : 'Value (৳)'}>
            <input
              className="input"
              type="number"
              min="0"
              value={editing.value}
              disabled={editing.type === 'free-delivery'}
              onChange={(e) => setEditing({ ...editing, value: Number(e.target.value) })}
            />
          </Field>
          <Field label="Minimum Spend (৳)">
            <input
              className="input"
              type="number"
              min="0"
              value={editing.minSpend}
              onChange={(e) => setEditing({ ...editing, minSpend: Number(e.target.value) })}
            />
          </Field>
          <Field label="Usage Limit">
            <input
              className="input"
              type="number"
              min="1"
              value={editing.limit}
              onChange={(e) => setEditing({ ...editing, limit: Number(e.target.value) })}
            />
          </Field>
          <Field label="Expiry Date">
            <input
              className="input"
              type="date"
              value={editing.expires || ''}
              onChange={(e) => setEditing({ ...editing, expires: e.target.value })}
            />
          </Field>
          <div className="full">
            <label className="editor-toggle">
              <Toggle checked={editing.active} onChange={(v) => setEditing({ ...editing, active: v })} label="Coupon active" />
              Coupon is live on the storefront
            </label>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
