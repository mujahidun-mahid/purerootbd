'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Trash2, ImageIcon } from 'lucide-react';
import { categories } from '@/lib/products';
import { Field } from './ui';

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
    oldPrice: product.oldPrice ?? '',
    stock: product.stock ?? '',
    image: product.image || '',
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
  const [slugTouched, setSlugTouched] = useState(Boolean(product));
  const [localError, setLocalError] = useState('');

  const isNew = !product;
  const [previewSrc, setPreviewSrc] = useState('');
  const previewTimer = useRef(null);

  useEffect(() => {
    const value = String(form.image || '').trim();
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewTimer.current = setTimeout(() => {
      const usable = /^https?:\/\/\S+\.\S+/i.test(value) || (value.startsWith('data:image/') && value.includes(','));
      setPreviewSrc(usable ? value : '');
    }, 500);
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, [form.image]);

  useEffect(() => {
    setForm(buildState(product));
    setSlugTouched(Boolean(product));
    setLocalError('');
  }, [product]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

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

    const payload = {
      id: product?.id,
      name,
      slug,
      category: form.category || 'nuts',
      price,
      oldPrice: form.oldPrice === '' ? null : Number(form.oldPrice),
      stock: form.stock === '' ? 0 : Number(form.stock),
      image: String(form.image || '').trim(),
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
          <Field label="Product image (URL)" hint="full">
            <input
              className="input"
              type="url"
              placeholder="https://…/product-image.jpg"
              value={form.image}
              onChange={(e) => set('image', e.target.value)}
            />
          </Field>

          <div className="editor-preview full">
            {previewSrc ? (
              <img src={previewSrc} alt={form.name || 'Product preview'} />
            ) : (
              <span>
                <ImageIcon size={16} /> Paste an image URL to preview it. Leave empty to use the
                category artwork.
              </span>
            )}
          </div>

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
