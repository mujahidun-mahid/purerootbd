'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, ImageIcon } from 'lucide-react';
import useCategories from '@/components/useCategories';
import { Field } from './ui';
import { adminHeaders } from './csrf';

function galleryOf(product) {
  if (!product) return [];
  if (Array.isArray(product.images) && product.images.length) {
    return product.images.filter((u) => String(u || '').trim() !== '');
  }
  return product.image ? [product.image] : [];
}

function buildState(product) {
  if (!product) {
    return {
      name: '',
      slug: '',
      category: 'nuts',
      price: '',
      oldPrice: '',
      stock: '',
      image: '',
      images: [],
      short: '',
      description: '',
      ingredients: '',
      nutrition: '',
      benefits: '',
      use: '',
      storage: '',
      related: [],
      active: true,
      packages: [
        { size: '250g', price: '' },
        { size: '500g', price: '' }
      ]
    };
  }
  return {
    name: product.name || '',
    slug: product.slug || '',
    category: product.category || 'nuts',
    price: product.price ?? '',
    oldPrice: product.oldPrice ?? product.old_price ?? '',
    stock: product.stock ?? '',
    image: product.image || '',
    images: galleryOf(product),
    short: product.short || '',
    description: product.description || '',
    ingredients: product.ingredients || '',
    nutrition: product.nutrition || '',
    benefits: product.benefits || '',
    use: product.use || '',
    storage: product.storage || '',
    related: Array.isArray(product.related) ? product.related : [],
    active: product.active !== false,
    packages: (product.packages || []).map((p) => ({ size: p.size, price: p.price }))
  };
}

