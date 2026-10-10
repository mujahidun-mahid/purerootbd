'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, Pencil, Plus, Trash2, Upload, ArrowUp, ArrowDown } from 'lucide-react';
import DataTable from '../DataTable';
import { Alert, Field } from '../ui';
import { formatDateTime } from '../constants';

const EMPTY = {
  title: '',
  description: '',
  discount_text: '',
  background_image: '',
  background_color: '#FFFDF9',
  button_text: 'Shop Now',
  button_link: '/shop',
  display_order: 0,
  is_active: true,
};

export default function PromoCardsTab({ password }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...EMPTY });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef(null);

  const authHeaders = () => ({ 'x-admin-password': password, 'content-type': 'application/json' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/promo-cards', { headers: { 'x-admin-password': password } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to load promo cards');
      setCards(data.cards || []);
    } catch (e) {
      setNotice({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing('new');
    setForm({ ...EMPTY, display_order: cards.length + 1 });
    setUploadError('');
  };

  const openEdit = (card) => {
    setEditing(card.id);
    setForm({ ...EMPTY, ...card });
    setUploadError('');
  };

  const closeEditor = () => {
    setEditing(null);
    setForm({ ...EMPTY });
    setUploadError('');
  };

  const saveCard = async () => {
    if (!form.title.trim()) return setNotice({ type: 'error', text: 'Title is required.' });
    setSaving(true);
    setNotice(null);
    try {
      const isNew = editing === 'new';
      const res = await fetch(isNew ? '/api/admin/promo-cards' : `/api/admin/promo-cards/${editing}`, {
        method: isNew ? 'POST' : 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ ...form, title: form.title.trim(), display_order: Number(form.display_order) || 0 }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save promo card');
      setNotice({ type: 'success', text: isNew ? 'Promo card created.' : 'Promo card updated.' });
      closeEditor();
      load();
    } catch (e) {
      setNotice({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const deleteCard = async (card) => {
    if (!window.confirm(`Delete promo card "${card.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/promo-cards/${card.id}`, { method: 'DELETE', headers: { 'x-admin-password': password } });
      if (!res.ok) throw new Error('Failed to delete promo card');
      setNotice({ type: 'success', text: 'Promo card deleted.' });
      load();
    } catch (e) {
      setNotice({ type: 'error', text: e.message });
    }
  };

  const toggleActive = async (card) => {
    try {
      const res = await fetch(`/api/admin/promo-cards/${card.id}`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ is_active: !card.is_active }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setNotice({ type: 'success', text: `"${card.title}" is now ${!card.is_active ? 'active' : 'hidden'}.` });
      load();
    } catch (e) {
      setNotice({ type: 'error', text: e.message });
    }
  };

  const moveCard = async (card, dir) => {
    const sorted = [...cards].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
    const idx = sorted.findIndex((c) => c.id === card.id);
    const to = idx + dir;
    if (to < 0 || to >= sorted.length) return;
    const [moved] = sorted.splice(idx, 1);
    sorted.splice(to, 0, moved);
    try {
      await Promise.all(
        sorted.map((c, i) =>
          fetch(`/api/admin/promo-cards/${c.id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify({ display_order: i + 1 }),
          })
        )
      );
      setNotice({ type: 'success', text: 'Display order saved.' });
      load();
    } catch (e) {
      setNotice({ type: 'error', text: e.message });
    }
  };

  const uploadFile = async (file) => {
    if (!file) return;
    setUploadError('');
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/images', { method: 'POST', body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Upload failed.');
      setForm((f) => ({ ...f, background_image: data.url }));
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <div>
          <div className="admin-kicker">Homepage Content</div>
          <h2>Promotional Banner Cards <em>({cards.length})</em></h2>
        </div>
        <div className="admin-toolbar-right">
          <button type="button" className="btn btn-primary" onClick={openAdd}>
            <Plus size={15} /> Add Card
          </button>
        </div>
      </div>

      {notice && <Alert type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Alert>}

      <DataTable
        columns={[
          {
            key: 'thumb', header: 'Graphic',
            render: (c) => c.background_image
              ? <img src={c.background_image} alt="" style={{ width: 64, height: 40, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--a-line-soft)' }} />
              : <span className="promo-thumb-fallback" style={{ background: c.background_color || '#F7FAF7' }}>✦</span>,
          },
          { key: 'title', header: 'Title', render: (c) => <strong>{c.title || '—'}</strong> },
          { key: 'discount', header: 'Badge', render: (c) => <span>{c.discount_text || '—'}</span> },
          { key: 'link', header: 'Link', render: (c) => <span className="muted">{c.button_link || '—'}</span> },
          { key: 'order', header: 'Order', render: (c) => <span>{c.display_order ?? 0}</span> },
          { key: 'status', header: 'Status', render: (c) => <span className={`pill ${c.is_active ? 'pill-on' : 'pill-off'}`}>{c.is_active ? 'Active' : 'Hidden'}</span> },
          { key: 'updated', header: 'Updated', render: (c) => (c.updated_at ? formatDateTime(c.updated_at) : '—') },
          {
            key: 'actions', header: '', align: 'right',
            render: (c) => (
              <span className="row-actions">
                <button type="button" className="icon-action" onClick={() => moveCard(c, -1)} title="Move up"><ArrowUp size={16} /></button>
                <button type="button" className="icon-action" onClick={() => moveCard(c, 1)} title="Move down"><ArrowDown size={16} /></button>
                <button type="button" className="icon-action" onClick={() => toggleActive(c)} title={c.is_active ? 'Hide' : 'Show'}>{c.is_active ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                <button type="button" className="icon-action" onClick={() => openEdit(c)} title="Edit"><Pencil size={16} /></button>
                <button type="button" className="icon-action danger" onClick={() => deleteCard(c)} title="Delete"><Trash2 size={16} /></button>
              </span>
            ),
          },
        ]}
        rows={[...cards].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))}
        rowKey={(c) => c.id}
        emptyText="No promo cards yet. Add your first banner card."
        loading={loading}
        pageSize={20}
      />

      {editing && (
        <div className="modal-backdrop" onClick={closeEditor}>
          <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={closeEditor} aria-label="Close">×</button>
            <div className="admin-kicker">{editing === 'new' ? 'New Card' : 'Edit Card'}</div>
            <h2>{editing === 'new' ? 'Add Promo Card' : form.title}</h2>
            <div className="editor-grid">
              <Field label="Title *" hint="full">
                <input className="input" value={form.title} onChange={set('title')} placeholder="Purely Fresh Vegetables" />
              </Field>
              <Field label="Description" hint="full">
                <input className="input" value={form.description} onChange={set('description')} placeholder="Short supporting text" />
              </Field>
              <Field label="Discount Badge Text">
                <input className="input" value={form.discount_text} onChange={set('discount_text')} placeholder="Flat 20% Discount" />
              </Field>
              <Field label="Button Label">
                <input className="input" value={form.button_text} onChange={set('button_text')} placeholder="Shop Now" />
              </Field>
              <Field label="Button Link" hint="full">
                <input className="input" value={form.button_link} onChange={set('button_link')} placeholder="/category/vegetables" />
              </Field>
              <Field label="Background Graphic" hint="full">
                <div className="img-row">
                  <input className="input" type="url" value={form.background_image} onChange={set('background_image')} placeholder="https://…/promo.jpg" />
                  <button type="button" className="btn btn-outline" disabled={uploading} onClick={() => fileRef.current && fileRef.current.click()}>
                    <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload'}
                  </button>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml" style={{ display: 'none' }} onChange={(e) => uploadFile(e.target.files && e.target.files[0])} />
                </div>
                {uploadError && <div className="admin-alert error">{uploadError}</div>}
              </Field>
              {form.background_image && (
                <div className="editor-preview full">
                  <img src={form.background_image} alt="Promo preview" />
                </div>
              )}
              <Field label="Background Tint">
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input type="color" value={/^#[0-9a-fA-F]{6}$/.test(form.background_color) ? form.background_color : '#FFFDF9'} onChange={set('background_color')} aria-label="Pick background tint" style={{ width: 44, height: 38, padding: 2 }} />
                  <input className="input" value={form.background_color} onChange={set('background_color')} placeholder="#FFFDF9" />
                </div>
              </Field>
              <Field label="Display Order">
                <input className="input" type="number" min="0" value={form.display_order} onChange={set('display_order')} />
              </Field>
              <Field label="Visible on storefront" hint="full">
                <label className="check editor-toggle">
                  <input type="checkbox" checked={form.is_active !== false} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} />
                  Active
                </label>
              </Field>
            </div>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={closeEditor}>Cancel</button>
              <button type="button" className="btn btn-primary" onClick={saveCard} disabled={saving}>
                {saving ? 'Saving…' : editing === 'new' ? 'Create Card' : 'Update Card'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
