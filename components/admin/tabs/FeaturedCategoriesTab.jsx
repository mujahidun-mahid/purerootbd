'use client';
import { useMemo, useRef, useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import DataTable from '../DataTable';
import { Alert, SearchField } from '../ui';
import { money } from '../constants';
import useAdminCategories from '../useAdminCategories';
import CategoryEditor from '../CategoryEditor';

export default function FeaturedCategoriesTab({ password }) {
  const { items, loading, saving, error, setError, save, patch, remove, reorder } =
    useAdminCategories(password);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null);
  const [notice, setNotice] = useState('');
  const [sortOrder, setSortOrder] = useState([]);
  const dragSlug = useRef(null);

  const sorted = useMemo(() => {
    if (sortOrder.length) {
      const pos = new Map(sortOrder.map((slug, i) => [slug, i]));
      return [...items].sort((a, b) => (pos.get(a.slug) ?? 999) - (pos.get(b.slug) ?? 999));
    }
    return [...items].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  }, [items, sortOrder]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((c) => [c.name, c.slug, c.description].join(' ').toLowerCase().includes(q));
  }, [sorted, query]);

  const startDrag = (slug) => (e) => {
    dragSlug.current = slug;
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', slug); } catch {}
  };

  const allowDrop = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = async (targetSlug, e) => {
    e.preventDefault();
    const sourceSlug = dragSlug.current || e.dataTransfer.getData('text/plain');
    dragSlug.current = null;
    if (!sourceSlug || sourceSlug === targetSlug) return;
    const list = [...sorted];
    const from = list.findIndex((c) => c.slug === sourceSlug);
    const to = list.findIndex((c) => c.slug === targetSlug);
    if (from < 0 || to < 0) return;
    const [moved] = list.splice(from, 1);
    list.splice(to, 0, moved);
    setSortOrder(list.map((c) => c.slug));
    const result = await reorder(list.map((c, i) => ({ slug: c.slug, sort_order: i + 1 })));
    if (result.ok) {
      setSortOrder([]);
      setNotice('Category display order saved.');
    }
  };

  const rowProps = (c) => ({
    draggable: true,
    onDragStart: startDrag(c.slug),
    onDragOver: allowDrop,
    onDrop: (e) => onDrop(c.slug, e),
    className: 'drag-row'
  });

  const toggleActive = async (c) => {
    const result = await patch(c.slug, { active: c.active === false });
    if (result.ok) setNotice(`“${c.name}” is now ${c.active === false ? 'active' : 'hidden'}.`);
  };

  const toggleFeatured = async (c) => {
    const result = await patch(c.slug, { featured: c.featured === false });
    if (result.ok)
      setNotice(`“${c.name}” ${c.featured === false ? 'added to' : 'removed from'} Featured Categories.`);
  };

  const startAdd = () => {
    setNotice('');
    setError('');
    setEditing({ __new: true });
  };

  const startEdit = (c) => {
    setNotice('');
    setError('');
    setEditing(c);
  };

  const onSave = async (payload, isNew) => {
    const result = await save(payload, isNew);
    if (result.ok) {
      setNotice(isNew ? `“${payload.name}” added.` : `“${payload.name}” updated.`);
      setEditing(null);
    }
    return result;
  };

  const onDelete = async (c) => {
    if (!window.confirm(`Delete category “${c.name}”? Products keep their category slug.`)) return;
    const result = await remove(c.slug);
    if (result.ok) setNotice(`“${c.name}” deleted.`);
  };

  const featuredCount = items.filter((c) => c.featured !== false && c.active !== false).length;

  const columns = [
    {
      key: 'handle',
      header: '',
      headerClassName: 'col-drag',
      className: 'col-drag',
      render: () => (
        <span className="drag-handle" title="Drag to reorder" aria-label="Drag to reorder">
          ⠿
        </span>
      )
    },
    {
      key: 'art',
      header: '',
      render: (c) => (
        <div className="catalog-art">
          {c.image ? <img src={c.image} alt="" /> : <span className="cat-emoji">{c.icon || '📦'}</span>}
        </div>
      )
    },
    {
      key: 'name',
      header: 'Category',
      render: (c) => (
        <div className="cell-product">
          <strong>{c.name}</strong>
          <small>/{c.slug}</small>
        </div>
      )
    },
    {
      key: 'description',
      header: 'Description',
      render: (c) => <span className="cell-muted">{c.description || '—'}</span>
    },
    {
      key: 'featured',
      header: 'Featured',
      render: (c) => (
        <button
          type="button"
          className={`pill ${c.featured !== false ? 'pill-star' : 'pill-off'}`}
          title={c.featured !== false ? 'On home page — click to remove' : 'Click to feature on home page'}
          onClick={(e) => {
            e.stopPropagation();
            toggleFeatured(c);
          }}
        >
          <Star size={12} /> {c.featured !== false ? 'Featured' : 'Not featured'}
        </button>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <button
          type="button"
          className={`pill ${c.active !== false ? 'pill-on' : 'pill-off'}`}
          onClick={(e) => {
            e.stopPropagation();
            toggleActive(c);
          }}
        >
          {c.active !== false ? <Eye size={12} /> : <EyeOff size={12} />}
          {c.active !== false ? 'Active' : 'Inactive'}
        </button>
      )
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (c) => (
        <div className="row-actions" onClick={(e) => e.stopPropagation()}>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => startEdit(c)}>
            <Pencil size={13} /> Edit
          </button>
          <button type="button" className="btn btn-outline btn-sm danger" onClick={() => onDelete(c)}>
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
          <span className="admin-kicker">Storefront Categories</span>
          <h2>Featured Categories {items.length > 0 && <em>({items.length})</em>}</h2>
          <p className="muted admin-sub">
            {featuredCount} featured on the home page · drag rows to control display order
          </p>
        </div>
        <div className="admin-toolbar-right">
          <SearchField value={query} onChange={setQuery} placeholder="Search categories…" />
          <button type="button" className="btn btn-primary" onClick={startAdd}>
            <Plus size={15} /> Add Category
          </button>
        </div>
      </div>

      {notice && <Alert type="success" onClose={() => setNotice('')}>{notice}</Alert>}
      {error && !editing && <Alert type="error" onClose={() => setError('')}>{error}</Alert>}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(c) => c.slug}
        rowProps={rowProps}
        minWidth={820}
        emptyText={loading ? 'Loading categories…' : 'No categories yet.'}
        filtered={Boolean(query.trim())}
        emptyFilteredText="No categories match your search."
        emptyIcon={Plus}
      />

      {editing && (
        <CategoryEditor
          category={editing.__new ? null : editing}
          saving={saving}
          error={error}
          onClose={() => setEditing(null)}
          onSave={onSave}
        />
      )}
    </div>
  );
}
