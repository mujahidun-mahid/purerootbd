import { useState } from 'react';
import { Boxes, Warehouse, Layers, Timer, Banknote, RefreshCw, Plus, Pencil, Trash2, AlertCircle } from 'lucide-react';
import { SegTabs, StatCard, Alert, ModalShell, Field, Toggle } from '../ui';
import DataTable from '../DataTable';
import { money, formatDate } from '../constants';
import { useLocalCollection } from '../useLocalData';
import { seedWarehouses, seedBatches } from '../mockData';
import useAdminProducts from '../useAdminProducts';

function unitPrice(p) {
  const prices = (Array.isArray(p.packages) ? p.packages : [])
    .map((x) => Number(x && x.price))
    .filter((n) => n > 0);
  return prices.length ? Math.min(...prices) : Number(p.price || 0);
}

function daysLeft(date) {
  const time = new Date(date).getTime();
  if (Number.isNaN(time)) return null;
  return Math.ceil((time - Date.now()) / 86400000);
}

function expiryBadge(date) {
  const left = daysLeft(date);
  if (left === null) return '—';
  if (left < 0) return <span className="expiry-badge expiry-past">Expired</span>;
  if (left <= 30) return <span className="expiry-badge expiry-soon">{left}d left</span>;
  return <span className="expiry-badge expiry-ok">{left}d</span>;
}

const blankWarehouse = { name: '', location: '', manager: '', capacity: 500, used: 0, active: true };
const blankBatch = { product: '', batch: '', qty: 0, expiry: '', warehouse: seedWarehouses[0].name };

