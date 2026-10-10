import { Image as ImageIcon, Megaphone, ShieldCheck, Save } from 'lucide-react';
import HomepageBuilder from '../HomepageBuilder';

const identityFields = [
  { key: 'site_name', label: 'Site Name', placeholder: 'PURE ROOTS' },
  { key: 'site_tagline', label: 'Tagline', placeholder: "NATURE'S NUTRITION" },
  { key: 'logo_image_url', label: 'Logo Image URL', placeholder: 'https://… (used in header)', full: false },
  { key: 'meta_title', label: 'Meta Title', placeholder: 'Pure Roots | Premium Nutrition' },
  {
    key: 'meta_description',
    label: 'Meta Description',
    placeholder: 'Shown in Google results and social shares',
    full: true
  },
  { key: 'site_description', label: 'Site Description', placeholder: 'Used for footer + about copy', full: true },
  { key: 'footer_text', label: 'Footer Copyright Line', placeholder: '© Pure Roots. All rights reserved.', full: true }
];

const contactFields = [
  { key: 'contact_phone', label: 'Phone', placeholder: '+880 1XXX-XXXXXX' },
  { key: 'contact_email', label: 'Email', placeholder: 'hello@pureroots.com' },
  { key: 'contact_address', label: 'Address', placeholder: 'Dhaka, Bangladesh', full: true }
];

