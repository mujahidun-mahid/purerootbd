import { useState } from 'react';
import { Clock, MapPin, Plus, Pencil, Trash2 } from 'lucide-react';
import { SegTabs, StatCard, Alert, ModalShell, Field, Toggle } from '../ui';
import DataTable from '../DataTable';
import { money } from '../constants';
import { useLocalCollection } from '../useLocalData';
import { seedSlots, seedZones } from '../mockData';

const DAYS = ['Every day', 'Friday', 'Saturday', 'Sunday', 'Weekdays'];

const blankSlot = { day: 'Every day', window: '09:00 – 12:00', fee: 80, capacity: 20, active: true };
const blankZone = { name: '', areas: '', fee: 40, eta: 'Same day', active: true };

export default function DeliveryTab({ password }) {
  const { items: slots, save: saveSlot, remove: removeSlot } = useLocalCollection('deliverySlots', seedSlots);
  const { items: zones, save: saveZone, remove: removeZone } = useLocalCollection('deliveryZones', seedZones);

  const [view, setView] = useState('slots');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [slotEditing, setSlotEditing] = useState(null);
  const [zoneEditing, setZoneEditing] = useState(null);

  const activeSlots = slots.filter((s) => s.active).length;
  const avgFee = slots.length
    ? Math.round(slots.reduce((sum, s) => sum + Number(s.fee || 0), 0) / slots.length)
    : 0;

  function openNewSlot() {
    setError('');
    setNotice('');
    setSlotEditing({ ...blankSlot });
  }

  function openEditSlot(s) {
    setError('');
    setNotice('');
    setSlotEditing({ ...s });
  }

  function saveSlotRecord() {
    const windowLabel = String(slotEditing.window || '').trim();
    if (!windowLabel) return setError('Delivery window is required.');
    saveSlot({
      ...slotEditing,
      window: windowLabel,
      fee: Number(slotEditing.fee || 0),
      capacity: Number(slotEditing.capacity || 0)
    });
    setNotice(`Slot ${slotEditing.day} ${windowLabel} saved.`);
    setSlotEditing(null);
  }

  function deleteSlot(s) {
    if (!window.confirm(`Delete ${s.day} ${s.window} slot?`)) return;
    removeSlot(s.id);
    setNotice(`Slot ${s.day} ${s.window} deleted.`);
  }

  function openNewZone() {
    setError('');
    setNotice('');
    setZoneEditing({ ...blankZone });
  }

  function openEditZone(z) {
    setError('');
    setNotice('');
    setZoneEditing({ ...z });
  }

  function saveZoneRecord() {
    const name = String(zoneEditing.name || '').trim();
    if (!name) return setError('Zone name is required.');
    saveZone({ ...zoneEditing, name, fee: Number(zoneEditing.fee || 0) });
    setNotice(`Zone ${name} saved.`);
    setZoneEditing(null);
  }

  function deleteZone(z) {
    if (!window.confirm(`Delete zone ${z.name}?`)) return;
    removeZone(z.id);
    setNotice(`Zone ${z.name} deleted.`);
  }

  const slotColumns = [
    { key: 'day', header: 'Day', render: (s) => <strong>{s.day}</strong> },
    { key: 'window', header: 'Window', render: (s) => s.window },
    { key: 'fee', header: 'Fee', render: (s) => money(s.fee) },
    { key: 'capacity', header: 'Capacity', render: (s) => `${Number(s.capacity || 0)} orders` },
    {
      key: 'active',
      header: 'Status',
      render: (s) => <span className={`pill ${s.active ? 'pill-on' : 'pill-off'}`}>{s.active ? 'Active' : 'Paused'}</span>
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (s) => (
        <span className="row-actions">
          <button type="button" className="btn btn-sm" onClick={() => openEditSlot(s)}>
            <Pencil size={13} /> Edit
          </button>
          <button type="button" className="btn btn-sm danger" onClick={() => deleteSlot(s)}>
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
          <div className="admin-kicker">Logistics Rules</div>
          <h2>
            Delivery <em>({slots.length} slots · {zones.length} zones)</em>
          </h2>
        </div>
        <div className="admin-toolbar-right">
          {view === 'slots' ? (
            <button type="button" className="btn btn-primary" onClick={openNewSlot}>
              <Plus size={15} /> Add Slot
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={openNewZone}>
              <Plus size={15} /> Add Zone
            </button>
          )}
        </div>
      </div>

      <p className="admin-sub muted">Slot and zone rules are stored locally until the delivery API ships.</p>

      {notice && <Alert onClose={() => setNotice('')}>{notice}</Alert>}

      <SegTabs
        items={[
          { id: 'slots', label: 'Delivery Slots', count: slots.length },
          { id: 'zones', label: 'Delivery Zones', count: zones.length }
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'slots' ? (
        <>
          <div className="kpi-row">
            <StatCard label="Delivery Slots" value={slots.length} sub="Configured windows" icon={Clock} />
            <StatCard label="Active Slots" value={activeSlots} sub="Open for checkout" icon={MapPin} tone="green" />
            <StatCard label="Avg Slot Fee" value={money(avgFee)} sub="Across all slots" icon={MapPin} tone="gold" />
          </div>

          <DataTable
            columns={slotColumns}
            rows={slots}
            rowKey={(s) => s.id}
            emptyText="No delivery slots yet — add your first window."
            emptyIcon={Clock}
          />
        </>
      ) : (
        <div className="card-grid">
          {zones.map((z) => (
            <article className={`info-card ${z.active ? '' : 'off'}`} key={z.id}>
              <div className="ic-head">
                <h4>{z.name}</h4>
              </div>
              <div className="ic-sub">{z.eta}</div>
              <div className="ic-lines">
                <span>Areas: {z.areas || '—'}</span>
                <span>Fee: {money(z.fee)}</span>
                <span className={`pill ${z.active ? 'pill-on' : 'pill-off'}`}>{z.active ? 'Active' : 'Off'}</span>
              </div>
              <div className="ic-actions">
                <button type="button" className="btn btn-sm" onClick={() => openEditZone(z)}>
                  <Pencil size={13} /> Edit
                </button>
                <button type="button" className="btn btn-sm danger" onClick={() => deleteZone(z)}>
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </article>
          ))}
          {!zones.length && (
            <article className="info-card">
              <div className="ic-sub">No delivery zones yet — add your first zone.</div>
            </article>
          )}
        </div>
      )}

      {slotEditing && (
        <ModalShell
          kicker="Slot Editor"
          title={slotEditing.id ? `Edit ${slotEditing.day} slot` : 'New Delivery Slot'}
          onClose={() => setSlotEditing(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setSlotEditing(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveSlotRecord}>
                Save Slot
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
          <Field label="Day">
            <select
              className="input"
              value={slotEditing.day}
              onChange={(e) => setSlotEditing({ ...slotEditing, day: e.target.value })}
            >
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Window">
            <input
              className="input"
              value={slotEditing.window}
              placeholder="09:00 – 12:00"
              onChange={(e) => setSlotEditing({ ...slotEditing, window: e.target.value })}
            />
          </Field>
          <Field label="Fee (৳)">
            <input
              className="input"
              type="number"
              min="0"
              value={slotEditing.fee}
              onChange={(e) => setSlotEditing({ ...slotEditing, fee: Number(e.target.value) })}
            />
          </Field>
          <Field label="Capacity (orders)">
            <input
              className="input"
              type="number"
              min="0"
              value={slotEditing.capacity}
              onChange={(e) => setSlotEditing({ ...slotEditing, capacity: Number(e.target.value) })}
            />
          </Field>
          <div className="full">
            <label className="editor-toggle">
              <Toggle
                checked={slotEditing.active}
                onChange={(v) => setSlotEditing({ ...slotEditing, active: v })}
                label="Slot active"
              />
              Slot is offered at checkout
            </label>
          </div>
        </ModalShell>
      )}

      {zoneEditing && (
        <ModalShell
          kicker="Zone Editor"
          title={zoneEditing.id ? `Edit ${zoneEditing.name}` : 'New Delivery Zone'}
          onClose={() => setZoneEditing(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setZoneEditing(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveZoneRecord}>
                Save Zone
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
          <Field label="Zone Name">
            <input
              className="input"
              value={zoneEditing.name}
              placeholder="e.g. Dhaka Metro"
              onChange={(e) => setZoneEditing({ ...zoneEditing, name: e.target.value })}
            />
          </Field>
          <Field label="Estimated Time" hint="full">
            <input
              className="input"
              value={zoneEditing.eta}
              placeholder="e.g. 1–2 days"
              onChange={(e) => setZoneEditing({ ...zoneEditing, eta: e.target.value })}
            />
          </Field>
          <Field label="Delivery Fee (৳)">
            <input
              className="input"
              type="number"
              min="0"
              value={zoneEditing.fee}
              onChange={(e) => setZoneEditing({ ...zoneEditing, fee: Number(e.target.value) })}
            />
          </Field>
          <Field label="Areas" hint="full">
            <textarea
              className="input textarea"
              rows="3"
              value={zoneEditing.areas}
              placeholder="Sonapur, Maijdee, Chandpur Road"
              onChange={(e) => setZoneEditing({ ...zoneEditing, areas: e.target.value })}
            />
          </Field>
          <div className="full">
            <label className="editor-toggle">
              <Toggle
                checked={zoneEditing.active}
                onChange={(v) => setZoneEditing({ ...zoneEditing, active: v })}
                label="Zone active"
              />
              Zone is accepting orders
            </label>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
