import { useState } from 'react';
import { Building2, Star, Truck, Plus, Pencil, Trash2, FileText } from 'lucide-react';
import { SegTabs, StatCard, Alert, ModalShell, Field, Toggle } from '../ui';
import DataTable from '../DataTable';
import { money, formatDate } from '../constants';
import { useLocalCollection } from '../useLocalData';
import { seedSuppliers, seedPurchaseOrders } from '../mockData';

const blankSupplier = {
  name: '',
  contact: '',
  phone: '',
  email: '',
  products: '',
  city: '',
  rating: 4.5,
  active: true
};

export default function SuppliersTab({ password }) {
  const { items: suppliers, save: saveSupplier, remove: removeSupplier } = useLocalCollection(
    'suppliers',
    seedSuppliers
  );
  const { items: pos, save: savePO, remove: removePO } = useLocalCollection('purchaseOrders', seedPurchaseOrders);

  const [view, setView] = useState('suppliers');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [supplierEditing, setSupplierEditing] = useState(null);
  const [poEditing, setPoEditing] = useState(null);

  const activeSuppliers = suppliers.filter((s) => s.active);
  const cities = new Set(suppliers.map((s) => s.city).filter(Boolean));
  const avgRating = suppliers.length
    ? (
        suppliers.reduce((sum, s) => sum + Number(s.rating || 0), 0) / suppliers.length
      ).toFixed(1)
    : '—';
  const totalValue = pos.reduce((sum, p) => sum + Number(p.total || 0), 0);
  const received = pos.filter((p) => p.status === 'Received').length;
  const drafts = pos.filter((p) => p.status === 'Draft').length;

  function openNewSupplier() {
    setError('');
    setNotice('');
    setSupplierEditing({ ...blankSupplier });
  }

  function openEditSupplier(s) {
    setError('');
    setNotice('');
    setSupplierEditing({ ...s });
  }

  function saveSupplierRecord() {
    const name = String(supplierEditing.name || '').trim();
    if (!name) return setError('Supplier name is required.');
    saveSupplier({ ...supplierEditing, name, rating: Number(supplierEditing.rating || 0) });
    setNotice(`Supplier ${name} saved.`);
    setSupplierEditing(null);
  }

  function deleteSupplier(s) {
    if (!window.confirm(`Delete supplier ${s.name}?`)) return;
    removeSupplier(s.id);
    setNotice(`Supplier ${s.name} deleted.`);
  }

  function openNewPO() {
    setError('');
    setNotice('');
    setPoEditing({
      number: `PO-2026-00${pos.length + 4}`,
      supplier: suppliers[0]?.name || '',
      items: 1,
      total: 0,
      status: 'Draft',
      ordered_at: new Date().toISOString().slice(0, 10)
    });
  }

  function openEditPO(po) {
    setError('');
    setNotice('');
    setPoEditing({ ...po });
  }

  function savePORecord() {
    const number = String(poEditing.number || '').trim();
    if (!number) return setError('PO number is required.');
    if (!poEditing.supplier) return setError('Select a supplier.');
    savePO({
      ...poEditing,
      number,
      items: Number(poEditing.items || 0),
      total: Number(poEditing.total || 0)
    });
    setNotice(`Purchase order ${number} saved.`);
    setPoEditing(null);
  }

  function deletePO(po) {
    if (!window.confirm(`Delete purchase order ${po.number}?`)) return;
    removePO(po.id);
    setNotice(`Purchase order ${po.number} deleted.`);
  }

  const poColumns = [
    { key: 'number', header: 'PO Number', render: (p) => <strong>{p.number}</strong> },
    { key: 'supplier', header: 'Supplier', render: (p) => p.supplier || '—' },
    { key: 'items', header: 'Items', render: (p) => `${Number(p.items || 0)} items` },
    { key: 'total', header: 'Total', render: (p) => money(p.total) },
    { key: 'ordered_at', header: 'Ordered', render: (p) => formatDate(p.ordered_at) },
    {
      key: 'status',
      header: 'Status',
      render: (p) => (
        <span className={`pill ${p.status === 'Draft' ? 'pill-off' : 'pill-on'}`}>{p.status}</span>
      )
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <span className="row-actions">
          <button type="button" className="btn btn-sm" onClick={() => openEditPO(p)}>
            <Pencil size={13} /> Edit
          </button>
          <button type="button" className="btn btn-sm danger" onClick={() => deletePO(p)}>
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
          <div className="admin-kicker">Supply Chain</div>
          <h2>
            Suppliers <em>({suppliers.length} partners)</em>
          </h2>
        </div>
        <div className="admin-toolbar-right">
          {view === 'suppliers' ? (
            <button type="button" className="btn btn-primary" onClick={openNewSupplier}>
              <Plus size={15} /> Add Supplier
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={openNewPO}>
              <Plus size={15} /> Add Purchase Order
            </button>
          )}
        </div>
      </div>

      {notice && <Alert onClose={() => setNotice('')}>{notice}</Alert>}

      <SegTabs
        items={[
          { id: 'suppliers', label: 'Suppliers', count: suppliers.length },
          { id: 'purchase-orders', label: 'Purchase Orders', count: pos.length }
        ]}
        value={view}
        onChange={setView}
      />

      {view === 'suppliers' ? (
        <>
          <div className="kpi-row">
            <StatCard label="Suppliers" value={suppliers.length} sub="Total partners" icon={Building2} />
            <StatCard label="Active" value={activeSuppliers.length} sub="Currently supplying" icon={Star} tone="green" />
            <StatCard label="Avg Rating" value={avgRating} sub="Across all partners" icon={Star} tone="gold" />
            <StatCard label="Cities" value={cities.size} sub="Sourcing locations" icon={Truck} />
          </div>

          <div className="card-grid">
            {suppliers.map((s) => (
              <article className={`info-card ${s.active ? '' : 'off'}`} key={s.id}>
                <div className="ic-head">
                  <h4>{s.name}</h4>
                  <span className={`pill ${s.active ? 'pill-on' : 'pill-off'}`}>
                    {s.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="ic-sub">
                  {s.role || 'Supplier'} · {s.city || 'Bangladesh'}
                </div>
                <div className="ic-lines">
                  <span>Contact: {s.contact || '—'}</span>
                  <span>Phone: {s.phone || '—'}</span>
                  <span>Email: {s.email || '—'}</span>
                  <span>Supplies: {s.products || '—'}</span>
                  <span>
                    ★ {Number(s.rating || 0).toFixed(1)} rating
                  </span>
                </div>
                <div className="ic-actions">
                  <button type="button" className="btn btn-sm" onClick={() => openEditSupplier(s)}>
                    <Pencil size={13} /> Edit
                  </button>
                  <button type="button" className="btn btn-sm danger" onClick={() => deleteSupplier(s)}>
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </article>
            ))}
            {!suppliers.length && (
              <article className="info-card">
                <div className="ic-sub">No suppliers yet — add your first partner.</div>
              </article>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="kpi-row">
            <StatCard label="Purchase Orders" value={pos.length} sub="All orders raised" icon={FileText} />
            <StatCard label="Total Value" value={money(totalValue)} sub="Combined spend" icon={Truck} tone="green" />
            <StatCard label="Received" value={received} sub="Stock delivered" icon={Building2} />
            <StatCard label="Drafts" value={drafts} sub="Not sent yet" icon={FileText} tone="gold" />
          </div>

          <DataTable
            columns={poColumns}
            rows={pos}
            rowKey={(p) => p.id}
            emptyText="No purchase orders yet."
            emptyIcon={FileText}
          />
        </>
      )}

      {supplierEditing && (
        <ModalShell
          kicker="Supplier Editor"
          title={supplierEditing.id ? `Edit ${supplierEditing.name}` : 'New Supplier'}
          onClose={() => setSupplierEditing(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setSupplierEditing(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveSupplierRecord}>
                Save Supplier
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
          <Field label="Supplier Name">
            <input
              className="input"
              value={supplierEditing.name}
              placeholder="e.g. Rajshahi Agro Traders"
              onChange={(e) => setSupplierEditing({ ...supplierEditing, name: e.target.value })}
            />
          </Field>
          <Field label="Contact Person">
            <input
              className="input"
              value={supplierEditing.contact}
              placeholder="Full name"
              onChange={(e) => setSupplierEditing({ ...supplierEditing, contact: e.target.value })}
            />
          </Field>
          <Field label="Phone">
            <input
              className="input"
              value={supplierEditing.phone}
              placeholder="+880 …"
              onChange={(e) => setSupplierEditing({ ...supplierEditing, phone: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <input
              className="input"
              type="email"
              value={supplierEditing.email}
              placeholder="sales@example.com"
              onChange={(e) => setSupplierEditing({ ...supplierEditing, email: e.target.value })}
            />
          </Field>
          <Field label="Products Supplied" hint="full">
            <input
              className="input"
              value={supplierEditing.products}
              placeholder="Walnuts, Cashew Nuts"
              onChange={(e) => setSupplierEditing({ ...supplierEditing, products: e.target.value })}
            />
          </Field>
          <Field label="City">
            <input
              className="input"
              value={supplierEditing.city}
              placeholder="e.g. Rajshahi"
              onChange={(e) => setSupplierEditing({ ...supplierEditing, city: e.target.value })}
            />
          </Field>
          <Field label="Rating">
            <input
              className="input"
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={supplierEditing.rating}
              onChange={(e) => setSupplierEditing({ ...supplierEditing, rating: Number(e.target.value) })}
            />
          </Field>
          <div className="full">
            <label className="editor-toggle">
              <Toggle
                checked={supplierEditing.active}
                onChange={(v) => setSupplierEditing({ ...supplierEditing, active: v })}
                label="Supplier active"
              />
              Supplier is currently active
            </label>
          </div>
        </ModalShell>
      )}

      {poEditing && (
        <ModalShell
          kicker="Purchase Order Editor"
          title={poEditing.id ? `Edit ${poEditing.number}` : 'New Purchase Order'}
          onClose={() => setPoEditing(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setPoEditing(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={savePORecord}>
                Save Order
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
          <Field label="PO Number">
            <input
              className="input"
              value={poEditing.number}
              onChange={(e) => setPoEditing({ ...poEditing, number: e.target.value })}
            />
          </Field>
          <Field label="Supplier">
            <select
              className="input"
              value={poEditing.supplier}
              onChange={(e) => setPoEditing({ ...poEditing, supplier: e.target.value })}
            >
              <option value="">Select supplier</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Line Items">
            <input
              className="input"
              type="number"
              min="0"
              value={poEditing.items}
              onChange={(e) => setPoEditing({ ...poEditing, items: Number(e.target.value) })}
            />
          </Field>
          <Field label="Total (৳)">
            <input
              className="input"
              type="number"
              min="0"
              value={poEditing.total}
              onChange={(e) => setPoEditing({ ...poEditing, total: Number(e.target.value) })}
            />
          </Field>
          <Field label="Status">
            <select
              className="input"
              value={poEditing.status}
              onChange={(e) => setPoEditing({ ...poEditing, status: e.target.value })}
            >
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="Received">Received</option>
            </select>
          </Field>
          <Field label="Ordered Date">
            <input
              className="input"
              type="date"
              value={poEditing.ordered_at || ''}
              onChange={(e) => setPoEditing({ ...poEditing, ordered_at: e.target.value })}
            />
          </Field>
        </ModalShell>
      )}
    </div>
  );
}
