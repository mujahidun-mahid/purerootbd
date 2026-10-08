import { useState } from 'react';
import { CheckCircle2, Clock, Headphones, Inbox, Pencil, Plus, Trash2 } from 'lucide-react';
import { Alert, ModalShell, Field, StatCard, SegTabs } from '../ui';
import DataTable from '../DataTable';
import { formatDate } from '../constants';
import { useLocalCollection } from '../useLocalData';
import { seedTickets } from '../mockData';

const blankTicket = {
  subject: '',
  customer: '',
  order: '',
  priority: 'Normal',
  status: 'Open',
  message: ''
};

const priorityClass = (p) => (p === 'Normal' ? 'pill pill-on' : 'pill pill-off');
const statusClass = (s) => (s === 'Pending' ? 'pill pill-off' : 'pill pill-on');

export default function SupportTab({ password }) {
  const { items: tickets, save, patch, remove } = useLocalCollection('tickets', seedTickets);
  const [filter, setFilter] = useState('all');
  const [notice, setNotice] = useState(null);
  const [editing, setEditing] = useState(null);

  const open = tickets.filter((t) => t.status === 'Open').length;
  const pending = tickets.filter((t) => t.status === 'Pending').length;
  const resolved = tickets.filter((t) => t.status === 'Resolved').length;

  const rows = filter === 'all' ? tickets : tickets.filter((t) => t.status.toLowerCase() === filter);

  const segItems = [
    { id: 'all', label: 'All', count: tickets.length },
    { id: 'open', label: 'Open', count: open },
    { id: 'pending', label: 'Pending', count: pending },
    { id: 'resolved', label: 'Resolved', count: resolved }
  ];

  function openNew() {
    setNotice(null);
    setEditing({ ...blankTicket });
  }

  function openEdit(ticket) {
    setNotice(null);
    setEditing({ ...ticket });
  }

  function saveTicket() {
    const subject = String(editing.subject || '').trim();
    if (!subject) {
      setNotice({ type: 'error', text: 'Subject is required.' });
      return;
    }
    save({ ...editing, subject });
    setNotice({ type: 'success', text: `Ticket "${subject}" saved.` });
    setEditing(null);
  }

  function deleteTicket(ticket) {
    if (!window.confirm(`Delete ticket "${ticket.subject}"?`)) return;
    remove(ticket.id);
    setNotice({ type: 'success', text: 'Ticket deleted.' });
  }

  const columns = [
    {
      key: 'subject',
      header: 'Subject',
      render: (t) => (
        <>
          <strong>{t.subject}</strong>
          <small>{t.created_at ? formatDate(t.created_at) : '—'}</small>
        </>
      )
    },
    { key: 'customer', header: 'Customer', render: (t) => t.customer || '—' },
    {
      key: 'order',
      header: 'Order Ref',
      render: (t) => <span className="link-button">{t.order || '—'}</span>
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (t) => <span className={priorityClass(t.priority)}>{t.priority}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => <span className={statusClass(t.status)}>{t.status}</span>
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (t) => (
        <span className="row-actions">
          {t.status !== 'Resolved' ? (
            <button
              type="button"
              className="btn btn-sm btn-primary"
              onClick={() => {
                patch(t.id, { status: 'Resolved' });
                setNotice({ type: 'success', text: `Ticket "${t.subject}" resolved.` });
              }}
            >
              Resolve
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-sm"
              onClick={() => patch(t.id, { status: 'Open' })}
            >
              Reopen
            </button>
          )}
          <button type="button" className="btn btn-sm" onClick={() => openEdit(t)}>
            <Pencil size={13} /> Edit
          </button>
          <button type="button" className="btn btn-sm danger" onClick={() => deleteTicket(t)}>
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
          <div className="admin-kicker">Customer Care</div>
          <h2>
            Support Tickets <em>({open} waiting)</em>
          </h2>
        </div>
        <div className="admin-toolbar-right">
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <Plus size={15} /> Add Ticket
          </button>
        </div>
      </div>

      {notice && (
        <Alert type={notice.type} onClose={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      <div className="kpi-row">
        <StatCard label="Total Tickets" value={tickets.length} sub="All time" icon={Headphones} />
        <StatCard label="Open" value={open} sub="Awaiting first reply" icon={Inbox} tone="gold" />
        <StatCard label="Pending" value={pending} sub="Waiting on follow-up" icon={Clock} />
        <StatCard label="Resolved" value={resolved} sub="Closed cleanly" icon={CheckCircle2} tone="green" />
      </div>

      <SegTabs items={segItems} value={filter} onChange={setFilter} />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(t) => t.id}
        pageSize={10}
        filtered={filter !== 'all'}
        emptyText="No tickets yet — customer questions appear here."
        emptyFilteredText="No tickets with this status."
        emptyIcon={Headphones}
      />

      {editing && (
        <ModalShell
          kicker="Ticket Editor"
          title={editing.subject ? 'Edit Ticket' : 'New Ticket'}
          onClose={() => setEditing(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveTicket}>
                Save Ticket
              </button>
            </>
          }
        >
          <Field label="Subject">
            <input
              className="input"
              value={editing.subject}
              placeholder="e.g. Order PR-103 arrived damaged"
              onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
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
          <Field label="Order Ref">
            <input
              className="input"
              value={editing.order}
              placeholder="e.g. PR-103"
              onChange={(e) => setEditing({ ...editing, order: e.target.value })}
            />
          </Field>
          <Field label="Priority">
            <select
              className="input"
              value={editing.priority}
              onChange={(e) => setEditing({ ...editing, priority: e.target.value })}
            >
              <option value="High">High</option>
              <option value="Normal">Normal</option>
              <option value="Low">Low</option>
            </select>
          </Field>
          <Field label="Status">
            <select
              className="input"
              value={editing.status}
              onChange={(e) => setEditing({ ...editing, status: e.target.value })}
            >
              <option value="Open">Open</option>
              <option value="Pending">Pending</option>
              <option value="Resolved">Resolved</option>
            </select>
          </Field>
          <Field label="Message" hint="full">
            <textarea
              className="input textarea"
              rows="3"
              value={editing.message}
              placeholder="Full customer message…"
              onChange={(e) => setEditing({ ...editing, message: e.target.value })}
            />
          </Field>
        </ModalShell>
      )}
    </div>
  );
}
