'use client';
import { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, FolderCog } from 'lucide-react';
import { Field } from './ui';

export const SUGGESTED_CATEGORIES = [
  'Orders & Products',
  'Payment Methods',
  'Delivery & Shipping',
  'Returns & Refunds',
  'Account & Support',
];

const EMPTY_ITEM = { question: '', answer: '', category: 'General', enabled: true };

function normalizeItems(items) {
  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (!Array.isArray(items)) return [];
  return items.map((it, i) => ({
    question: it.question || '',
    answer: it.answer || '',
    category: (it.category || '').trim() || 'General',
    enabled: it.enabled !== false,
    order: it.order ?? i,
  }));
}

function categoriesOf(items) {
  const map = new Map();
  items.forEach((it) => {
    const cat = (it.category || '').trim() || 'General';
    map.set(cat, (map.get(cat) || 0) + 1);
  });
  return [...map.entries()].map(([name, count]) => ({ name, count }));
}

export default function FaqItemsEditor({ items, onChange }) {
  const list = normalizeItems(items);
  const [editing, setEditing] = useState(-1);
  const [form, setForm] = useState({ ...EMPTY_ITEM });
  const [showCats, setShowCats] = useState(false);
  const [renameFrom, setRenameFrom] = useState('');
  const [renameTo, setRenameTo] = useState('');
  const [deleteCat, setDeleteCat] = useState('');
  const [reassignTo, setReassignTo] = useState('');
  const cats = categoriesOf(list);

  const emit = (next) => onChange(next.map((it, i) => ({ ...it, order: i })));

  const startAdd = () => {
    setEditing(list.length);
    setForm({ ...EMPTY_ITEM, category: cats[0]?.name || 'General' });
  };

  const startEdit = (index) => {
    setEditing(index);
    setForm({ ...EMPTY_ITEM, ...list[index] });
  };

  const saveItem = () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    const next = [...list];
    next[editing] = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      category: (form.category || '').trim() || 'General',
      enabled: form.enabled !== false,
      order: editing,
    };
    emit(next);
    setEditing(-1);
  };

  const removeItem = (index) => {
    if (!window.confirm(`Delete this question?\n\n"${list[index].question}"\n\nThis cannot be undone.`)) return;
    emit(list.filter((_, i) => i !== index));
    setEditing(-1);
  };

  const moveItem = (index, dir) => {
    const next = [...list];
    const to = index + dir;
    if (to < 0 || to >= next.length) return;
    const [moved] = next.splice(index, 1);
    next.splice(to, 0, moved);
    emit(next);
    setEditing(-1);
  };

  const toggleItem = (index) => {
    emit(list.map((it, i) => (i === index ? { ...it, enabled: !it.enabled } : it)));
  };

  const renameCategory = () => {
    const to = renameTo.trim();
    if (!renameFrom || !to || renameFrom === to) return;
    emit(list.map((it) => ((it.category || '').trim() || 'General') === renameFrom ? { ...it, category: to } : it));
    setRenameFrom('');
    setRenameTo('');
  };

  const deleteCategory = () => {
    if (!deleteCat) return;
    const remaining = list.filter((it) => ((it.category || '').trim() || 'General') !== deleteCat);
    if (remaining.length === list.length) return;
    if (!reassignTo) {
      if (!window.confirm(`Delete category "${deleteCat}" and its ${list.length - remaining.length} question(s)? This cannot be undone.`)) return;
      emit(remaining);
    } else {
      emit(list.map((it) => ((it.category || '').trim() || 'General') === deleteCat ? { ...it, category: reassignTo } : it));
    }
    setDeleteCat('');
    setReassignTo('');
  };

  return (
    <div className="faq-editor">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <strong>Questions ({list.length})</strong>
        <button type="button" className="btn btn-outline btn-sm" onClick={startAdd}>
          <Plus size={14} /> Add Question
        </button>
      </div>

      {list.length === 0 && (
        <p className="muted">No questions yet. Add the first one above.</p>
      )}

      {list.map((it, i) => {
        const isEditing = editing === i;
        return (
          <div key={i} className="faq-editor-row" style={{ border: '1px solid var(--border)', borderRadius: 10, marginBottom: 8, background: it.enabled ? 'var(--card)' : 'var(--bg)', opacity: it.enabled ? 1 : 0.65 }}>
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 12px', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}>
                  {it.question || <em className="muted">Untitled</em>}
                </strong>
                <span style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <span className="pill" style={{ fontSize: 11 }}>{it.category}</span>
                  <span className={`pill ${it.enabled ? 'pill-on' : 'pill-off'}`} style={{ fontSize: 11 }}>{it.enabled ? 'Published' : 'Hidden'}</span>
                </span>
              </div>
              {!isEditing ? (
                <>
                  <button type="button" className="icon-action" onClick={() => moveItem(i, -1)} title="Move up" disabled={i === 0}><ChevronUp size={16} /></button>
                  <button type="button" className="icon-action" onClick={() => moveItem(i, 1)} title="Move down" disabled={i === list.length - 1}><ChevronDown size={16} /></button>
                  <button type="button" className="icon-action" onClick={() => toggleItem(i)} title={it.enabled ? 'Hide' : 'Publish'}>{it.enabled ? <Eye size={16} /> : <EyeOff size={16} />}</button>
                  <button type="button" className="icon-action" onClick={() => startEdit(i)} title="Edit"><Pencil size={16} /></button>
                  <button type="button" className="icon-action danger" onClick={() => removeItem(i)} title="Delete"><Trash2 size={16} /></button>
                </>
              ) : (
                <button type="button" className="btn btn-primary btn-sm" onClick={saveItem}>Save</button>
              )}
            </div>
            {isEditing && (
              <div style={{ padding: 14, borderTop: '1px solid var(--border)', background: 'var(--bg)', display: 'grid', gap: 12 }}>
                <Field label="Question *">
                  <input className="input" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="What do customers ask?" />
                </Field>
                <Field label="Answer *" hint="full">
                  <textarea className="input" rows={4} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Clear, helpful answer…" />
                </Field>
                <Field label="Category">
                  <input
                    className="input"
                    value={form.category}
                    list="faq-category-suggestions"
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="e.g. Delivery & Shipping"
                  />
                  <datalist id="faq-category-suggestions">
                    {SUGGESTED_CATEGORIES.concat(cats.map((c) => c.name)).filter((v, idx, arr) => arr.indexOf(v) === idx).map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Visible on site">
                  <label className="editor-toggle">
                    <input type="checkbox" checked={form.enabled !== false} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
                    Published
                  </label>
                </Field>
              </div>
            )}
          </div>
        );
      })}

      <div style={{ marginTop: 14 }}>
        <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowCats((v) => !v)}>
          <FolderCog size={14} /> Manage Categories ({cats.length})
        </button>
        {showCats && (
          <div style={{ marginTop: 10, border: '1px dashed var(--border)', borderRadius: 10, padding: 12, display: 'grid', gap: 12 }}>
            <div>
              <strong style={{ fontSize: 13 }}>Current categories</strong>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                {cats.length ? cats.map((c) => (
                  <span key={c.name} className="pill">{c.name} · {c.count}</span>
                )) : <span className="muted">None yet</span>}
              </div>
            </div>
            <Field label="Rename category">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select className="input" value={renameFrom} onChange={(e) => setRenameFrom(e.target.value)} style={{ flex: 1, minWidth: 140 }}>
                  <option value="">From…</option>
                  {cats.map((c) => <option key={c.name} value={c.name}>{c.name} ({c.count})</option>)}
                </select>
                <input className="input" value={renameTo} onChange={(e) => setRenameTo(e.target.value)} placeholder="To…" style={{ flex: 1, minWidth: 140 }} />
                <button type="button" className="btn btn-outline btn-sm" onClick={renameCategory} disabled={!renameFrom || !renameTo.trim()}>Rename</button>
              </div>
            </Field>
            <Field label="Delete category (reassign or remove its questions)">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <select className="input" value={deleteCat} onChange={(e) => setDeleteCat(e.target.value)} style={{ flex: 1, minWidth: 140 }}>
                  <option value="">Category…</option>
                  {cats.map((c) => <option key={c.name} value={c.name}>{c.name} ({c.count})</option>)}
                </select>
                <select className="input" value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} style={{ flex: 1, minWidth: 140 }}>
                  <option value="">Delete its questions</option>
                  {cats.filter((c) => c.name !== deleteCat).map((c) => <option key={c.name} value={c.name}>Move to {c.name}</option>)}
                </select>
                <button type="button" className="btn btn-outline btn-sm" onClick={deleteCategory} disabled={!deleteCat} style={{ color: 'var(--danger)' }}>Delete</button>
              </div>
            </Field>
          </div>
        )}
      </div>
    </div>
  );
}
