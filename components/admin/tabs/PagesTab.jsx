import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Eye, Edit3, Trash2, FileText, GripVertical, X, ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { Alert, Field, ModalShell, Toggle, StatCard, Panel } from '../ui';
import DataTable from '../DataTable';
import { formatDateTime } from '../constants';
import { SECTION_TYPES, getDefaultSectionData, sectionRenderers } from '../../PageSections';

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

  // Section management state
  const [sections, setSections] = useState([]);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({ type: '', data: {} });
  const [dragSectionId, setDragSectionId] = useState(null);

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
      const payload = { ...form, sections };
      const res = await fetch(url, { method, headers: authHeaders(), body: JSON.stringify(payload) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      setNotice({ type: 'success', text: editing ? 'Page updated' : 'Page created' });
      setEditing(null);
      setForm({ ...DEFAULT_PAGE_DATA, slug: '' });
      setSections([]);
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
    setSections(page.sections || []);
  };

  const openView = (page) => setViewing(page);

  // Section management functions
  const addSection = (type) => {
    const newSection = {
      id: `section-${Date.now()}`,
      type,
      enabled: true,
      order: sections.length,
      data: getDefaultSectionData(type),
    };
    setSections([...sections, newSection]);
    setNotice({ type: 'success', text: 'Section added' });
  };

  const editSection = (section) => {
    setEditingSection(section.id);
    setSectionForm({ type: section.type, data: { ...section.data } });
  };

  const saveSection = () => {
    setSections(sections.map(s => s.id === editingSection ? { ...s, data: sectionForm.data } : s));
    setEditingSection(null);
    setNotice({ type: 'success', text: 'Section updated' });
  };

  const removeSection = (id) => {
    if (!window.confirm('Remove this section?')) return;
    setSections(sections.filter(s => s.id !== id));
    setNotice({ type: 'success', text: 'Section removed' });
  };

  const toggleSection = (id) => {
    setSections(sections.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  const duplicateSection = (section) => {
    const newSection = {
      ...section,
      id: `section-${Date.now()}`,
      order: sections.length,
    };
    setSections([...sections, newSection]);
    setNotice({ type: 'success', text: 'Section duplicated' });
  };

  const moveSection = (fromIndex, toIndex) => {
    const newSections = [...sections];
    const [moved] = newSections.splice(fromIndex, 1);
    newSections.splice(toIndex, 0, moved);
    setSections(newSections.map((s, i) => ({ ...s, order: i })));
  };

  const startDrag = (id) => (e) => {
    dragSectionId.current = id;
    e.dataTransfer.effectAllowed = 'move';
    try { e.dataTransfer.setData('text/plain', id); } catch {}
  };

  const allowDrop = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (targetId) => (e) => {
    e.preventDefault();
    const sourceId = dragSectionId.current || e.dataTransfer.getData('text/plain');
    dragSectionId.current = null;
    if (!sourceId || sourceId === targetId) return;
    const fromIndex = sections.findIndex(s => s.id === sourceId);
    const toIndex = sections.findIndex(s => s.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    moveSection(fromIndex, toIndex);
  };

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

  const renderSectionFormFields = (type, data) => {
    if (!type) return null;
    const fields = [];
    switch (type) {
      case 'hero':
        fields.push(
          { key: 'title', label: 'Hero Title', type: 'text', placeholder: 'Main heading' },
          { key: 'subtitle', label: 'Subtitle', type: 'textarea', placeholder: 'Supporting text' },
          { key: 'image', label: 'Hero Image URL', type: 'text', placeholder: 'https://...' },
          { key: 'cta_text', label: 'CTA Button Text', type: 'text', placeholder: 'Shop Now' },
          { key: 'cta_link', label: 'CTA Button Link', type: 'text', placeholder: '/shop' },
          { key: 'alignment', label: 'Alignment', type: 'select', options: ['left', 'center', 'right'] },
          { key: 'height', label: 'Height', type: 'select', options: ['small', 'medium', 'large'] },
        );
        break;
      case 'richtext':
        fields.push(
          { key: 'content', label: 'Content (HTML)', type: 'textarea', placeholder: 'HTML content', full: true },
        );
        break;
      case 'image_text':
        fields.push(
          { key: 'image', label: 'Image URL', type: 'text', placeholder: 'https://...' },
          { key: 'title', label: 'Title', type: 'text', placeholder: 'Section title' },
          { key: 'content', label: 'Content (HTML)', type: 'textarea', placeholder: 'Text content', full: true },
          { key: 'image_position', label: 'Image Position', type: 'select', options: ['left', 'right'] },
          { key: 'alignment', label: 'Alignment', type: 'select', options: ['left', 'center', 'right'] },
        );
        break;
      case 'products':
        fields.push(
          { key: 'source', label: 'Source', type: 'select', options: ['featured', 'category', 'manual'] },
          { key: 'category', label: 'Category (if source=category)', type: 'text', placeholder: 'e.g. nuts' },
          { key: 'product_ids', label: 'Product IDs (comma-separated, if source=manual)', type: 'text', placeholder: 'PR-NUT-001, PR-NUT-002' },
          { key: 'limit', label: 'Limit', type: 'number', placeholder: '8' },
          { key: 'title', label: 'Section Title', type: 'text', placeholder: 'Featured Products' },
          { key: 'show_view_all', label: 'Show View All Link', type: 'checkbox' },
          { key: 'view_all_link', label: 'View All Link', type: 'text', placeholder: '/shop' },
        );
        break;
      case 'categories':
        fields.push(
          { key: 'category_ids', label: 'Category Slugs (comma-separated)', type: 'text', placeholder: 'nuts, seeds, spices' },
          { key: 'title', label: 'Section Title', type: 'text', placeholder: 'Shop by Category' },
          { key: 'show_all_link', label: 'Show View All Link', type: 'checkbox' },
          { key: 'all_link', label: 'View All Link', type: 'text', placeholder: '/shop' },
        );
        break;
      case 'faq':
        fields.push(
          { key: 'title', label: 'Section Title', type: 'text', placeholder: 'Frequently Asked Questions' },
          { key: 'items', label: 'FAQ Items (JSON)', type: 'textarea', placeholder: '[{"question": "Q1", "answer": "A1"}]', full: true },
        );
        break;
      case 'reviews':
        fields.push(
          { key: 'title', label: 'Section Title', type: 'text', placeholder: 'Customer Reviews' },
          { key: 'items', label: 'Reviews (JSON)', type: 'textarea', placeholder: '[{"author": "John", "rating": 5, "text": "Great!", "date": "2024-01-15"}]', full: true },
        );
        break;
      case 'image_gallery':
        fields.push(
          { key: 'title', label: 'Section Title', type: 'text', placeholder: 'Gallery' },
          { key: 'images', label: 'Images (JSON)', type: 'textarea', placeholder: '[{"url": "...", "caption": "...", "alt": "..."}]', full: true },
          { key: 'columns', label: 'Columns', type: 'select', options: ['2', '3', '4'] },
        );
        break;
      case 'video':
        fields.push(
          { key: 'url', label: 'Video URL (YouTube/Vimeo)', type: 'text', placeholder: 'https://...' },
          { key: 'title', label: 'Title', type: 'text', placeholder: 'Video title' },
          { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Video description' },
          { key: 'aspect_ratio', label: 'Aspect Ratio', type: 'select', options: ['16:9', '4:3', '1:1', '21:9'] },
        );
        break;
      case 'cta_banner':
        fields.push(
          { key: 'title', label: 'Title', type: 'text', placeholder: 'Banner title' },
          { key: 'description', label: 'Description', type: 'textarea', placeholder: 'Supporting text' },
          { key: 'button_text', label: 'Button Text', type: 'text', placeholder: 'Shop Now' },
          { key: 'button_link', label: 'Button Link', type: 'text', placeholder: '/shop' },
          { key: 'background', label: 'Background Image URL', type: 'text', placeholder: 'https://...' },
          { key: 'text_color', label: 'Text Color', type: 'select', options: ['white', 'dark', 'primary'] },
          { key: 'alignment', label: 'Alignment', type: 'select', options: ['left', 'center', 'right'] },
        );
        break;
      case 'divider':
        fields.push(
          { key: 'label', label: 'Label', type: 'text', placeholder: 'Section divider' },
          { key: 'style', label: 'Style', type: 'select', options: ['line', 'dashed', 'none'] },
        );
        break;
      case 'spacer':
        fields.push(
          { key: 'height', label: 'Height', type: 'select', options: ['small', 'medium', 'large'] },
        );
        break;
      default:
        fields.push({ key: 'data', label: 'Data (JSON)', type: 'textarea', placeholder: '{}', full: true });
    }

    const renderField = (f) => {
      if (f.type === 'textarea') {
        return (
          <textarea className="input" rows={f.full ? 12 : 4} value={data[f.key] || ''}
            onChange={(e) => setSectionForm({ ...sectionForm, data: { ...data, [f.key]: e.target.value } })} placeholder={f.placeholder} />
        );
      }
      if (f.type === 'select') {
        return (
          <select className="input" value={data[f.key] || ''} onChange={(e) => setSectionForm({ ...sectionForm, data: { ...data, [f.key]: e.target.value } })}>
            {f.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        );
      }
      if (f.type === 'checkbox') {
        return (
          <label className="editor-toggle">
            <Toggle checked={data[f.key] === true} onChange={(v) => setSectionForm({ ...sectionForm, data: { ...data, [f.key]: v } })} />
            {f.label}
          </label>
        );
      }
      return (
        <input className="input" type="text" value={data[f.key] || ''} onChange={(e) => setSectionForm({ ...sectionForm, data: { ...data, [f.key]: e.target.value } })} placeholder={f.placeholder} />
      );
    };

    return fields.map(f => <Field key={f.key} label={f.label} hint={f.full ? 'full' : undefined}>{renderField(f)}</Field>);
    };

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
            {(viewing.sections || []).map((section, index) => {
              if (!section.enabled) return null;
              const Renderer = sectionRenderers[section.type];
              return Renderer ? <Renderer key={index} data={section.data} /> : (
                <div key={index} className="muted" style={{ padding: 16, border: '1px dashed var(--border)', borderRadius: 8 }}>
                  Unknown section type: {section.type}
                </div>
              );
            })}
            {!viewing.sections?.length && (
              <div>
                <h3>{viewing.hero_title}</h3>
                {viewing.hero_subtitle && <p className="muted">{viewing.hero_subtitle}</p>}
                <div dangerouslySetInnerHTML={{ __html: viewing.content_html || viewing.content_markdown }} />
              </div>
            )}
          </div>
        </ModalShell>
      )}
    </div>
  );
}