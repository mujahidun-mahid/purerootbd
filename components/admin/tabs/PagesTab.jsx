import { useState, useEffect, useCallback } from 'react';
import { Plus, Save, Eye, Edit3, Trash2, X, ChevronDown } from 'lucide-react';
import { Alert, Field, ModalShell, Toggle, Panel, StatCard, EmptyState } from '../ui';
import { formatDateTime } from '../constants';

const PAGE_TEMPLATES = [
  { slug: 'home', label: 'Home Page', description: 'Main landing page with hero, featured categories, best sellers' },
  { slug: 'about', label: 'About Us', description: 'Company story, mission, values' },
  { slug: 'contact', label: 'Contact', description: 'Contact form, address, phone, email, map' },
  { slug: 'faq', label: 'FAQ', description: 'Frequently asked questions' },
  { slug: 'shipping', label: 'Shipping Info', description: 'Delivery zones, fees, timelines' },
  { slug: 'returns', label: 'Returns Policy', description: 'Return/refund policy, process, conditions' },
  { slug: 'terms', label: 'Terms of Service', description: 'Legal terms and conditions' },
  { slug: 'privacy', label: 'Privacy Policy', description: 'Data privacy and cookie policy' },
  { slug: 'shop', label: 'Shop Page', description: 'Product listing page, filters, sorting' },
  { slug: 'category', label: 'Category Template', description: 'Dynamic category pages (slug-based)' },
  { slug: 'product', label: 'Product Template', description: 'Dynamic product detail pages (slug-based)' },
];

const DEFAULT_PAGE_DATA = {
  title: '',
  meta_title: '',
  meta_description: '',
  hero_title: '',
  hero_subtitle: '',
  hero_image: '',
  hero_cta_text: '',
  hero_cta_link: '',
  content_html: '',
  content_markdown: '',
  sections: [],
  is_active: true,
  show_in_nav: false,
  nav_order: 0,
};

