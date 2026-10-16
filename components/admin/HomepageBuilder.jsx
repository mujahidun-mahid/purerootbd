'use client';
import { useState } from 'react';
import { LayoutGrid, Megaphone, Plus, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, Save } from 'lucide-react';

const EMPTY_BANNER = {
  id: '',
  eyebrow: '',
  title: '',
  description: '',
  image: '',
  cta_text: 'Shop Now',
  cta_link: '/shop',
  bg: '',
  badge: '',
  enabled: true,
  order: 1,
  slides: [],
};

const EMPTY_SLIDE = {
  title: '',
  description: '',
  image: '',
  cta_text: 'Shop Now',
  cta_link: '/shop',
  badge: '',
};

function parseBanners(raw) {
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export default function HomepageBuilder({ identity, setIdentity, saveIdentity, loading }) {
  const [editing, setEditing] = useState(-1);
  const [form, setForm] = useState({ ...EMPTY_BANNER, slides: [] });
  const [slideEditing, setSlideEditing] = useState(-1);
  const [slideForm, setSlideForm] = useState({ ...EMPTY_SLIDE });
  const banners = parseBanners(identity.promo_banners);
  const set = (key) => (e) => setIdentity((prev) => ({ ...prev, [key]: e.target.value }));
  const setSlide = (key) => (e) => setSlideForm((prev) => ({ ...prev, [key]: e.target.value }));

  const persist = (next) => {
    const ordered = next.map((b, i) => ({ ...b, order: i + 1 }));
    setIdentity((prev) => ({ ...prev, promo_banners: JSON.stringify(ordered) }));
  };

  const startAdd = () => {
    setEditing(banners.length);
    setForm({ ...EMPTY_BANNER, slides: [], id: `promo-${Date.now()}`, order: banners.length + 1 });
    setSlideEditing(-1);
    setSlideForm({ ...EMPTY_SLIDE });
  };

  const startEdit = (index) => {
    setEditing(index);
    const b = banners[index] || {};
    setForm({ ...EMPTY_BANNER, ...b, slides: Array.isArray(b.slides) ? b.slides : [] });
    setSlideEditing(-1);
    setSlideForm({ ...EMPTY_SLIDE });
  };

  const saveBanner = () => {
    if (!form.title.trim()) return;
    const slides = (Array.isArray(form.slides) ? form.slides : [])
      .filter((s) => s && (s.title || s.description || s.image || s.badge))
      .slice(0, 10);
    const next = [...banners];
    next[editing] = { ...form, title: form.title.trim(), slides };
    persist(next);
    setEditing(-1);
    setSlideEditing(-1);
  };

  const startSlideAdd = () => {
    setSlideEditing((Array.isArray(form.slides) ? form.slides.length : 0));
    setSlideForm({ ...EMPTY_SLIDE });
  };

  const startSlideEdit = (idx) => {
    setSlideEditing(idx);
    setSlideForm({ ...EMPTY_SLIDE, ...(form.slides[idx] || {}) });
  };

  const saveSlide = () => {
    if (!slideForm.title && !slideForm.description && !slideForm.image && !slideForm.badge) return;
    const next = [...(Array.isArray(form.slides) ? form.slides : [])];
    next[slideEditing] = { ...slideForm };
    setForm((f) => ({ ...f, slides: next }));
    setSlideEditing(-1);
    setSlideForm({ ...EMPTY_SLIDE });
  };

  const removeSlide = (idx) => {
    if (!window.confirm('Delete this slide?')) return;
    setForm((f) => ({ ...f, slides: (f.slides || []).filter((_, i) => i !== idx) }));
    setSlideEditing(-1);
  };

  const moveSlide = (idx, dir) => {
    const next = [...(form.slides || [])];
    const to = idx + dir;
    if (to < 0 || to >= next.length) return;
    const [moved] = next.splice(idx, 1);
    next.splice(to, 0, moved);
    setForm((f) => ({ ...f, slides: next }));
  };

  const removeBanner = (index) => {
    if (!window.confirm('Delete this banner?')) return;
    persist(banners.filter((_, i) => i !== index));
    setEditing(-1);
  };

  const toggleBanner = (index) => {
    persist(banners.map((b, i) => (i === index ? { ...b, enabled: b.enabled === false } : b)));
  };

  const moveBanner = (index, dir) => {
    const next = [...banners];
    const to = index + dir;
    if (to < 0 || to >= next.length) return;
    const [moved] = next.splice(index, 1);
    next.splice(to, 0, moved);
    persist(next);
  };

  const toggleKey = (key) =>
    setIdentity((prev) => ({ ...prev, [key]: prev[key] === 'false' || !prev[key] ? 'true' : 'false' }));

  const on = (key) => identity[key] !== 'false' && identity[key] !== '';

  return (
    <section className="admin-panel full">
      <div className="panel-head">
        <div>
          <span className="admin-kicker">Homepage Builder</span>
          <h2>Hero, Banners, Strip & Featured</h2>
          <p>
            Everything below is stored in Supabase and pushed to the live homepage the moment you
            save — no redeploy needed. Banner edits stage locally until you press Save.
          </p>
        </div>
        <LayoutGrid size={17} style={{ color: 'var(--a-brand-2)' }} />
      </div>

      <div className="identity-grid">
        <div>
          <label>Announcement Link URL (optional)</label>
          <input className="input" value={identity.announcement_url || ''} onChange={set('announcement_url')} placeholder="https://… or /shop" />
        </div>
        <div>
          <label>Hero Eyebrow</label>
          <input className="input" value={identity.hero_eyebrow || ''} onChange={set('hero_eyebrow')} placeholder="Fresh Picks, Every Day" />
        </div>
        <div>
          <label>Hero Offer Badge (optional)</label>
          <input className="input" value={identity.hero_offer || ''} onChange={set('hero_offer')} placeholder="Free delivery over ৳2,000" />
        </div>
        <div>
          <label>Hero Button Label</label>
          <input className="input" value={identity.hero_cta_text || ''} onChange={set('hero_cta_text')} placeholder="Shop Now" />
        </div>
        <div>
          <label>Hero Button Link</label>
          <input className="input" value={identity.hero_cta_link || ''} onChange={set('hero_cta_link')} placeholder="/shop" />
        </div>
        <div>
          <label>Hero Secondary Button Label (optional)</label>
          <input className="input" value={identity.hero_secondary_text || ''} onChange={set('hero_secondary_text')} placeholder="Learn More" />
        </div>
        <div>
          <label>Hero Secondary Button Link</label>
          <input className="input" value={identity.hero_secondary_link || ''} onChange={set('hero_secondary_link')} placeholder="/about" />
        </div>
      </div>

      <div className="panel-head" style={{ marginTop: 26, paddingBottom: 14 }}>
        <div>
          <span className="admin-kicker">Promotional Banners</span>
          <h2>Secondary Slots (up to 3 shown)</h2>
        </div>
        <button type="button" className="btn btn-outline" onClick={startAdd}>
          <Plus size={15} /> Add Banner
        </button>
      </div>

      {banners.length ? (
        <div className="banner-list">
          {banners.map((b, i) => {
            const slideCount = Array.isArray(b.slides) ? b.slides.length : 0;
            return (
            <div key={b.id || i} className={`banner-row${b.enabled === false ? ' off' : ''}`}>
              <div>
                <strong>{b.title}</strong>
                <small>{b.eyebrow || 'No eyebrow'} · {b.cta_link || '/shop'} · Order {b.order ?? i + 1}{slideCount > 1 ? ` · ${slideCount} slides · carousel` : slideCount === 1 ? ' · 1 slide' : ''}</small>
              </div>
              <span className="row-actions">
                <button type="button" className="icon-action" onClick={() => moveBanner(i, -1)} title="Move up" aria-label="Move banner up"><ArrowUp size={16} /></button>
                <button type="button" className="icon-action" onClick={() => moveBanner(i, 1)} title="Move down" aria-label="Move banner down"><ArrowDown size={16} /></button>
                <button type="button" className="icon-action" onClick={() => toggleBanner(i)} title={b.enabled === false ? 'Show' : 'Hide'} aria-label="Toggle banner visibility">
                  {b.enabled === false ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button type="button" className="icon-action" onClick={() => startEdit(i)} title="Edit" aria-label="Edit banner"><Pencil size={16} /></button>
                <button type="button" className="icon-action danger" onClick={() => removeBanner(i)} title="Delete" aria-label="Delete banner"><Trash2 size={16} /></button>
              </span>
            </div>
            );
          })}
        </div>
      ) : (
        <p className="muted">No custom banners yet — the homepage shows three brand-styled defaults. Add your own to replace them.</p>
      )}

      {editing >= 0 && (
        <div className="banner-form">
          <div className="identity-grid">
            <div><label>Eyebrow</label><input className="input" value={form.eyebrow} onChange={(e) => setForm({ ...form, eyebrow: e.target.value })} placeholder="Just Landed" /></div>
            <div><label>Title *</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="New Arrivals" /></div>
            <div className="full"><label>Description (shown when no slides)</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short supporting text" /></div>
            <div className="full"><label>Image URL (optional — blank uses brand gradient)</label><input className="input" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" /></div>
            <div><label>Button Label</label><input className="input" value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} placeholder="Shop Now" /></div>
            <div><label>Button Link</label><input className="input" value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} placeholder="/shop" /></div>
            <div><label>Discount Badge (optional)</label><input className="input" value={form.badge || ''} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="20% OFF" /></div>
          </div>

          <div className="panel-head" style={{ marginTop: 18, paddingBottom: 10 }}>
            <div>
              <span className="admin-kicker">Mini Carousel Slides</span>
              <h3 style={{ margin: 0 }}>Slides for “{form.title || 'this card'}” ({(form.slides || []).length})</h3>
              <p className="muted" style={{ margin: '4px 0 0' }}>Add 2+ slides to turn this card into an auto-playing responsive carousel. Leave empty to keep a single static card.</p>
            </div>
            <button type="button" className="btn btn-outline" onClick={startSlideAdd}>
              <Plus size={15} /> Add Slide
            </button>
          </div>

          {(form.slides || []).length ? (
            <div className="banner-list" style={{ marginBottom: 12 }}>
              {(form.slides || []).map((s, idx) => (
                <div key={idx} className="banner-row">
                  <div>
                    <strong>{s.title || `Slide ${idx + 1}`}</strong>
                    <small>{s.badge ? `${s.badge} · ` : ''}{s.cta_link || '/shop'}</small>
                  </div>
                  <span className="row-actions">
                    <button type="button" className="icon-action" onClick={() => moveSlide(idx, -1)} title="Move up"><ArrowUp size={16} /></button>
                    <button type="button" className="icon-action" onClick={() => moveSlide(idx, 1)} title="Move down"><ArrowDown size={16} /></button>
                    <button type="button" className="icon-action" onClick={() => startSlideEdit(idx)} title="Edit"><Pencil size={16} /></button>
                    <button type="button" className="icon-action danger" onClick={() => removeSlide(idx)} title="Delete"><Trash2 size={16} /></button>
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted">No slides yet — this card renders as static content.</p>
          )}

          {slideEditing >= 0 && (
            <div className="identity-grid" style={{ background: 'var(--a-bg-soft, #f7f8f5)', borderRadius: 12, padding: 12, marginBottom: 12 }}>
              <div><label>Slide Title</label><input className="input" value={slideForm.title} onChange={setSlide('title')} placeholder="Flat 15% Off Nuts" /></div>
              <div><label>Badge (optional)</label><input className="input" value={slideForm.badge} onChange={setSlide('badge')} placeholder="15% OFF" /></div>
              <div className="full"><label>Slide Description</label><input className="input" value={slideForm.description} onChange={setSlide('description')} placeholder="Short supporting text" /></div>
              <div className="full"><label>Slide Image URL (optional)</label><input className="input" value={slideForm.image} onChange={setSlide('image')} placeholder="https://…" /></div>
              <div><label>Button Label</label><input className="input" value={slideForm.cta_text} onChange={setSlide('cta_text')} placeholder="Shop Now" /></div>
              <div><label>Button Link</label><input className="input" value={slideForm.cta_link} onChange={setSlide('cta_link')} placeholder="/shop" /></div>
              <div className="full settings-actions" style={{ marginTop: 4 }}>
                <button type="button" className="btn btn-primary" onClick={saveSlide}>Save Slide</button>
                <button type="button" className="btn" onClick={() => setSlideEditing(-1)}>Cancel</button>
              </div>
            </div>
          )}

          <div className="settings-actions">
            <button type="button" className="btn btn-primary" onClick={saveBanner} disabled={!form.title.trim()}>Stage Banner</button>
            <button type="button" className="btn" onClick={() => { setEditing(-1); setSlideEditing(-1); }}>Cancel</button>
            <span className="hint">Staged — press “Save Homepage Settings” below to publish.</span>
          </div>
        </div>
      )}

      <div className="panel-head" style={{ marginTop: 26, paddingBottom: 14 }}>
        <div>
          <span className="admin-kicker">Sections</span>
          <h2>Strip & Featured Products</h2>
        </div>
      </div>

      <div className="identity-grid">
        <div>
          <label>Featured Section Title</label>
          <input className="input" value={identity.featured_title || ''} onChange={set('featured_title')} placeholder="Featured Products" />
        </div>
        <div>
          <label>Featured Section Subtitle</label>
          <input className="input" value={identity.featured_subtitle || ''} onChange={set('featured_subtitle')} placeholder="Explore our popular picks." />
        </div>
        <div>
          <label>Max Featured Products</label>
          <input className="input" type="number" min="1" max="24" value={identity.featured_limit || ''} onChange={set('featured_limit')} placeholder="10" />
        </div>
        <div className="full">
          <label>Hand-picked Product Slugs (comma-separated, blank = automatic)</label>
          <input className="input" value={identity.featured_product_ids || ''} onChange={set('featured_product_ids')} placeholder="almonds, chia-seeds, natural-honey" />
        </div>
      </div>

      {[
        ['category_strip_enabled', 'Category strip', 'Horizontal category row above the hero. Visibility follows Featured Categories.'],
        ['featured_enabled', 'Featured products section', 'Show the filterable product grid on the homepage.'],
      ].map(([key, label, desc]) => (
        <div className="toggle-row" key={key}>
          <div>
            <strong>{label}</strong>
            <small>{on(key) ? `Visible — ${desc}` : `Hidden — ${desc}`}</small>
          </div>
          <button
            type="button"
            className={`a-switch ${on(key) ? 'on' : ''}`}
            onClick={() => toggleKey(key)}
            aria-label={`Toggle ${label}`}
            aria-pressed={on(key)}
          />
        </div>
      ))}

      <div className="settings-actions">
        <button type="button" className="btn btn-primary" onClick={saveIdentity} disabled={loading}>
          <Save size={15} /> Save Homepage Settings
        </button>
        <span className="hint"><Megaphone size={13} style={{ verticalAlign: -2 }} /> Applies instantly to the live homepage.</span>
      </div>
    </section>
  );
}
