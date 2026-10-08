'use client';
import { useState } from 'react';
import { Database, Package, Pencil, Plus, Trash2 } from 'lucide-react';
import { Alert } from '../ui';
import { catIcon, money } from '../constants';
import useAdminProducts from '../useAdminProducts';
import ProductEditor from '../ProductEditor';

export default function CatalogTab({ password }) {
  const { items, loading, saving, error, setError, save, remove } = useAdminProducts(password);
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');

  const categories = [...new Set(items.map((p) => p.category))].length;

  const startAdd = () => {
    setNotice('');
    setError('');
    setEditing({ __new: true });
  };

  const startEdit = (p) => {
    setNotice('');
    setError('');
    setEditing(p);
  };

  const onSave = async (payload, isNew) => {
    const result = await save(payload, isNew);
    if (result.ok) {
      setNotice(isNew ? `"${payload.name}" added to the storefront.` : `"${payload.name}" updated.`);
      setEditing(null);
    }
    return result;
  };

  const onDelete = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? It will be removed from the storefront.`)) return;
    const result = await remove(p.id);
    if (result.ok) setNotice(`"${p.name}" deleted.`);
  };

  return (
    <div className="admin-content">
      <div className="admin-live-banner">
        <div>
          <Package size={16} /> Storefront Product Catalog
        </div>
        <span>
          {loading
            ? 'Loading catalog…'
            : `${items.length} Products across ${categories} Categories`}
        </span>
        <button type="button" className="btn btn-primary" onClick={startAdd}>
          <Plus size={15} /> Add Product
        </button>
      </div>

      {notice && <Alert type="success" onClose={() => setNotice('')}>{notice}</Alert>}
      {error && !editing && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <div className="catalog-grid">
        {items.map((p) => (
          <div className="catalog-card" key={p.id}>
            <div className="catalog-art">
              {p.image ? <img src={p.image} alt="" /> : catIcon(p.category)}
            </div>
            <div>
              <strong>{p.name}</strong>
              <span>
                {money(p.price)} • {(p.packages || []).map((x) => x.size).join(', ')}
              </span>
              <span className={p.active === false ? 'pill pill-off' : 'pill pill-on'}>
                {p.active === false ? 'Hidden' : 'Active'}
              </span>
            </div>
            <div className="row-actions">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => startEdit(p)}>
                <Pencil size={13} /> Edit
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm danger"
                onClick={() => onDelete(p)}
              >
                <Trash2 size={13} />
              </button>
            </div>
          </div>
        ))}

        {!items.length && !loading && (
          <div className="empty">
            <Package size={20} />
            <span>No products yet. Use “Add Product” to create the first one.</span>
          </div>
        )}
      </div>

      <div className="admin-note">
        <Database size={18} />
        <div>
          <strong>Catalog Architecture</strong>
          <p>
            Products are stored in Supabase and served live to the storefront. Image, name,
            quantities, stock and price can be edited here — changes publish immediately.
          </p>
        </div>
      </div>

      {editing && (
        <ProductEditor
          product={editing.__new ? null : editing}
          saving={saving}
          error={error}
          onClose={() => setEditing(null)}
          onSave={onSave}
        />
      )}
    </div>
  );
}