export default function PagesTab({ password }) {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [form, setForm] = useState({ ...DEFAULT_PAGE_DATA, slug: '' });
  const [showCreate, setShowCreate] = useState(false);

  const authHeaders = () => ({ 'x-admin-password': password, 'content-type': 'application/json' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/pages', { headers: { 'x-admin-password': password } });
      if (res.ok) {
        const data = await res.json();
        setPages(data.pages || []);
      }
    } catch (e) {
      console.error('Failed to load pages:', e);
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => { load(); }, [load]);

  const savePage = async () => {
    if (!form.slug?.trim()) return setNotice({ type: 'error', text: 'Slug is required' });
    setSaving(true);
    setNotice(null);
    try {
      const method = editing ? 'PUT' : 'POST';
      const url = editing ? `/api/admin/pages/${editing}` : '/api/admin/pages';
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setNotice({ type: 'success', text: editing ? 'Page updated' : 'Page created' });
      setEditing(null);
      setForm({ ...DEFAULT_PAGE_DATA, slug: '' });
      setShowCreate(false);
      load();
    } catch (e) {
      setNotice({ type: 'error', text: e.message });
    } finally {
      setSaving(false);
    }
  };

  const deletePage = async (slug) => {
    if (!window.confirm(`Delete page "${slug}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/pages/${slug}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to delete');
      setNotice({ type: 'success', text: 'Page deleted' });
      load();
    } catch (e) {
      setNotice({ type: 'error', text: e.message });
    }
  };

  const openEdit = (page) => {
    setEditing(page.slug);
    setForm({ ...DEFAULT_PAGE_DATA, ...page });
  };

  const openView = (page) => setViewing(page);

  const templateFields = [
    { key: 'slug', label: 'Slug (URL path)', type: 'text', placeholder: 'e.g. about-us' },
    { key: 'title', label: 'Page Title', type: 'text', placeholder: 'Page title shown on site' },
    { key: 'meta_title', label: 'Meta Title (SEO)', type: 'text', placeholder: 'Browser tab title' },
    { key: 'meta_description', label: 'Meta Description (SEO)', type: 'textarea', placeholder: 'Search result snippet' },
    { key: 'hero_title', label: 'Hero Title', type: 'text', placeholder: 'Large heading on page' },
    { key: 'hero_subtitle', label: 'Hero Subtitle', type: 'textarea', placeholder: 'Supporting text under hero title' },
    { key: 'hero_image', label: 'Hero Image URL', type: 'text', placeholder: 'https://...' },
    { key: 'hero_cta_text', label: 'CTA Button Text', type: 'text', placeholder: 'Shop Now' },
    { key: 'hero_cta_link', label: 'CTA Button Link', type: 'text', placeholder: '/shop' },
    { key: 'content_markdown', label: 'Content (Markdown)', type: 'textarea', placeholder: 'Page body content in Markdown', full: true },
    { key: 'content_html', label: 'Content (HTML)', type: 'textarea', placeholder: 'Page body content in HTML', full: true },
  ];

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <div>
          <div className="admin-kicker">Content Management</div>
          <h2>Pages <em>({pages.length})</em></h2>
        </div>
        <div className="admin-toolbar-right">
          <button type="button" className="btn btn-primary" onClick={() => { setForm({ ...DEFAULT_PAGE_DATA, slug: '' }); setEditing(null); setShowCreate(true); }}>
            <Plus size={15} /> Add Page
          </button>
        </div>
      </div>

      {notice && <Alert onClose={() => setNotice(null)} type={notice.type}>{notice.text}</Alert>}

      <div className="kpi-row">
        <StatCard label="Total Pages" value={pages.length} icon={FileText} />
        <StatCard label="Active" value={pages.filter(p => p.is_active).length} tone="green" />
        <StatCard label="In Navigation" value={pages.filter(p => p.show_in_nav).length} />
        <StatCard label="Templates Available" value={PAGE_TEMPLATES.length} tone="gold" />
      </div>

      <DataTable
        columns={[
          { key: 'slug', header: 'Slug', render: (p) => <strong>{p.slug}</strong> },
          { key: 'title', header: 'Title', render: (p) => <span>{p.title || '—'}</span> },
          { key: 'template', header: 'Template', render: (p) => <span className="pill">{p.template || 'Custom'}</span> },
          { key: 'status', header: 'Status', render: (p) => <span className={`pill ${p.is_active ? 'pill-on' : 'pill-off'}`}>{p.is_active ? 'Active' : 'Draft'}</span> },
          { key: 'nav', header: 'In Nav', render: (p) => <span className={`pill ${p.show_in_nav ? 'pill-on' : 'pill-off'}`}>{p.show_in_nav ? 'Yes' : 'No'}</span> },
          { key: 'updated', header: 'Updated', render: (p) => p.updated_at ? formatDateTime(p.updated_at) : '—' },
          {
            key: 'actions',
            header: '',
            align: 'right',
            render: (p) => (
              <span className="row-actions">
                <button type="button" className="icon-action" onClick={() => openView(p)} title="Preview"><Eye size={16} /></button>
                <button type="button" className="icon-action" onClick={() => openEdit(p)} title="Edit"><Edit3 size={16} /></button>
                <button type="button" className="icon-action danger" onClick={() => deletePage(p.slug)} title="Delete"><Trash2 size={16} /></button>
              </span>
            )
          }
        ]}
        rows={pages}
        rowKey={(p) => p.slug}
        emptyText="No pages yet. Create your first page."
        loading={loading}
        pageSize={20}
      />

      {(editing || showCreate) && (
        <ModalShell
          kicker={editing ? 'Page Editor' : 'New Page'}
          title={editing ? editing : 'Create New Page'}
          onClose={() => { setEditing(null); setShowCreate(false); setForm({ ...DEFAULT_PAGE_DATA, slug: '' }); }}
          actions={
            <>
              <button type="button" className="btn" onClick={() => { setEditing(null); setShowCreate(false); setForm({ ...DEFAULT_PAGE_DATA, slug: '' }); }}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={savePage} disabled={saving}>
                {saving ? 'Saving…' : editing ? 'Update Page' : 'Create Page'}
              </button>
            </>
          }
        >
          {notice && <Alert type={notice.type} onClose={() => setNotice(null)}>{notice.text}</Alert>}
          <div className="editor-grid" style={{ maxHeight: '70vh', overflow: 'auto' }}>
            {templateFields.map((f) => (
              <Field key={f.key} label={f.label} hint={f.full ? 'full' : undefined}>
                {f.type === 'textarea' ? (
                  <textarea className="input" rows={f.full ? 12 : 4} value={form[f.key] || ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} />
                ) : (
                  <input className="input" type="text" value={form[f.key] || ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} />
                )}
              </Field>
            ))}
            <Field label="Active" hint="full">
              <label className="editor-toggle">
                <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
                Page is published and accessible
              </label>
            </Field>
            <Field label="Show in Navigation" hint="full">
              <label className="editor-toggle">
                <Toggle checked={form.show_in_nav} onChange={(v) => setForm({ ...form, show_in_nav: v })} />
                Display in site header/footer navigation
              </label>
            </Field>
            <Field label="Navigation Order" hint="full">
              <input className="input" type="number" min="0" value={form.nav_order || 0}
                onChange={(e) => setForm({ ...form, nav_order: Number(e.target.value) })} />
            </Field>
          </div>
        </ModalShell>
      )}

      {viewing && (
        <ModalShell
          kicker="Preview"
          title={viewing.title || viewing.slug}
          onClose={() => setViewing(null)}
          actions={<button type="button" className="btn" onClick={() => setViewing(null)}>Close</button>}
        >
          <div style={{ padding: 16 }}>
            <h3>{viewing.hero_title}</h3>
            {viewing.hero_subtitle && <p className="muted">{viewing.hero_subtitle}</p>}
            <div dangerouslySetInnerHTML={{ __html: viewing.content_html || viewing.content_markdown }} />
          </div>
        </ModalShell>
      )}
    </div>
  );
}