function slugify(value) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function ProductEditor({ product, saving, onClose, onSave, error }) {
  const [form, setForm] = useState(() => buildState(product));
  const { items: categories } = useCategories({ all: true });
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [localError, setLocalError] = useState('');

  const isNew = !product;
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    setForm(buildState(product));
    setSlugTouched(Boolean(product));
    setLocalError('');
    setUrlInput('');
  }, [product]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const gallery = Array.isArray(form.images) ? form.images : [];

  const pushImages = (urls) => {
    const clean = urls.map((u) => String(u || '').trim()).filter(Boolean);
    if (!clean.length) return;
    setForm((f) => {
      const next = [...(Array.isArray(f.images) ? f.images : []), ...clean];
      return { ...f, images: next, image: next[0] || '' };
    });
  };

  const moveImage = (index, dir) => {
    setForm((f) => {
      const next = [...(Array.isArray(f.images) ? f.images : [])];
      const to = index + dir;
      if (to < 0 || to >= next.length) return f;
      const [moved] = next.splice(index, 1);
      next.splice(to, 0, moved);
      return { ...f, images: next, image: next[0] || '' };
    });
  };

  const setCover = (index) => {
    setForm((f) => {
      const next = [...(Array.isArray(f.images) ? f.images : [])];
      if (index <= 0 || index >= next.length) return f;
      const [picked] = next.splice(index, 1);
      next.unshift(picked);
      return { ...f, images: next, image: next[0] || '' };
    });
  };

  const removeImage = (index) => {
    if (!window.confirm('Remove this image from the gallery?')) return;
    setForm((f) => {
      const next = (Array.isArray(f.images) ? f.images : []).filter((_, i) => i !== index);
      return { ...f, images: next, image: next[0] || '' };
    });
  };

  const addUrl = () => {
    const value = urlInput.trim();
    if (!value) return;
    if (!/^https?:\/\/\S+\.\S+/i.test(value)) {
      setUploadError('That does not look like a valid image URL.');
      return;
    }
    setUploadError('');
    pushImages([value]);
    setUrlInput('');
  };

  const uploadFiles = async (files) => {
    const list = [...(files || [])];
    if (!list.length) return;
    setUploadError('');
    setUploading(true);
    try {
      const urls = [];
      for (const file of list) {
        const fd = new FormData();
        fd.append('file', file);
        const res = await fetch('/api/admin/images', {
          method: 'POST',
          headers: adminHeaders({ json: false }),
          body: fd
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `Upload failed for ${file.name}.`);
        if (data.url) urls.push(data.url);
      }
      pushImages(urls);
    } catch (e) {
      setUploadError(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const shownSlug = useMemo(() => {
    if (!slugTouched) return slugify(form.name);
    return form.slug;
  }, [slugTouched, form.name, form.slug]);

  const setPkg = (index, key, value) =>
    setForm((f) => ({
      ...f,
      packages: f.packages.map((p, i) => (i === index ? { ...p, [key]: value } : p))
    }));

  const addPkg = () => setForm((f) => ({ ...f, packages: [...f.packages, { size: '', price: '' }] }));

  const dropPkg = (index) =>
    setForm((f) => ({ ...f, packages: f.packages.filter((_, i) => i !== index) }));

  const submit = async () => {
    const name = String(form.name || '').trim();
    const price = Number(form.price);
    if (!name) return setLocalError('Product name is required.');
    if (form.price === '' || Number.isNaN(price) || price < 0) {
      return setLocalError('Enter a valid price (number, 0 or more).');
    }
    const slug = slugTouched ? slugify(form.slug) : slugify(name);
    if (!slug) return setLocalError('Could not build a URL slug from this name.');

    const packages = form.packages
      .map((p) => ({ size: String(p.size || '').trim(), price: p.price === '' ? NaN : Number(p.price) }))
      .filter((p) => p.size && !Number.isNaN(p.price));
    if (!packages.length) packages.push({ size: '500g', price });

    const images = (Array.isArray(form.images) ? form.images : [])
      .map((u) => String(u || '').trim())
      .filter(Boolean);

    const payload = {
      id: product?.id,
      name,
      slug,
      category: form.category || 'nuts',
      price,
      oldPrice: form.oldPrice === '' ? null : Number(form.oldPrice),
      stock: form.stock === '' ? 0 : Number(form.stock),
      image: images[0] || '',
      images,
      short: form.short,
      description: form.description,
      ingredients: form.ingredients,
      nutrition: form.nutrition,
      benefits: form.benefits,
      use: form.use,
      storage: form.storage,
      related: form.related,
      active: form.active !== false,
      packages
    };
    const result = await onSave(payload, isNew);
    if (result && result.ok === false) setLocalError(result.error);
  };

  const message = localError || error;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="detail-modal product-editor" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="admin-kicker">{isNew ? 'New product' : 'Editing product'}</div>
        <h2>{isNew ? 'Add Product' : product.name}</h2>
        <p className="muted">
          {isNew
            ? 'It appears on the storefront as soon as you save.'
            : 'Changes go live on the storefront immediately after saving.'}
        </p>

        <div className="editor-grid">
          <Field label={`Product gallery (${gallery.length} image${gallery.length === 1 ? '' : 's'})`} hint="full">
            <div className="img-row">
              <input
                className="input"
                type="url"
                placeholder="https://…/product-image.jpg — paste URL, then Add"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
              />
              <button type="button" className="btn btn-outline" onClick={addUrl}>
                <Plus size={14} /> Add URL
              </button>
              <button
                type="button"
                className="btn btn-outline"
                disabled={uploading}
                onClick={() => fileRef.current && fileRef.current.click()}
              >
                {uploading ? 'Uploading…' : 'Upload from device'}
              </button>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                style={{ display: 'none' }}
                onChange={(e) => uploadFiles(e.target.files)}
              />
            </div>
            {uploadError && <div className="admin-alert error">{uploadError}</div>}
            {gallery.length > 0 ? (
              <div className="gallery-manager">
                {gallery.map((src, i) => (
                  <div key={`${src}-${i}`} className="gallery-thumb">
                    <img src={src} alt={`${form.name || 'Product'} image ${i + 1}`} />
                    {i === 0 && <span className="gallery-cover">Cover</span>}
                    <div className="gallery-thumb-actions">
                      <button type="button" title="Move left" aria-label="Move image left" disabled={i === 0} onClick={() => moveImage(i, -1)}>‹</button>
                      <button type="button" title="Move right" aria-label="Move image right" disabled={i === gallery.length - 1} onClick={() => moveImage(i, 1)}>›</button>
                      {i !== 0 && <button type="button" title="Set as cover" aria-label="Set as cover image" onClick={() => setCover(i)}>★</button>}
                      <button type="button" title="Remove" aria-label="Remove image" onClick={() => removeImage(i)}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="editor-preview full" style={{ marginTop: 10 }}>
                <span>
                  <ImageIcon size={16} /> Add as many images as you like — URLs or device uploads.
                  The first image is the cover. Leave empty to use the category artwork.
                </span>
              </div>
            )}
          </Field>

          <Field label="Product name">
            <input
              className="input"
              value={form.name}
              placeholder="Premium Almonds"
              onChange={(e) => set('name', e.target.value)}
            />
          </Field>

          <Field label="URL slug">
            <input
              className="input"
              value={shownSlug}
              placeholder="premium-almonds"
              onChange={(e) => {
                setSlugTouched(true);
                set('slug', e.target.value);
              }}
            />
          </Field>

          <Field label="Category">
            <select className="input" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {!categories.some((c) => c.slug === form.category) && form.category && (
                <option value={form.category}>{form.category}</option>
              )}
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Stock quantity (units)">
            <input
              className="input"
              type="number"
              min="0"
              value={form.stock}
              placeholder="120"
              onChange={(e) => set('stock', e.target.value)}
            />
          </Field>

          <Field label="Price (৳)">
            <input
              className="input"
              type="number"
              min="0"
              value={form.price}
              placeholder="780"
              onChange={(e) => set('price', e.target.value)}
            />
          </Field>

          <Field label="Compare-at price (৳, optional)">
            <input
              className="input"
              type="number"
              min="0"
              value={form.oldPrice}
              placeholder="950"
              onChange={(e) => set('oldPrice', e.target.value)}
            />
          </Field>

          <div className="full editor-block">
            <label>Package sizes &amp; quantities</label>
            <div className="pkg-list">
              {form.packages.map((p, i) => (
                <div className="pkg-row" key={i}>
                  <input
                    className="input"
                    value={p.size}
                    placeholder="500g"
                    aria-label="Size"
                    onChange={(e) => setPkg(i, 'size', e.target.value)}
                  />
                  <input
                    className="input"
                    type="number"
                    min="0"
                    value={p.price}
                    placeholder="780"
                    aria-label="Package price"
                    onChange={(e) => setPkg(i, 'price', e.target.value)}
                  />
                  <button
                    type="button"
                    className="iconbtn"
                    aria-label="Remove size"
                    onClick={() => dropPkg(i)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-outline pkg-add" onClick={addPkg}>
                <Plus size={14} /> Add size
              </button>
            </div>
          </div>

          <Field label="Short description" hint="full">
            <textarea
              className="input textarea"
              rows="2"
              value={form.short}
              onChange={(e) => set('short', e.target.value)}
            />
          </Field>

          <Field label="Description" hint="full">
            <textarea
              className="input textarea"
              rows="3"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </Field>

          <div className="full">
            <label className="check editor-toggle">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => set('active', e.target.checked)}
              />
              Active — visible on the storefront
            </label>
          </div>

          <details className="full editor-more">
            <summary>More product details (nutrition, ingredients, storage)</summary>
            <div className="editor-grid">
              <Field label="Ingredients">
                <textarea className="input textarea" rows="2" value={form.ingredients} onChange={(e) => set('ingredients', e.target.value)} />
              </Field>
              <Field label="Nutrition">
                <textarea className="input textarea" rows="2" value={form.nutrition} onChange={(e) => set('nutrition', e.target.value)} />
              </Field>
              <Field label="Benefits">
                <textarea className="input textarea" rows="2" value={form.benefits} onChange={(e) => set('benefits', e.target.value)} />
              </Field>
              <Field label="How to use">
                <textarea className="input textarea" rows="2" value={form.use} onChange={(e) => set('use', e.target.value)} />
              </Field>
              <Field label="Storage" hint="full">
                <textarea className="input textarea" rows="2" value={form.storage} onChange={(e) => set('storage', e.target.value)} />
              </Field>
            </div>
          </details>
        </div>

        {message && <div className="admin-alert error">{message}</div>}

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : isNew ? 'Add Product' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