export default function InventoryTab({ password }) {
  const { items, loading, saving, error, setError, save, reload } = useAdminProducts(password);
  const { items: warehouses, save: saveWh, remove: removeWh } = useLocalCollection('warehouses', seedWarehouses);
  const { items: batches, save: saveBatch, remove: removeBatch } = useLocalCollection('batches', seedBatches);

  const [view, setView] = useState('stock');
  const [notice, setNotice] = useState('');
  const [formError, setFormError] = useState('');
  const [whEditing, setWhEditing] = useState(null);
  const [batchEditing, setBatchEditing] = useState(null);

  const units = items.reduce((sum, p) => sum + Number(p.stock || 0), 0);
  const outOfStock = items.filter((p) => Number(p.stock || 0) <= 0).length;
  const lowStock = items.filter((p) => {
    const n = Number(p.stock || 0);
    return n > 0 && n <= 10;
  }).length;
  const stockValue = items.reduce((sum, p) => sum + Number(p.stock || 0) * unitPrice(p), 0);
  const expiringSoon = batches.filter((b) => {
    const left = daysLeft(b.expiry);
    return left !== null && left >= 0 && left <= 30;
  }).length;
  const expired = batches.filter((b) => {
    const left = daysLeft(b.expiry);
    return left !== null && left < 0;
  }).length;

  function adjust(p, delta) {
    save({ id: p.id, stock: Math.max(0, Number(p.stock || 0) + delta) }, false);
  }

  function openNewWarehouse() {
    setFormError('');
    setNotice('');
    setWhEditing({ ...blankWarehouse });
  }

  function saveWarehouse() {
    const name = String(whEditing.name || '').trim();
    if (!name) return setFormError('Warehouse name is required.');
    saveWh({ ...whEditing, name, capacity: Number(whEditing.capacity || 0), used: Number(whEditing.used || 0) });
    setNotice(`Warehouse ${name} saved.`);
    setWhEditing(null);
  }

  function deleteWarehouse(w) {
    if (!window.confirm(`Delete warehouse ${w.name}?`)) return;
    removeWh(w.id);
    setNotice(`Warehouse ${w.name} deleted.`);
  }

  function openNewBatch() {
    setFormError('');
    setNotice('');
    setBatchEditing({ ...blankBatch });
  }

  function saveBatchRecord() {
    const product = String(batchEditing.product || '').trim();
    if (!product) return setFormError('Product name is required.');
    if (!batchEditing.expiry) return setFormError('Expiry date is required.');
    saveBatch({ ...batchEditing, product, qty: Number(batchEditing.qty || 0) });
    setNotice(`Batch ${batchEditing.batch || product} saved.`);
    setBatchEditing(null);
  }

  function deleteBatch(b) {
    if (!window.confirm(`Delete batch ${b.batch} for ${b.product}?`)) return;
    removeBatch(b.id);
    setNotice(`Batch ${b.batch} deleted.`);
  }

  const stockColumns = [
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <>
          <strong>{p.name}</strong>
          <small>{p.slug}</small>
        </>
      )
    },
    { key: 'sku', header: 'SKU', render: (p) => p.slug || '—' },
    {
      key: 'stock',
      header: 'Stock',
      render: (p) => {
        const n = Number(p.stock || 0);
        const width = `${Math.min(100, Math.max(0, n))}%`;
        return (
          <span className="stock-meter">
            <span className="bar-track">
              <i className={n <= 0 ? 'out' : n <= 10 ? 'low' : ''} style={{ width }} />
            </span>
            <b>{n}</b>
          </span>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) => {
        const n = Number(p.stock || 0);
        const label = n <= 0 ? 'Out of stock' : n <= 10 ? 'Low' : 'In stock';
        return <span className={`pill ${n <= 10 ? 'pill-off' : 'pill-on'}`}>{label}</span>;
      }
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <span className="row-actions">
          <button type="button" className="btn btn-sm" disabled={saving} onClick={() => adjust(p, -10)}>
            −10
          </button>
          <button type="button" className="btn btn-sm" disabled={saving} onClick={() => adjust(p, -1)}>
            −1
          </button>
          <button type="button" className="btn btn-sm" disabled={saving} onClick={() => adjust(p, 1)}>
            +1
          </button>
          <button type="button" className="btn btn-sm" disabled={saving} onClick={() => adjust(p, 10)}>
            +10
          </button>
        </span>
      )
    }
  ];

  const batchColumns = [
    { key: 'product', header: 'Product', render: (b) => <strong>{b.product}</strong> },
    { key: 'batch', header: 'Batch Code', render: (b) => b.batch || '—' },
    { key: 'qty', header: 'Qty', render: (b) => Number(b.qty || 0).toLocaleString() },
    { key: 'warehouse', header: 'Warehouse', render: (b) => b.warehouse || '—' },
    {
      key: 'expiry',
      header: 'Expiry',
      render: (b) => (
        <span>
          {b.expiry ? formatDate(b.expiry) : '—'} {b.expiry && expiryBadge(b.expiry)}
        </span>
      )
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (b) => (
        <span className="row-actions">
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => {
              setFormError('');
              setBatchEditing({ ...b });
            }}
          >
            <Pencil size={13} /> Edit
          </button>
          <button type="button" className="btn btn-sm danger" onClick={() => deleteBatch(b)}>
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
          <div className="admin-kicker">Stock Control</div>
          <h2>
            Inventory <em>({items.length} SKUs)</em>
          </h2>
        </div>
        <div className="admin-toolbar-right">
          {view === 'stock' && (
            <button type="button" className="btn btn-outline" onClick={reload}>
              <RefreshCw size={15} /> Refresh
            </button>
          )}
          {view === 'warehouses' && (
            <button type="button" className="btn btn-primary" onClick={openNewWarehouse}>
              <Plus size={15} /> Add Warehouse
            </button>
          )}
          {view === 'batches' && (
            <button type="button" className="btn btn-primary" onClick={openNewBatch}>
              <Plus size={15} /> Add Batch
            </button>
          )}
        </div>
      </div>

      {notice && <Alert onClose={() => setNotice('')}>{notice}</Alert>}
      {view === 'stock' && error && (
        <Alert type="error" onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <SegTabs
        items={[
          { id: 'stock', label: 'Stock', count: items.length },
          { id: 'warehouses', label: 'Warehouses', count: warehouses.length },
          { id: 'batches', label: 'Batches', count: batches.length }
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'stock' && (
        <>
          <div className="kpi-row">
            <StatCard label="SKUs" value={items.length} sub="Tracked products" icon={Boxes} />
            <StatCard
              label="Units In Stock"
              value={units.toLocaleString()}
              sub="Across all SKUs"
              icon={Warehouse}
              tone="green"
            />
            <StatCard label="Out Of Stock" value={outOfStock} sub="Stock at zero" icon={AlertCircle} />
            <StatCard label="Low Stock" value={lowStock} sub="10 units or fewer" icon={Timer} tone="gold" />
            <StatCard label="Stock Value" value={money(stockValue)} sub="Cheapest package price" icon={Banknote} />
          </div>

          <DataTable
            columns={stockColumns}
            rows={items}
            rowKey={(p) => p.id}
            pageSize={15}
            loading={loading}
            emptyText="No products loaded yet."
            emptyIcon={Boxes}
          />
        </>
      )}

      {view === 'warehouses' && (
        <div className="card-grid">
          {warehouses.map((w) => {
            const cap = Math.max(1, Number(w.capacity || 1));
            const pct = Math.min(100, Math.round((Number(w.used || 0) / cap) * 100));
            return (
              <article className={`info-card ${w.active ? '' : 'off'}`} key={w.id}>
                <div className="ic-head">
                  <h4>{w.name}</h4>
                </div>
                <div className="ic-sub">{w.location}</div>
                <div className="ic-lines">
                  <span>Manager: {w.manager || '—'}</span>
                  <span className="stock-meter">
                    <span className="bar-track">
                      <i style={{ width: `${pct}%` }} />
                    </span>
                    <b>
                      {Number(w.used || 0)}/{Number(w.capacity || 0)}
                    </b>
                  </span>
                  <span className={`pill ${w.active ? 'pill-on' : 'pill-off'}`}>{w.active ? 'Active' : 'Off'}</span>
                </div>
                <div className="ic-actions">
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => {
                      setFormError('');
                      setWhEditing({ ...w });
                    }}
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button type="button" className="btn btn-sm danger" onClick={() => deleteWarehouse(w)}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </article>
            );
          })}
          {!warehouses.length && (
            <article className="info-card">
              <div className="ic-sub">No warehouses configured yet.</div>
            </article>
          )}
        </div>
      )}

      {view === 'batches' && (
        <>
          <div className="kpi-row">
            <StatCard label="Batches" value={batches.length} sub="Tracked lots" icon={Layers} />
            <StatCard label="Expiring Soon" value={expiringSoon} sub="Within 30 days" icon={Timer} tone="gold" />
            <StatCard label="Expired" value={expired} sub="Past expiry date" icon={AlertCircle} />
          </div>

          <DataTable
            columns={batchColumns}
            rows={batches}
            rowKey={(b) => b.id}
            emptyText="No batches tracked yet — add your first lot."
            emptyIcon={Layers}
          />
        </>
      )}

      {whEditing && (
        <ModalShell
          kicker="Warehouse Editor"
          title={whEditing.id ? `Edit ${whEditing.name}` : 'New Warehouse'}
          onClose={() => setWhEditing(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setWhEditing(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveWarehouse}>
                Save Warehouse
              </button>
            </>
          }
        >
          {formError && (
            <div className="full">
              <Alert type="error" onClose={() => setFormError('')}>
                {formError}
              </Alert>
            </div>
          )}
          <Field label="Warehouse Name">
            <input
              className="input"
              value={whEditing.name}
              placeholder="e.g. Dhaka Micro-Hub"
              onChange={(e) => setWhEditing({ ...whEditing, name: e.target.value })}
            />
          </Field>
          <Field label="Location">
            <input
              className="input"
              value={whEditing.location}
              placeholder="Area, city"
              onChange={(e) => setWhEditing({ ...whEditing, location: e.target.value })}
            />
          </Field>
          <Field label="Manager">
            <input
              className="input"
              value={whEditing.manager}
              placeholder="Person in charge"
              onChange={(e) => setWhEditing({ ...whEditing, manager: e.target.value })}
            />
          </Field>
          <Field label="Capacity (units)">
            <input
              className="input"
              type="number"
              min="0"
              value={whEditing.capacity}
              onChange={(e) => setWhEditing({ ...whEditing, capacity: Number(e.target.value) })}
            />
          </Field>
          <div className="full">
            <label className="editor-toggle">
              <Toggle
                checked={whEditing.active}
                onChange={(v) => setWhEditing({ ...whEditing, active: v })}
                label="Warehouse active"
              />
              Warehouse is accepting stock
            </label>
          </div>
        </ModalShell>
      )}

      {batchEditing && (
        <ModalShell
          kicker="Batch Editor"
          title={batchEditing.id ? `Edit ${batchEditing.batch}` : 'New Batch'}
          onClose={() => setBatchEditing(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setBatchEditing(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveBatchRecord}>
                Save Batch
              </button>
            </>
          }
        >
          {formError && (
            <div className="full">
              <Alert type="error" onClose={() => setFormError('')}>
                {formError}
              </Alert>
            </div>
          )}
          <Field label="Product">
            <input
              className="input"
              value={batchEditing.product}
              placeholder="e.g. Organic Turmeric"
              onChange={(e) => setBatchEditing({ ...batchEditing, product: e.target.value })}
            />
          </Field>
          <Field label="Batch Code">
            <input
              className="input"
              value={batchEditing.batch}
              placeholder="e.g. TC-0912"
              onChange={(e) => setBatchEditing({ ...batchEditing, batch: e.target.value })}
            />
          </Field>
          <Field label="Quantity">
            <input
              className="input"
              type="number"
              min="0"
              value={batchEditing.qty}
              onChange={(e) => setBatchEditing({ ...batchEditing, qty: Number(e.target.value) })}
            />
          </Field>
          <Field label="Expiry Date">
            <input
              className="input"
              type="date"
              value={batchEditing.expiry || ''}
              onChange={(e) => setBatchEditing({ ...batchEditing, expiry: e.target.value })}
            />
          </Field>
          <Field label="Warehouse" hint="full">
            <select
              className="input"
              value={batchEditing.warehouse}
              onChange={(e) => setBatchEditing({ ...batchEditing, warehouse: e.target.value })}
            >
              {seedWarehouses.map((w) => (
                <option key={w.id} value={w.name}>
                  {w.name}
                </option>
              ))}
            </select>
          </Field>
        </ModalShell>
      )}
    </div>
  );
}
