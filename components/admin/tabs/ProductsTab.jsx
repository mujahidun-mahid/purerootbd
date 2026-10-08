'use client';
import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import DataTable from '../DataTable';
import { Alert, SearchField } from '../ui';
import { catIcon, money } from '../constants';
import useAdminProducts from '../useAdminProducts';
import ProductEditor from '../ProductEditor';

export default function ProductsTab({ password }) {
  const { items, loading, saving, error, setError, save, remove } = useAdminProducts(password);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) =>
      [p.name, p.slug, p.category, p.short].join(' ').toLowerCase().includes(q)
    );
  }, [items, query]);

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

  const columns = [
    {
      key: 'art',
      header: '',
      render: (p) => (
        <div className="catalog-art">
          {p.image ? <img src={p.image} alt="" /> : catIcon(p.category)}
        </div>
      )
    },
    {
      key: 'name',
      header: 'Product',
      render: (p) => (
        <div className="cell-product">
          <strong>{p.name}</strong>
          <small>/{p.slug}</small>
        </div>
      )
    },
    {
      key: 'category',
      header: 'Category',
      render: (p) => <span className="cell-muted">{catIcon(p.category)} {p.category}</span>
    },
    {
      key: 'packages',
      header: 'Quantities',
      render: (p) => (
        <span className="cell-muted">
          {(p.packages || []).map((x) => x.size).join(', ') || '—'}
        </span>
      )
    },
    {
      key: 'price',
      header: 'Price',
      render: (p) => (
        <div className="cell-price">
          <strong>{money(p.price)}</strong>
          {p.old_price != null && <s>{money(p.old_price)}</s>}
        </div>
      )
    },
    {
      key: 'stock',
      header: 'Stock',
      render: (p) => <span className="cell-muted">{Number(p.stock || 0)}</span>
    },
    {
      key: 'status',
      header: 'Status',
      render: (p) =>
        p.active === false ? (
          <span className="pill pill-off">Hidden</span>
        ) : (
          <span className="pill pill-on">Active</span>
        )
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (p) => (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => startEdit(p)}>
            <Pencil size={13} /> Edit
          </button>
          <button type="button" className="btn btn-outline btn-sm danger" onClick={() => onDelete(p)}>
            <Trash2 size={13} /> Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <div>
          <span className="admin-kicker">Product Manager</span>
          <h2>Products {items.length > 0 && <em>({items.length})</em>}</h2>
        </div>
        <div className="admin-toolbar-right">
          <SearchField value={query} onChange={setQuery} placeholder="Search products…" />
          <button type="button" className="btn btn-primary" onClick={startAdd}>
            <Plus size={15} /> Add Product
          </button>
        </div>
      </div>

      {notice && <Alert type="success" onClose={() => setNotice('')}>{notice}</Alert>}
      {error && !editing && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        minWidth={860}
        emptyText={loading ? 'Loading products…' : 'No products yet.'}
        filtered={Boolean(query.trim())}
        emptyFilteredText="No products match your search."
        emptyIcon={Plus}
      />

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
