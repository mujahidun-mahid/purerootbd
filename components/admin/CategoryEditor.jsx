'use client';
import { useEffect, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { Field } from './ui';

function buildState(category) {
  if (!category) {
    return { name: '', slug: '', icon: '📦', description: '', image: '', active: true, featured: true };
  }
  return {
    name: category.name || '',
    slug: category.slug || '',
    icon: category.icon || '📦',
    description: category.description || '',
    image: category.image || '',
    active: category.active !== false,
    featured: category.featured !== false
  };
}

function slugify(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function CategoryEditor({ category, saving, onClose, onSave, error }) {
  const [form, setForm] = useState(() => buildState(category));
  const [slugTouched, setSlugTouched] = useState(Boolean(category));
  const [localError, setLocalError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [previewSrc, setPreviewSrc] = useState('');
  const previewTimer = useRef(null);
  const fileRef = useRef(null);

  const isNew = !category;

  useEffect(() => {
    setForm(buildState(category));
    setSlugTouched(Boolean(category));
    setLocalError('');
    setUploadError('');
  }, [category]);

  useEffect(() => {
    const value = String(form.image || '').trim();
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      const usable = /^https?:\/\/\S+\.\S+/i.test(value) || value.startsWith('data:image/');
      setPreviewSrc(usable ? value : '');
    }, 400);
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, [form.image]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

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
      set('image', data.url);
      setPreviewSrc(data.url);
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const submit = async () => {
    const name = String(form.name || '').trim();
    if (!name) return setLocalError('Category name is required.');
    const slug = slugTouched ? slugify(form.slug) : slugify(name);
    if (!slug) return setLocalError('Could not build a URL slug from this name.');

    const payload = {
      slug,
      name,
      icon: form.icon || '📦',
      description: form.description || '',
      image: String(form.image || '').trim(),
      active: form.active !== false,
      featured: form.featured !== false
    };
    const result = await onSave(payload, isNew);
    if (result && result.ok === false) setLocalError(result.error);
  };

  const message = localError || error;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="detail-modal category-editor" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="admin-kicker">{isNew ? 'New category' : 'Editing category'}</div>
        <h2>{isNew ? 'Add Category' : category.name}</h2>
        <p className="muted">
          Categories appear on the home page (featured) and in the shop filters.
        </p>

        <div className="editor-grid">
          <Field label="Category image" hint="full">
            <div className="img-row">
              <input
                className="input"
                type="url"
                placeholder="https://…/category-image.jpg"
                value={form.image}
                onChange={(e) => set('image', e.target.value)}
              />
              <button
                type="button"
                className="btn btn-outline"
                disabled={uploading}
                onClick={() => fileRef.current && fileRef.current.click()}
              >
                <Upload size={14} /> {uploading ? 'Uploading…' : 'Upload from device'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                style={{ display: 'none' }}
                onChange={(e) => uploadFile(e.target.files && e.target.files[0])}
              />
            </div>
            {uploadError && <div className="admin-alert error">{uploadError}</div>}
          </Field>

          <div className="editor-preview full">
            {previewSrc ? (
              <img src={previewSrc} alt={form.name || 'Category preview'} />
            ) : (
              <span className="cat-emoji-preview">{form.icon || '📦'}</span>
            )}
          </div>

          <Field label="Category name">
            <input
              className="input"
              value={form.name}
              placeholder="Premium Nuts"
              onChange={(e) => set('name', e.target.value)}
            />
          </Field>

          <Field label="URL slug">
            <input
              className="input"
              value={slugTouched ? form.slug : slugify(form.name)}
              placeholder="premium-nuts"
              onChange={(e) => {
                setSlugTouched(true);
                set('slug', e.target.value);
              }}
            />
          </Field>

          <Field label="Icon (emoji)">
            <input
              className="input"
              value={form.icon}
              maxLength={4}
              placeholder="📦"
              onChange={(e) => set('icon', e.target.value)}
            />
          </Field>

          <Field label="Description" hint="full">
            <textarea
              className="input textarea"
              rows="2"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>

          <div className="full editor-toggles">
            <label className="check editor-toggle">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set('active', e.target.checked)}
              />
              Active — visible in shop &amp; filters
            </label>
            <label className="check editor-toggle">
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => set('featured', e.target.checked)}
              />
              Featured — shown in home page “Featured Categories”
            </label>
          </div>
        </div>

        {message && <div className="admin-alert error">{message}</div>}

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Add Category' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
