import { useState } from 'react';
import { Truck, UserCheck, MapPin, Plus, Pencil, Trash2, Package, Inbox, CheckCircle2, Check } from 'lucide-react';
import { SegTabs, StatCard, Alert, StatusPill, EmptyState, ModalShell, Field, Toggle } from '../ui';
import DataTable from '../DataTable';
import { money } from '../constants';
import { useLocalCollection } from '../useLocalData';
import { seedDrivers, seedZones } from '../mockData';

const ASSIGNABLE = ['Processing', 'Packed', 'Shipped', 'Out for Delivery'];
const ZONE_OPTIONS = [...seedZones.map((z) => z.name), 'Other'];

const blankDriver = {
  name: '',
  phone: '',
  vehicle: '',
  zone: ZONE_OPTIONS[0],
  status: 'On Duty',
  active: true
};

export default function DriversTab({ password, orders = [], onStatus }) {
  const { items: drivers, save: saveDriver, remove: removeDriver } = useLocalCollection('drivers', seedDrivers);
  const { items: assignments, save: saveAssign, remove: removeAssign } = useLocalCollection('dispatch', []);

  const [view, setView] = useState('drivers');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  const openOrders = orders.filter((o) => ASSIGNABLE.includes(o.status));
  const onDuty = drivers.filter((d) => d.status === 'On Duty').length;
  const zones = new Set(drivers.filter((d) => d.active && d.zone).map((d) => d.zone));
  const assignmentOf = (id) => assignments.find((a) => a.id === id);
  const assignedCount = openOrders.filter((o) => assignmentOf(o.id)).length;
  const outForDelivery = orders.filter((o) => o.status === 'Out for Delivery').length;
  const deliveredToday = orders.filter(
    (o) =>
      o.status === 'Delivered' &&
      new Date(o.updated_at || o.placed_at).toDateString() === new Date().toDateString()
  ).length;

  function openNewDriver() {
    setError('');
    setNotice('');
    setEditing({ ...blankDriver });
  }

  function openEditDriver(d) {
    setError('');
    setNotice('');
    setEditing({ ...d });
  }

  function saveDriverRecord() {
    const name = String(editing.name || '').trim();
    if (!name) return setError('Driver name is required.');
    saveDriver({ ...editing, name });
    setNotice(`Driver ${name} saved.`);
    setEditing(null);
  }

  function deleteDriver(d) {
    if (!window.confirm(`Delete driver ${d.name}?`)) return;
    removeDriver(d.id);
    setNotice(`Driver ${d.name} deleted.`);
  }

  function assign(order, value) {
    if (!value) {
      removeAssign(order.id);
      setNotice(`Driver unassigned from ${order.order_number}.`);
      return;
    }
    saveAssign({ id: order.id, driverId: value, assigned_at: new Date().toISOString() });
    const driver = drivers.find((d) => d.id === value);
    setNotice(`${driver ? driver.name : 'Driver'} assigned to ${order.order_number}.`);
  }

  function deliver(order) {
    if (!window.confirm(`Mark ${order.order_number} as delivered?`)) return;
    onStatus?.(order.id, 'Delivered');
    setNotice(`${order.order_number} marked delivered.`);
  }

  const dispatchColumns = [
    {
      key: 'order_number',
      header: 'Order #',
      render: (o) => <strong>{o.order_number}</strong>
    },
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
    {
      key: 'zone',
      header: 'Zone / Address',
      render: (o) => o.address || o.district || o.customer?.address || '—'
    },
    { key: 'total', header: 'Total', render: (o) => money(o.total) },
    { key: 'status', header: 'Status', render: (o) => <StatusPill status={o.status} /> },
    {
      key: 'driver',
      header: 'Driver',
      render: (o) => (
        <select
          className="filter"
          value={assignmentOf(o.id)?.driverId || ''}
          onChange={(e) => assign(o, e.target.value)}
          onClick={(e) => e.stopPropagation()}
        >
          <option value="">Unassigned</option>
          {drivers
            .filter((d) => d.active)
            .map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
        </select>
      )
    },
    {
      key: 'assigned_driver',
      header: 'Assigned Driver',
      render: (o) => {
        const a = assignmentOf(o.id);
        const d = a ? drivers.find((x) => x.id === a.driverId) : null;
        return d ? d.name : '—';
      }
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (o) => (
        <span className="row-actions">
          <button type="button" className="btn btn-primary btn-sm" onClick={() => deliver(o)}>
            <Check size={13} /> Deliver
          </button>
        </span>
      )
    }
  ];

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <div>
          <div className="admin-kicker">Last Mile</div>
          <h2>
            Drivers &amp; Dispatch <em>({drivers.length} on roster)</em>
          </h2>
        </div>
        <div className="admin-toolbar-right">
          {view === 'drivers' ? (
            <button type="button" className="btn btn-primary" onClick={openNewDriver}>
              <Plus size={15} /> Add Driver
            </button>
          ) : (
            <span className="muted">Assign a driver, then mark orders delivered.</span>
          )}
        </div>
      </div>

      {notice && <Alert onClose={() => setNotice('')}>{notice}</Alert>}

      <SegTabs
        items={[
          { id: 'drivers', label: 'Drivers', count: drivers.length },
          { id: 'dispatch', label: 'Dispatch Board', count: openOrders.length }
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'drivers' ? (
        <>
          <div className="kpi-row">
            <StatCard label="Drivers" value={drivers.length} sub="On the roster" icon={Truck} />
            <StatCard label="On Duty" value={onDuty} sub="Ready to deliver" icon={UserCheck} tone="green" />
            <StatCard label="Active Zones" value={zones.size} sub="Covered by drivers" icon={MapPin} tone="gold" />
          </div>

          <div className="card-grid">
            {drivers.map((d) => (
              <article className={`info-card ${d.active ? '' : 'off'}`} key={d.id}>
                <div className="ic-head">
                  <h4>{d.name}</h4>
                </div>
                <div className="ic-sub">{d.vehicle || 'Vehicle not set'}</div>
                <div className="ic-lines">
                  <span>Phone: {d.phone || '—'}</span>
                  <span>Zone: {d.zone || '—'}</span>
                  <span className={`pill ${d.status === 'On Duty' ? 'pill-on' : 'pill-off'}`}>{d.status}</span>
                </div>
                <div className="ic-actions">
                  <button type="button" className="btn btn-sm" onClick={() => openEditDriver(d)}>
                    <Pencil size={13} /> Edit
                  </button>
                  <button type="button" className="btn btn-sm danger" onClick={() => deleteDriver(d)}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </article>
            ))}
            {!drivers.length && (
              <article className="info-card">
                <div className="ic-sub">No drivers yet — add your first rider.</div>
              </article>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="kpi-row">
            <StatCard label="Open Orders" value={openOrders.length} sub="Waiting on dispatch" icon={Package} />
            <StatCard label="Assigned" value={assignedCount} sub="Driver assigned" icon={UserCheck} tone="green" />
            <StatCard label="Out For Delivery" value={outForDelivery} sub="On the road now" icon={Truck} />
            <StatCard label="Delivered Today" value={deliveredToday} sub="Since midnight" icon={CheckCircle2} tone="gold" />
          </div>

          {openOrders.length === 0 ? (
            <EmptyState text="No orders waiting for dispatch." icon={Inbox} />
          ) : (
            <DataTable
              columns={dispatchColumns}
              rows={openOrders}
              rowKey={(o) => o.id}
              pageSize={10}
              emptyText="No orders waiting for dispatch."
              emptyIcon={Inbox}
            />
          )}
        </>
      )}

      {editing && (
        <ModalShell
          kicker="Driver Editor"
          title={editing.id ? `Edit ${editing.name}` : 'New Driver'}
          onClose={() => setEditing(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveDriverRecord}>
                Save Driver
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
          <Field label="Driver Name">
            <input
              className="input"
              value={editing.name}
              placeholder="e.g. Jahangir Alam"
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <input
              className="input"
              value={editing.phone}
              placeholder="+880 …"
              onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
            />
          </Field>
          <Field label="Vehicle" hint="full">
            <input
              className="input"
              value={editing.vehicle}
              placeholder="Motorbike · DHA-11-4582"
              onChange={(e) => setEditing({ ...editing, vehicle: e.target.value })}
            />
          </Field>
          <Field label="Zone">
            <select
              className="input"
              value={editing.zone}
              onChange={(e) => setEditing({ ...editing, zone: e.target.value })}
            >
              {ZONE_OPTIONS.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              className="input"
              value={editing.status}
              onChange={(e) => setEditing({ ...editing, status: e.target.value })}
            >
              <option value="On Duty">On Duty</option>
              <option value="Off">Off</option>
            </select>
          </Field>
          <div className="full">
            <label className="editor-toggle">
              <Toggle
                checked={editing.active}
                onChange={(v) => setEditing({ ...editing, active: v })}
                label="Driver active"
              />
              Driver is available for assignments
            </label>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