export default function SettingsTab({
  data,
  heroUrl,
  setHeroUrl,
  heroTitle,
  setHeroTitle,
  heroSubtitle,
  setHeroSubtitle,
  file,
  setFile,
  uploadHero,
  saveHeroUrl,
  saveCopy,
  identity,
  setIdentity,
  saveIdentity,
  loading
}) {
  const health = data?.systemHealth || {};
  const set = (key) => (e) => setIdentity((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="admin-content">
      <div className="settings-grid">
        {/* -------------------------------------------------------
            SITE IDENTITY
        ------------------------------------------------------- */}
        <section className="admin-panel full">
          <div className="panel-head">
            <div>
              <span className="admin-kicker">Site Identity</span>
              <h2>Brand, Logo & Search Metadata</h2>
              <p>
                Every field below is stored in Supabase and pushed to the live storefront the moment
                you save — no redeploy needed.
              </p>
            </div>
            <span className="live-badge">
              <i /> Realtime
            </span>
          </div>

          <div className="identity-grid">
            {identityFields.map((f) => (
              <div key={f.key} className={f.full ? 'full' : undefined}>
                <label>{f.label}</label>
                <input
                  className="input"
                  value={identity[f.key] || ''}
                  onChange={set(f.key)}
                  placeholder={f.placeholder}
                />
              </div>
            ))}
          </div>

          <div className="settings-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={saveIdentity}
              disabled={loading}
            >
              <Save size={15} /> Save Site Identity
            </button>
            <span className="hint">Applies instantly across header, footer, SEO tags and 404 page.</span>
          </div>
        </section>

        {/* -------------------------------------------------------
            HOMEPAGE HERO
        ------------------------------------------------------- */}
        <section className="admin-panel">
          <div className="panel-head">
            <div>
              <span className="admin-kicker">Homepage Hero</span>
              <h2>Hero Banner & Messaging</h2>
              <p>Control the hero image and marketing copy on the storefront.</p>
            </div>
          </div>

          <div
            className="hero-admin-preview"
            style={{
              backgroundImage: heroUrl
                ? `linear-gradient(90deg, rgba(7,38,22,.85), rgba(7,38,22,.2)), url(${heroUrl})`
                : 'linear-gradient(135deg, #062D08, #0A400C)'
            }}
          >
            <span>Live Preview</span>
            <strong>{heroTitle || 'Nature’s Nutrition, Delivered Pure'}</strong>
          </div>

          <label>Upload Banner Image to Supabase Storage</label>
          <div className="file-row">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button
              type="button"
              className="btn btn-primary"
              onClick={uploadHero}
              disabled={loading || !file}
            >
              <ImageIcon size={16} /> Upload & Publish
            </button>
          </div>

          <label>Or Set Public Image URL</label>
          <div className="inline-form">
            <input
              className="input"
              value={heroUrl}
              onChange={(e) => setHeroUrl(e.target.value)}
              placeholder="https://..."
            />
            <button type="button" className="btn btn-outline" onClick={saveHeroUrl} disabled={!heroUrl}>
              Save URL
            </button>
          </div>

          <label>Hero Headline</label>
          <input
            className="input"
            value={heroTitle}
            onChange={(e) => setHeroTitle(e.target.value)}
            placeholder="Nature’s Nutrition, Delivered Pure"
          />

          <label>Hero Subtitle</label>
          <textarea
            className="input textarea"
            rows="3"
            value={heroSubtitle}
            onChange={(e) => setHeroSubtitle(e.target.value)}
            placeholder="Premium nuts, seeds, spices..."
          />

          <div className="settings-actions">
            <button type="button" className="btn btn-primary" onClick={saveCopy}>
              <Save size={15} /> Save Homepage Copy
            </button>
          </div>
        </section>

        {/* -------------------------------------------------------
            ANNOUNCEMENT + CONTACT
        ------------------------------------------------------- */}
        <section className="admin-panel">
          <div className="panel-head">
            <div>
              <span className="admin-kicker">Announcement Bar</span>
              <h2>Site-wide Notice</h2>
              <p>Shown above the header on every storefront page.</p>
            </div>
            <Megaphone size={17} style={{ color: 'var(--a-brand-2)' }} />
          </div>

          <label>Announcement Text</label>
          <input
            className="input"
            value={identity.announcement || ''}
            onChange={set('announcement')}
            placeholder="Free delivery on orders over ৳2,000"
          />

          <div className="toggle-row">
            <div>
              <strong>Show announcement bar</strong>
              <small>
                {identity.announcement_enabled === 'true'
                  ? 'Currently visible on the storefront'
                  : 'Currently hidden'}
              </small>
            </div>
            <button
              type="button"
              className={`a-switch ${identity.announcement_enabled === 'true' ? 'on' : ''}`}
              onClick={() =>
                setIdentity((prev) => ({
                  ...prev,
                  announcement_enabled: prev.announcement_enabled === 'true' ? 'false' : 'true'
                }))
              }
              aria-label="Toggle announcement bar"
              aria-pressed={identity.announcement_enabled === 'true'}
            />
          </div>

          <div className="panel-head" style={{ marginTop: 26, paddingBottom: 14 }}>
            <div>
              <span className="admin-kicker">Contact Details</span>
              <h2>Footer Contact Block</h2>
            </div>
          </div>

          <div className="identity-grid">
            {contactFields.map((f) => (
              <div key={f.key} className={f.full ? 'full' : undefined}>
                <label>{f.label}</label>
                <input
                  className="input"
                  value={identity[f.key] || ''}
                  onChange={set(f.key)}
                  placeholder={f.placeholder}
                />
              </div>
            ))}
          </div>

          <div className="settings-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={saveIdentity}
              disabled={loading}
            >
              <Save size={15} /> Save Announcement & Contact
            </button>
          </div>
        </section>

        <HomepageBuilder
          identity={identity}
          setIdentity={setIdentity}
          saveIdentity={saveIdentity}
          loading={loading}
        />

        {/* -------------------------------------------------------
            SYSTEM HEALTH
        ------------------------------------------------------- */}
        <section className="admin-panel full">
          <div className="panel-head">
            <div>
              <span className="admin-kicker">Diagnostics</span>
              <h2>System & Database Health</h2>
              <p>Live status of your database, tables, and server credentials.</p>
            </div>
          </div>

          <div className="health-row">
            <div>
              <strong>Database Connection</strong>
              <small>Supabase PostgreSQL</small>
            </div>
            <span>
              <i style={{ background: health.database === 'Connected' ? '#217A4B' : '#c0392b' }} />
              {health.database || 'Checking…'}
            </span>
          </div>

          <div className="health-row">
            <div>
              <strong>Orders Table</strong>
              <small>public.orders</small>
            </div>
            <span>
              <i /> {data?.orders?.length || 0} records stored
            </span>
          </div>

          <div className="health-row">
            <div>
              <strong>Site Events Table</strong>
              <small>public.site_events</small>
            </div>
            <span>
              <i /> {data?.recentEvents?.length ? 'Recording visitor logs' : 'Awaiting events'}
            </span>
          </div>

          <div className="health-row">
            <div>
              <strong>Site Settings Table</strong>
              <small>public.site_settings</small>
            </div>
            <span>
              <i /> Realtime publication active
            </span>
          </div>

          <div className="health-row">
            <div>
              <strong>Credentials Mode</strong>
              <small>Supabase Secret / Service Role</small>
            </div>
            <span>
              <i /> {health.isServiceRole ? 'Service Role (Full Access)' : 'Standard / Anon'}
            </span>
          </div>

          <div className="admin-note" style={{ marginTop: 22 }}>
            <ShieldCheck size={20} />
            <div>
              <strong>Security Protocol</strong>
              <p>
                All database modifications are secured server-side. The Supabase service-role secret
                key is strictly kept in private server environment variables and never leaked to
                browser bundles.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
