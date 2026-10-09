import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Eye, Edit3, Trash2, FileText, GripVertical, X, ChevronDown, ChevronUp, Copy, Shield, Lock, Unlock, Globe, LayoutDashboard, Grid, Clock } from 'lucide-react';
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
  const [activeSettingsTab, setActiveSettingsTab] = useState('general');
  const [showSectionToolbar, setShowSectionToolbar] = useState(false);

  // Section management state
  const [sections, setSections] = useState([]);
  const [editingSection, setEditingSection] = useState(null);
  const [sectionForm, setSectionForm] = useState({ type: '', data: {} });
  const dragSectionId = useRef(null);
  const searchInputRef = useRef(null);
  const firstSectionRef = useRef(null);
  const editorModalRef = useRef(null);

  // Phase 5: CSS Animations & Focus Management
  useEffect(() => {
    const styleId = 'pages-tab-animations';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      @keyframes pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(var(--primary-rgb), 0.4); } 50% { box-shadow: 0 0 0 8px rgba(var(--primary-rgb), 0); } }
      @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
      .section-item { animation: slideIn 0.25s ease-out; }
      .section-item.removing { animation: slideIn 0.2s ease-in reverse; }
      .section-editor { animation: fadeIn 0.2s ease-out; }
      .section-toolbar-btn { animation: fadeIn 0.15s ease-out; }
      .drag-over { animation: pulse 1s infinite; }
      .invalid-field { animation: shake 0.4s ease-in-out; }
      @media (prefers-reduced-motion: reduce) { .section-item, .section-editor, .section-toolbar-btn { animation: none !important; } .drag-over { animation: none !important; } .invalid-field { animation: none !important; } }
    `;
    document.head.appendChild(style);
    return () => { const el = document.getElementById(styleId); if (el) el.remove(); };
  }, []);

  // Focus management for editor modal
  useEffect(() => {
    if (editing || showCreate) {
      const modal = editorModalRef.current;
      if (modal) {
        const focusable = modal.querySelector('input, select, textarea, button');
        focusable?.focus();
      }
    }
  }, [editing, showCreate]);

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

  // Settings tab renderer
  const renderSettingsTab = (tab) => {
    const generalFields = templateFields.filter(f => ['slug', 'title', 'template'].includes(f.key));
    const seoFields = templateFields.filter(f => ['meta_title', 'meta_description'].includes(f.key));
    const heroFields = templateFields.filter(f => ['hero_title', 'hero_subtitle', 'hero_image', 'hero_cta_text', 'hero_cta_link'].includes(f.key));
    const contentFields = templateFields.filter(f => ['content_markdown', 'content_html'].includes(f.key));

    const fieldGroups = {
      general: [
        ...generalFields,
        { key: 'is_active', label: 'Published', type: 'checkbox', hint: 'Page is published and accessible' },
      ],
      seo: seoFields,
      hero: heroFields,
      content: contentFields,
      navigation: [
        { key: 'show_in_nav', label: 'Show in Navigation', type: 'checkbox', hint: 'Display in site header/footer navigation' },
        { key: 'nav_order', label: 'Navigation Order', type: 'number', placeholder: '0', hint: 'Lower numbers appear first' },
      ],
    };

    const fields = fieldGroups[tab] || [];
    const requiredFields = ['slug', 'title'];
    const hasValue = (key) => form[key] && String(form[key]).trim().length > 0;

    return fields.map((f) => {
      const isRequired = requiredFields.includes(f.key);
      const isValid = !isRequired || hasValue(f.key);
      return (
        <Field key={f.key} label={f.label} hint={f.full ? 'full' : f.hint}>
          <div style={{ position: 'relative' }}>
            {f.type === 'textarea' ? (
              <textarea className="input" rows={f.full ? 12 : 4} value={form[f.key] || ''}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} />
            ) : f.type === 'select' ? (
              <select className="input" value={form[f.key] || ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                {f.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : f.type === 'checkbox' ? (
              <label className="editor-toggle">
                <Toggle checked={form[f.key] === true} onChange={(v) => setForm({ ...form, [f.key]: v })} />
                {f.label}
              </label>
            ) : f.type === 'number' ? (
              <input className="input" type="number" min="0" value={form[f.key] || 0}
                onChange={(e) => setForm({ ...form, [f.key]: Number(e.target.value) })} placeholder={f.placeholder} />
            ) : (
              <input className="input" type="text" value={form[f.key] || ''}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder} />
            )}
            {isRequired && !isValid && (
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--danger)', fontSize: 12 }}>
                Required
              </span>
            )}
          </div>
        </Field>
      );
    });
  };

  // Section type color map
  const SECTION_COLORS = {
    hero: '#22c55e',
    richtext: '#3b82f6',
    image_text: '#8b5cf6',
    products: '#f59e0b',
    categories: '#ec4899',
    faq: '#06b6d4',
    reviews: '#ef4444',
    image_gallery: '#84cc16',
    video: '#f97316',
    cta_banner: '#6366f1',
    divider: '#64748b',
    spacer: '#94a3b8',
  };

  // Section Toolbar Component - Enhanced with Search, Recently Used, Shortcuts
  const SectionToolbar = ({ onAddSection }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState('categorized'); // 'categorized' | 'grid' | 'recent'
    const [recentlyUsed, setRecentlyUsed] = useState(() => {
      try {
        const stored = localStorage.getItem('pages-recent-sections');
        return stored ? JSON.parse(stored) : [];
      } catch { return []; }
    });

    const categories = [
      { label: 'Layout', types: ['hero', 'image_text', 'divider', 'spacer'] },
      { label: 'Content', types: ['richtext', 'faq', 'reviews'] },
      { label: 'Dynamic', types: ['products', 'categories'] },
      { label: 'Media', types: ['image_gallery', 'video'] },
      { label: 'Marketing', types: ['cta_banner'] },
    ];

    const allTypes = SECTION_TYPES.map(t => t.type);
    const filteredTypes = searchQuery
      ? allTypes.filter(t => {
          const info = SECTION_TYPES.find(st => st.type === t);
          return info && (info.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         info.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.includes(searchQuery.toLowerCase()));
        })
      : allTypes;

    const handleAddSection = (type) => {
      onAddSection(type);
      setShowSectionToolbar(false);
      // Update recently used
      setRecentlyUsed(prev => {
        const filtered = prev.filter(t => t !== type);
        const updated = [type, ...filtered].slice(0, 5);
        try { localStorage.setItem('pages-recent-sections', JSON.stringify(updated)); } catch {}
        return updated;
      });
    };

    const renderSectionButton = (type, color) => {
      const typeInfo = SECTION_TYPES.find(st => st.type === type);
      if (!typeInfo) return null;
      return (
        <button
          key={type}
          type="button"
          className="btn btn-outline section-toolbar-btn"
          onClick={() => handleAddSection(type)}
          title={`${typeInfo.description} ${viewMode === 'grid' ? '' : '(Click to add)'}`}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: viewMode === 'grid' ? '12px' : '8px 12px',
            borderLeft: `3px solid ${color}`, background: 'var(--card)',
            transition: 'all 0.15s',
            flexDirection: viewMode === 'grid' ? 'column' : 'row',
            textAlign: viewMode === 'grid' ? 'center' : 'left',
            minWidth: viewMode === 'grid' ? 100 : undefined,
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'var(--card)'}
        >
          <span style={{ fontSize: viewMode === 'grid' ? 24 : 18 }}>{typeInfo.icon}</span>
          <span style={{ fontSize: 13, fontWeight: 500 }}>{typeInfo.label}</span>
          {viewMode === 'grid' && (
            <span style={{ fontSize: 10, color: 'var(--muted)', marginTop: 4, whiteSpace: 'normal', lineHeight: 1.3 }}>
              {typeInfo.description}
            </span>
          )}
        </button>
      );
    };

    // Keyboard shortcut handler
    useEffect(() => {
      const handleKeyDown = (e) => {
        if (!showSectionToolbar) return;
        // Number keys 1-9 for quick add
        if (e.key >= '1' && e.key <= '9') {
          const idx = parseInt(e.key) - 1;
          if (filteredTypes[idx]) handleAddSection(filteredTypes[idx]);
        }
        // Escape to close
        if (e.key === 'Escape') setShowSectionToolbar(false);
        // / to focus search
        if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showSectionToolbar, filteredTypes]);

    const searchInputRef = useRef(null);

    return (
      <div style={{ marginBottom: 16 }}>
        {/* Toolbar Header with Search & View Toggle */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)', pointerEvents: 'none' }}>
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search sections... (press / to focus)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input"
              style={{ paddingLeft: 36, width: '100%' }}
              autoFocus
            />
          </div>
          <div style={{ display: 'flex', gap: 4, background: 'var(--card)', padding: 4, borderRadius: 6, border: '1px solid var(--border)' }}>
            {['categorized', 'grid', 'recent'].map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                style={{
                  padding: '6px 10px',
                  border: 'none',
                  background: viewMode === mode ? 'var(--primary)' : 'transparent',
                  color: viewMode === mode ? 'white' : 'var(--text)',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                title={mode === 'categorized' ? 'Categorized view' : mode === 'grid' ? 'Grid view' : 'Recently used'}
              >
                {mode === 'categorized' && <LayoutDashboard size={14} />}
                {mode === 'grid' && <Grid size={14} />}
                {mode === 'recent' && <Clock size={14} />}
              </button>
            ))}
          </div>
        </div>

        {/* Recently Used - always show at top if available */}
        {viewMode === 'recent' || (recentlyUsed.length > 0 && viewMode !== 'grid' && !searchQuery) ? (
          <div style={{ marginBottom: viewMode === 'recent' ? 0 : 16 }}>
            {viewMode !== 'recent' && (
              <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={12} /> Recently Used
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {recentlyUsed.map(t => {
                const color = SECTION_COLORS[t] || '#64748b';
                return renderSectionButton(t, color);
              })}
            </div>
          </div>
        ) : null}

        {/* Categorized View */}
        {viewMode === 'categorized' && (
          <div>
            {categories.map((cat) => (
              <div key={cat.label} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 8, letterSpacing: 0.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                  {cat.label}
                  <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400, textTransform: 'none' }}>
                    ({cat.types.filter(t => filteredTypes.includes(t)).length})
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {cat.types.filter(t => filteredTypes.includes(t)).map(t => {
                    const color = SECTION_COLORS[t] || '#64748b';
                    return renderSectionButton(t, color);
                  })}
                </div>
              </div>
            ))}
            {searchQuery && filteredTypes.length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--muted)' }}>
                No sections match "{searchQuery}"
              </div>
            )}
          </div>
        )}

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
            {filteredTypes.map(t => {
              const color = SECTION_COLORS[t] || '#64748b';
              return renderSectionButton(t, color);
            })}
            {filteredTypes.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 20, color: 'var(--muted)' }}>
                No sections match "{searchQuery}"
              </div>
            )}
          </div>
        )}

        {/* Keyboard Shortcuts Hint */}
        <details style={{ marginTop: 16 }}>
          <summary style={{ cursor: 'pointer', color: 'var(--muted)', fontSize: 12, padding: '8px 0' }}>
            Keyboard Shortcuts
          </summary>
          <div style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 2, fontFamily: 'monospace' }}>
            <div><kbd style={{ padding: '2px 6px', background: 'var(--bg)', borderRadius: 3, border: '1px solid var(--border)' }}>1-9</kbd> Add section by number</div>
            <div><kbd style={{ padding: '2px 6px', background: 'var(--bg)', borderRadius: 3, border: '1px solid var(--border)' }}>/</kbd> Focus search</div>
            <div><kbd style={{ padding: '2px 6px', background: 'var(--bg)', borderRadius: 3, border: '1px solid var(--border)' }}>Esc</kbd> Close toolbar</div>
          </div>
        </details>
      </div>
    );
  };

  // Helper: Get section summary for preview
  const getSectionSummary = (section) => {
    const data = section.data || {};
    switch (section.type) {
      case 'hero': return data.title || data.subtitle ? `${data.title || ''} ${data.subtitle || ''}`.trim() : 'Hero banner';
      case 'richtext': return data.content ? 'Rich text content' : 'Empty';
      case 'image_text': return data.title || 'Image + Text';
      case 'products': return data.title || `${data.source || 'featured'} products`;
      case 'categories': return data.title || `Categories (${data.category_ids?.split(',').filter(Boolean).length || 'all'})`;
      case 'faq': return `${data.items?.length || 0} FAQs`;
      case 'reviews': return `${data.items?.length || 0} Reviews`;
      case 'image_gallery': return `${data.images?.length || 0} Images`;
      case 'video': return data.title || 'Video embed';
      case 'cta_banner': return data.title || data.button_text ? `CTA: ${data.button_text}` : 'CTA Banner';
      case 'divider': return data.label || 'Divider';
      case 'spacer': return `${data.height || 'medium'} spacer`;
      default: return 'Custom section';
    }
  };

  // Section List Component - Enhanced
  const SectionList = ({
    sections, editingSection, sectionForm, onEditSection, onSaveSection,
    onRemoveSection, onToggleSection, onDuplicateSection, onMoveSection,
    onStartDrag, onAllowDrop, onDrop, renderSectionFields
  }) => {
    const [dragOverId, setDragOverId] = useState(null);
    const editorRef = useRef(null);

    // Focus first input when section editor opens
    useEffect(() => {
      if (editingSection && editorRef.current) {
        const input = editorRef.current.querySelector('input, select, textarea');
        input?.focus();
      }
    }, [editingSection]);

    if (sections.length === 0) {
      return (
        <div className="empty" style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
          <div style={{ 
            width: 80, height: 80, borderRadius: '50%', background: 'rgba(var(--primary-rgb), 0.1)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' 
          }}>
            <LayoutDashboard size={40} style={{ color: 'var(--primary)' }} />
          </div>
          <h3 style={{ marginBottom: 8, fontSize: 18, fontWeight: 600 }}>No sections yet</h3>
          <p style={{ marginBottom: 24, maxWidth: 300, margin: '0 auto 24px', lineHeight: 1.6 }}>
            Build your page by adding content sections. Each section type serves a different purpose — 
            from hero banners to product grids.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => setShowSectionToolbar(true)}>
            <Plus size={16} /> Add First Section
          </button>
          <p style={{ marginTop: 16, fontSize: 12, color: 'var(--muted)' }}>
            Tip: Press <kbd style={{ padding: '2px 6px', background: 'var(--bg)', borderRadius: 3, border: '1px solid var(--border)' }}>/</kbd> to search sections
          </p>
        </div>
      );
    }

    return (
      <div className="sections-list" role="list" aria-label="Page sections">
        {sections.map((section, index) => {
          const typeInfo = SECTION_TYPES.find(t => t.type === section.type);
          const isEditing = editingSection === section.id;
          const sectionColor = SECTION_COLORS[section.type] || '#64748b';
          const summary = getSectionSummary(section);
          const isDragOver = dragOverId === section.id;

          return (
            <div
              key={section.id}
              className="section-item"
              role="listitem"
              aria-label={`${typeInfo?.label || section.type} section, ${section.enabled ? 'visible' : 'hidden'}, order ${section.order ?? index + 1}`}
              style={{
                border: '1px solid var(--border)',
                borderLeft: `4px solid ${section.enabled ? sectionColor : 'var(--border)'}`,
                borderRadius: 8,
                marginBottom: 12,
                background: 'var(--card)',
                overflow: 'hidden',
                opacity: section.enabled ? 1 : 0.6,
                transition: 'all 0.15s',
                boxShadow: isDragOver ? '0 0 0 2px var(--primary)' : 'none',
              }}
            >
              <div
                className="section-header"
                style={{
                  display: 'flex', alignItems: 'center', padding: 12, gap: 12,
                  cursor: 'grab', borderBottom: isEditing ? 'none' : '1px solid var(--border)',
                  background: isDragOver ? 'rgba(var(--primary-rgb), 0.05)' : 'transparent',
                }}
                onDragOver={(e) => { e.preventDefault(); setDragOverId(section.id); }}
                onDragLeave={() => setDragOverId(null)}
                onDrop={(e) => { e.preventDefault(); setDragOverId(null); onDrop(section.id)(e); }}
              >
                <button
                  type="button"
                  className="drag-handle"
                  onDragStart={onStartDrag(section.id)}
                  onDragOver={onAllowDrop}
                  draggable
                  title="Drag to reorder"
                  style={{ padding: 4, borderRadius: 4, color: 'var(--muted)', flexShrink: 0 }}
                  aria-label="Drag to reorder"
                  aria-grabbed="false"
                >
                  <GripVertical size={20} />
                </button>
                <span style={{ fontSize: 20, flexShrink: 0 }} aria-hidden="true">{typeInfo?.icon || '📦'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <strong style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 14 }}>
                    {typeInfo?.label || section.type}
                  </strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    <span className={`pill ${section.enabled ? 'pill-on' : 'pill-off'}`} style={{ fontSize: 11 }}>
                      {section.enabled ? 'Visible' : 'Hidden'}
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'monospace' }}>
                      Order: {section.order ?? index + 1}
                    </span>
                    {summary && (
                      <span style={{ fontSize: 11, color: 'var(--muted)', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'inline-block' }}>
                        {summary}
                      </span>
                    )}
                  </div>
                </div>
                {!isEditing ? (
                  <>
                    <button type="button" className="icon-action" onClick={() => onEditSection(section)} title="Edit" style={{ padding: 6 }} aria-label="Edit section"><Edit3 size={16} /></button>
                    <button type="button" className="icon-action" onClick={() => onDuplicateSection(section)} title="Duplicate" style={{ padding: 6 }} aria-label="Duplicate section"><Copy size={16} /></button>
                    <button type="button" className="icon-action" onClick={() => onToggleSection(section.id)} title={section.enabled ? 'Hide' : 'Show'} style={{ padding: 6 }} aria-label={section.enabled ? 'Hide section' : 'Show section'}><Eye size={16} /></button>
                    <button type="button" className="icon-action danger" onClick={() => onRemoveSection(section.id)} title="Remove" style={{ padding: 6 }} aria-label="Remove section"><Trash2 size={16} /></button>
                  </>
                ) : (
                  <button type="button" className="btn btn-primary btn-sm" onClick={onSaveSection} style={{ marginLeft: 8 }}>Save</button>
                )}
              </div>
              {isEditing && (
                <div ref={editorRef} className="section-editor" role="region" aria-label="Section editor" style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
                  <div className="editor-grid" style={{ display: 'grid', gap: 16 }}>
                    {renderSectionFields(section.type, sectionForm.data)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
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
          ref={editorModalRef}
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
          <div className="editor-layout" style={{ maxHeight: '75vh', overflow: 'hidden', display: 'flex' }}>
            <aside className="editor-sidebar" style={{ width: 380, flexShrink: 0, overflow: 'auto', borderRight: '1px solid var(--border)', background: 'var(--card)', padding: 16 }}>
              <Panel title="Page Settings" icon={FileText}>
                <nav className="settings-tabs" style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  {['general', 'seo', 'hero', 'content', 'navigation'].map(tab => (
                    <button key={tab} type="button"
                      className={`settings-tab ${activeSettingsTab === tab ? 'active' : ''}`}
                      onClick={() => setActiveSettingsTab(tab)}
                      style={{
                        padding: '8px 16px',
                        border: 'none',
                        background: activeSettingsTab === tab ? 'var(--primary)' : 'transparent',
                        color: activeSettingsTab === tab ? 'white' : 'var(--text)',
                        borderRadius: '6px 6px 0 0',
                        fontWeight: 500,
                        fontSize: 13,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                        marginBottom: -1,
                        borderBottom: activeSettingsTab === tab ? '2px solid var(--primary)' : '2px solid transparent',
                      }}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                  ))}
                </nav>
                {renderSettingsTab(activeSettingsTab)}
              </Panel>
            </aside>
            <main className="editor-canvas" style={{ flex: 1, overflow: 'auto', padding: 16, background: 'var(--bg)' }}>
              <Panel title="Content Sections" icon={LayoutDashboard}>
                <SectionToolbar onAddSection={addSection} />
                {sections.length === 0 ? (
                  <div className="empty" style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
                    <LayoutDashboard size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                    <h3 style={{ marginBottom: 8 }}>No sections yet</h3>
                    <p style={{ marginBottom: 20 }}>Add sections from the toolbar above to build your page content.</p>
                    <button type="button" className="btn btn-primary" onClick={() => setShowSectionToolbar(true)}>
                      <Plus size={16} /> Add First Section
                    </button>
                  </div>
                ) : (
                  <SectionList
                    sections={sections}
                    editingSection={editingSection}
                    sectionForm={sectionForm}
                    onEditSection={editSection}
                    onSaveSection={saveSection}
                    onRemoveSection={removeSection}
                    onToggleSection={toggleSection}
                    onDuplicateSection={duplicateSection}
                    onMoveSection={moveSection}
                    onStartDrag={startDrag}
                    onAllowDrop={allowDrop}
                    onDrop={onDrop}
                    renderSectionFields={renderSectionFormFields}
                  />
                )}
              </Panel>
            </main>
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