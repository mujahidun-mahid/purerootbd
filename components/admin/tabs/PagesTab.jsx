import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Eye, Edit3, Trash2, FileText, GripVertical, X, ChevronDown, ChevronUp, Copy, Shield, Lock, Unlock, Globe, LayoutDashboard } from 'lucide-react';
import { Alert, Field, ModalShell, Toggle, StatCard, Panel, Textarea } from '../ui';
import DataTable from '../DataTable';
import { formatDateTime } from '../constants';
import { SECTION_TYPES, getDefaultSectionData, sectionRenderers } from '../../PageSections';

const PAGE_TEMPLATES = [
  { slug: 'custom', label: 'Custom Page', description: 'Blank page with full section builder' },
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
  { slug: 'landing', label: 'Landing Page', description: 'Marketing landing page with hero, features, CTA' },
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
  template: 'custom',
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
  const [activeTab, setActiveTab] = useState('system');

  // Section management state
  const [sections, setSections] = useState([]);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({ type: '', data: {} });
  const dragSectionId = useRef(null);

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
    const page = pages.find(p => p.slug === slug);
    if (page?.page_type === 'system') {
      return setNotice({ type: 'error', text: 'System pages cannot be deleted. Deactivate instead.' });
    }
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

  const duplicatePage = async (page) => {
    const newSlug = `${page.slug}-copy-${Date.now()}`;
    try {
      const res = await fetch('/api/admin/pages', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          ...page,
          slug: newSlug,
          title: `${page.title} (Copy)`,
          is_active: false,
          show_in_nav: false,
          nav_order: 0,
        }),
      });
      if (!res.ok) throw new Error('Failed to duplicate');
      setNotice({ type: 'success', text: 'Page duplicated' });
      load();
    } catch (e) {
      setNotice({ type: 'error', text: e.message });
    }
  };

  const openEdit = (page) => {
    setEditing(page.slug);
    setForm({ ...DEFAULT_PAGE_DATA, ...page, slug: page.slug });
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
    { key: 'slug', label: 'Slug (URL path)', type: 'text', placeholder: 'e.g. about-us', help: 'Unique URL identifier. Lowercase, hyphens only.' },
    { key: 'title', label: 'Page Title', type: 'text', placeholder: 'Page title shown on site' },
    { key: 'template', label: 'Template', type: 'select', options: PAGE_TEMPLATES.map(t => t.slug), help: 'Page template determines layout and available features' },
    { key: 'meta_title', label: 'Meta Title (SEO)', type: 'text', placeholder: 'Browser tab title' },
    { key: 'meta_description', label: 'Meta Description (SEO)', type: 'textarea', placeholder: 'Search result snippet (150-160 chars)', full: true },
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
          { key: 'source', label: 'Source', type: 'select', options: ['featured', 'category', 'manual'], help: 'featured = high-rated, category = filter by category, manual = specific product IDs' },
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
          { key: 'category_ids', label: 'Category Slugs (comma-separated)', type: 'text', placeholder: 'nuts, seeds, spices', help: 'Leave empty to show all categories' },
          { key: 'title', label: 'Section Title', type: 'text', placeholder: 'Shop by Category' },
          { key: 'show_all_link', label: 'Show View All Link', type: 'checkbox' },
          { key: 'all_link', label: 'View All Link', type: 'text', placeholder: '/shop' },
        );
        break;
      case 'faq':
        fields.push(
          { key: 'title', label: 'Section Title', type: 'text', placeholder: 'Frequently Asked Questions' },
          { key: 'items', label: 'FAQ Items (JSON)', type: 'textarea', placeholder: '[{"question": "Q1", "answer": "A1"}]', full: true, help: 'Array of objects with question and answer' },
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

    return fields.map(f => <Field key={f.key} label={f.label} hint={f.full ? 'full' : f.help}>{renderField(f)}</Field>);
  };

  const systemPages = pages.filter(p => p.page_type === 'system');
  const customPages = pages.filter(p => p.page_type === 'custom');
  const displayPages = activeTab === 'system' ? systemPages : customPages;

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
        <StatCard label="System Pages" value={systemPages.length} icon={Shield} tone="blue" />
        <StatCard label="Custom Pages" value={customPages.length} icon={LayoutDashboard} tone="purple" />
        <StatCard label="Active" value={pages.filter(p => p.is_active).length} tone="green" />
        <StatCard label="In Navigation" value={pages.filter(p => p.show_in_nav).length} />
      </div>

      <div className="tab-switcher" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button className={`btn ${activeTab === 'system' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('system')}>
          <Shield size={16} /> System Pages ({systemPages.length})
        </button>
        <button className={`btn ${activeTab === 'custom' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('custom')}>
          <LayoutDashboard size={16} /> Custom Pages ({customPages.length})
        </button>
      </div>

      <DataTable
        columns={[
          { key: 'slug', header: 'Slug', render: (p) => <strong>{p.slug}</strong> },
          { key: 'title', header: 'Title', render: (p) => <span>{p.title || '—'}</span> },
          { key: 'template', header: 'Template', render: (p) => <span className="pill">{p.template || 'Custom'}</span> },
          { key: 'status', header: 'Status', render: (p) => <span className={`pill ${p.is_active ? 'pill-on' : 'pill-off'}`}>{p.is_active ? 'Published' : 'Draft'}</span> },
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
                {p.page_type === 'custom' && (
                  <>
                    <button type="button" className="icon-action" onClick={() => duplicatePage(p)} title="Duplicate"><Copy size={16} /></button>
                    <button type="button" className="icon-action danger" onClick={() => deletePage(p.slug)} title="Delete"><Trash2 size={16} /></button>
                  </>
                )}
                {p.page_type === 'system' && (
                  <button type="button" className="icon-action" disabled title="System pages cannot be deleted"><Lock size={16} /></button>
                )}
              </span>
            )
          }
        ]}
        rows={displayPages}
        rowKey={(p) => p.slug}
        emptyText={activeTab === 'system' ? 'No system pages found.' : 'No custom pages yet. Create your first page.'}
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
            <Panel title="Page Settings" icon={FileText}>
              {templateFields.map((f) => (
                <Field key={f.key} label={f.label} hint={f.full ? 'full' : f.help}>
                  {f.type === 'textarea' ? (
                    <textarea className="input" rows={f.full ? 12 : 4} value={form[f.key] || ''}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} />
                  ) : f.type === 'select' ? (
                    <select className="input" value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                      {f.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : (
                    <input className="input" type="text" value={form[f.key] || ''}
                      onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} />
                  )}
                </Field>
              ))}
              <Field label="Active" hint="Page is published and accessible">
                <label className="editor-toggle">
                  <Toggle checked={form.is_active} onChange={(v) => setForm({ ...form, is_active: v })} />
                  Published
                </label>
              </Field>
              <Field label="Show in Navigation" hint="Display in site header/footer navigation">
                <label className="editor-toggle">
                  <Toggle checked={form.show_in_nav} onChange={(v) => setForm({ ...form, show_in_nav: v })} />
                  In Navigation
                </label>
              </Field>
              <Field label="Navigation Order" hint="Lower numbers appear first">
                <input className="input" type="number" min="0" value={form.nav_order || 0}
                  onChange={(e) => setForm({ ...form, nav_order: Number(e.target.value) })} />
              </Field>
            </Panel>
            <Panel title="Content Sections" icon={LayoutDashboard} style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                {SECTION_TYPES.map(t => (
                  <button key={t.type} type="button" className="btn btn-outline" onClick={() => addSection(t.type)} title={t.description}>
                    <span style={{ fontSize: 18 }}>{t.icon}</span> {t.label}
                  </button>
                ))}
              </div>
              {sections.length === 0 ? (
                <div className="empty" style={{ textAlign: 'center', padding: 40 }}>
                  <p className="muted">No sections yet. Add sections above to build your page content.</p>
                </div>
              ) : (
                <div className="sections-list">
                  {sections.map((section, index) => {
                    const typeInfo = SECTION_TYPES.find(t => t.type === section.type);
                    const isEditing = editingSection === section.id;
                    return (
                      <div key={section.id} className="section-item" style={{ border: '1px solid var(--border)', borderRadius: 8, marginBottom: 12, background: 'var(--card)' }}>
                        <div className="section-header" style={{ display: 'flex', alignItems: 'center', padding: 12, gap: 12, cursor: 'grab' }}>
                          <button type="button" className="drag-handle" onDragStart={startDrag(section.id)} onDragOver={allowDrop} onDrop={onDrop(section.id)} draggable title="Drag to reorder"><GripVertical size={20} className="muted" /></button>
                          <span style={{ fontSize: 20 }}>{typeInfo?.icon || '📦'}</span>
                          <strong>{typeInfo?.label || section.type}</strong>
                          <span className={`pill ${section.enabled ? 'pill-on' : 'pill-off'}`} style={{ fontSize: 12 }}>{section.enabled ? 'Visible' : 'Hidden'}</span>
                          <div style={{ flex: 1 }} />
                          {!isEditing ? (
                            <>
                              <button type="button" className="icon-action" onClick={() => editSection(section)} title="Edit"><Edit3 size={16} /></button>
                              <button type="button" className="icon-action" onClick={() => duplicateSection(section)} title="Duplicate"><Copy size={16} /></button>
                              <button type="button" className="icon-action" onClick={() => toggleSection(section.id)} title={section.enabled ? 'Hide' : 'Show'}><Eye size={16} /></button>
                              <button type="button" className="icon-action danger" onClick={() => removeSection(section.id)} title="Remove"><Trash2 size={16} /></button>
                            </>
                          ) : (
                            <button type="button" className="btn btn-primary btn-sm" onClick={saveSection}>Save</button>
                          )}
                        </div>
                        {isEditing && (
                          <div className="section-editor" style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
                            <div className="editor-grid">
                              {renderSectionFormFields(section.type, sectionForm.data)}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Panel>
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
          <div style={{ padding: 16, maxHeight: '70vh', overflow: 'auto' }}>
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