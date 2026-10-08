import { useState } from 'react';
import { RotateCcw, Banknote, Inbox, Plus, Check, X, Trash2 } from 'lucide-react';
import { SegTabs, StatCard, Alert, EmptyState, ModalShell, Field } from '../ui';
import DataTable from '../DataTable';
import { money, formatDate, formatDateTime } from '../constants';
import { useLocalCollection } from '../useLocalData';
import { seedReturns } from '../mockData';

const PENDING_STATUSES = ['Requested', 'Approved'];

export default function ReturnsTab({ password, orders = [], onStatus }) {
  const { items: refunds, save, patch, remove } = useLocalCollection('returns', seedReturns);
  const [view, setView] = useState('refunds');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  const cancelled = orders.filter((o) => o.status === 'Cancelled');
  const pending = refunds.filter((r) => PENDING_STATUSES.includes(r.status)).length;
  const refundedTotal = refunds
    .filter((r) => r.status === 'Refunded')
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);

  function openRefund(order) {
    setError('');
    setEditing(
      order
        ? {
            order: order.order_number || '',
            customer: order.customer?.name || '',
            amount: Number(order.total || 0),
            reason: ''
          }
        : { order: '', customer: '', amount: 0, reason: '' }
    );
  }

  function saveRefund() {
    const order = String(editing.order || '').trim();
    if (!order) return setError('Order number is required.');
    save({
      order,
      customer: editing.customer,
      amount: Number(editing.amount || 0),
      reason: editing.reason,
      status: 'Requested',
      created_at: new Date().toISOString()
    });
    setNotice(`Refund request created for ${order}`);
    setEditing(null);
    setView('refunds');
  }

  function decide(record, status) {
    if (!window.confirm(`Mark ${record.order} as ${status.toLowerCase()}?`)) return;
    patch(record.id, { status });
    setNotice(`Refund ${record.order} marked ${status.toLowerCase()}.`);
  }

  function deleteRefund(record) {
    if (!window.confirm(`Delete refund record for ${record.order}?`)) return;
    remove(record.id);
    setNotice(`Refund record for ${record.order} deleted.`);
  }

  const refundColumns = [
    { key: 'order', header: 'Order', render: (r) => <strong>{r.order}</strong> },
    { key: 'customer', header: 'Customer', render: (r) => r.customer || '—' },
    { key: 'reason', header: 'Reason', render: (r) => r.reason || '—' },
    { key: 'amount', header: 'Amount', render: (r) => money(r.amount) },
    { key: 'created_at', header: 'Created', render: (r) => formatDate(r.created_at) },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <span className={`pill ${r.status === 'Refunded' || r.status === 'Approved' ? 'pill-on' : 'pill-off'}`}>
          {r.status}
        </span>
      )
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <span className="row-actions">
          {r.status === 'Requested' && (
            <button type="button" className="btn btn-sm" onClick={() => decide(r, 'Approved')}>
              <Check size={13} /> Approve
            </button>
          )}
          {r.status === 'Approved' && (
            <button type="button" className="btn btn-primary btn-sm" onClick={() => decide(r, 'Refunded')}>
              <Banknote size={13} /> Mark Refunded
            </button>
          )}
          {r.status !== 'Refunded' && r.status !== 'Rejected' && (
            <button type="button" className="btn btn-sm danger" onClick={() => decide(r, 'Rejected')}>
              <X size={13} /> Reject
            </button>
          )}
          <button type="button" className="btn btn-sm danger" onClick={() => deleteRefund(r)}>
            <Trash2 size={13} /> Delete
          </button>
        </span>
      )
    }
  ];

  const cancelledColumns = [
    { key: 'order_number', header: 'Order #', render: (o) => <strong>{o.order_number}</strong> },
    {
      key: 'customer',
      header: 'Customer',
      render: (o) => (
        <>
          <strong>{o.customer?.name || 'Customer'}</strong>
          <small>{o.phone || o.customer?.phone || '—'}</small>
        </>
      )
    },
    { key: 'total', header: 'Total', render: (o) => money(o.total) },
    { key: 'placed_at', header: 'Placed', render: (o) => formatDateTime(o.placed_at) },
    {
      key: 'payment_method',
      header: 'Payment',
      render: (o) => (o.payment_method === 'cod' ? 'Cash on Delivery' : o.payment_method || '—')
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (o) => (
        <button type="button" className="btn btn-sm" onClick={() => openRefund(o)}>
          <RotateCcw size={13} /> Initiate Refund
        </button>
      )
    }
  ];

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <div>
          <div className="admin-kicker">Returns Desk</div>
          <h2>
            Refunds &amp; Cancellations <em>({refunds.length} on file)</em>
          </h2>
        </div>
        <div className="admin-toolbar-right">
          <button type="button" className="btn btn-primary" onClick={() => openRefund(null)}>
            <Plus size={15} /> New Refund Request
          </button>
        </div>
      </div>

      {notice && <Alert onClose={() => setNotice('')}>{notice}</Alert>}

      <SegTabs
        items={[
          { id: 'refunds', label: 'Refunds', count: refunds.length },
          { id: 'cancelled', label: 'Cancelled Orders', count: cancelled.length }
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'refunds' ? (
        <>
          <div className="kpi-row">
            <StatCard label="Refund Records" value={refunds.length} sub="All requests" icon={RotateCcw} />
            <StatCard
              label="Refunded Amount"
              value={money(refundedTotal)}
              sub="Settled to customers"
              icon={Banknote}
              tone="green"
            />
            <StatCard label="Pending Action" value={pending} sub="Requested or approved" icon={Inbox} tone="gold" />
          </div>

          {refunds.length === 0 ? (
            <EmptyState text="No refund records yet." icon={Inbox} />
          ) : (
            <DataTable
              columns={refundColumns}
              rows={refunds}
              rowKey={(r) => r.id}
              emptyText="No refund records yet."
              emptyIcon={Inbox}
            />
          )}
        </>
      ) : (
        <DataTable
          columns={cancelledColumns}
          rows={cancelled}
          rowKey={(o) => o.id}
          emptyText="No cancelled orders to refund."
          emptyIcon={Inbox}
        />
      )}

      {editing && (
        <ModalShell
          kicker="Refund Request"
          title={editing.order ? `Refund ${editing.order}` : 'New Refund Request'}
          onClose={() => setEditing(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveRefund}>
                Create Request
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
          <Field label="Order Number">
            <input
              className="input"
              value={editing.order}
              placeholder="e.g. PR-105"
              onChange={(e) => setEditing({ ...editing, order: e.target.value })}
            />
          </Field>
          <Field label="Customer">
            <input
              className="input"
              value={editing.customer}
              placeholder="Customer name"
              onChange={(e) => setEditing({ ...editing, customer: e.target.value })}
            />
          </Field>
          <Field label="Amount (৳)">
            <input
              className="input"
              type="number"
              min="0"
              value={editing.amount}
              onChange={(e) => setEditing({ ...editing, amount: Number(e.target.value) })}
            />
          </Field>
          <Field label="Reason" hint="full">
            <textarea
              className="input textarea"
              rows="3"
              value={editing.reason}
              placeholder="Why is this refund needed?"
              onChange={(e) => setEditing({ ...editing, reason: e.target.value })}
            />
          </Field>
        </ModalShell>
      )}
    </div>
  );
}
