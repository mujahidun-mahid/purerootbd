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
  enabled: true,
  order: 1,
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
  const [form, setForm] = useState({ ...EMPTY_BANNER });
  const banners = parseBanners(identity.promo_banners);
  const set = (key) => (e) => setIdentity((prev) => ({ ...prev, [key]: e.target.value }));

  const persist = (next) => {
    const ordered = next.map((b, i) => ({ ...b, order: i + 1 }));
    setIdentity((prev) => ({ ...prev, promo_banners: JSON.stringify(ordered) }));
  };

  const startAdd = () => {
    setEditing(banners.length);
    setForm({ ...EMPTY_BANNER, id: `promo-${Date.now()}`, order: banners.length + 1 });
  };

  const startEdit = (index) => {
    setEditing(index);
    setForm({ ...EMPTY_BANNER, ...banners[index] });
  };

  const saveBanner = () => {
    if (!form.title.trim()) return;
    const next = [...banners];
    next[editing] = { ...form, title: form.title.trim() };
    persist(next);
    setEditing(-1);
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
          {banners.map((b, i) => (
            <div key={b.id || i} className={`banner-row${b.enabled === false ? ' off' : ''}`}>
              <div>
                <strong>{b.title}</strong>
                <small>{b.eyebrow || 'No eyebrow'} · {b.cta_link || '/shop'} · Order {b.order ?? i + 1}</small>
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
          ))}
        </div>
      ) : (
        <p className="muted">No custom banners yet — the homepage shows three brand-styled defaults. Add your own to replace them.</p>
      )}

      {editing >= 0 && (
        <div className="banner-form">
          <div className="identity-grid">
            <div><label>Eyebrow</label><input className="input" value={form.eyebrow} onChange={(e) => setForm({ ...form, eyebrow: e.target.value })} placeholder="Just Landed" /></div>
            <div><label>Title *</label><input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="New Arrivals" /></div>
            <div className="full"><label>Description</label><input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Short supporting text" /></div>
            <div className="full"><label>Image URL (optional — blank uses brand gradient)</label><input className="input" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" /></div>
            <div><label>Button Label</label><input className="input" value={form.cta_text} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} placeholder="Shop Now" /></div>
            <div><label>Button Link</label><input className="input" value={form.cta_link} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} placeholder="/shop" /></div>
          </div>
          <div className="settings-actions">
            <button type="button" className="btn btn-primary" onClick={saveBanner} disabled={!form.title.trim()}>Stage Banner</button>
            <button type="button" className="btn" onClick={() => setEditing(-1)}>Cancel</button>
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
