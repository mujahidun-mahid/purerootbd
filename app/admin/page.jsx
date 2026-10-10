'use client';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Database, LogIn, ShieldCheck, Zap, RefreshCw, Radio, Lock, Eye } from 'lucide-react';

import AdminShell from '@/components/admin/AdminShell';
import DetailModal from '@/components/admin/DetailModal';
import { Alert } from '@/components/admin/ui';

import OverviewTab from '@/components/admin/tabs/OverviewTab';
import OrdersTab from '@/components/admin/tabs/OrdersTab';
import CustomersTab from '@/components/admin/tabs/CustomersTab';
import CatalogTab from '@/components/admin/tabs/CatalogTab';
import ProductsTab from '@/components/admin/tabs/ProductsTab';
import FeaturedCategoriesTab from '@/components/admin/tabs/FeaturedCategoriesTab';
import AnalyticsTab from '@/components/admin/tabs/AnalyticsTab';
import SettingsTab from '@/components/admin/tabs/SettingsTab';
import ReportsTab from '@/components/admin/tabs/ReportsTab';
import ReturnsTab from '@/components/admin/tabs/ReturnsTab';
import InventoryTab from '@/components/admin/tabs/InventoryTab';
import SuppliersTab from '@/components/admin/tabs/SuppliersTab';
import FulfillmentTab from '@/components/admin/tabs/FulfillmentTab';
import DeliveryTab from '@/components/admin/tabs/DeliveryTab';
import DriversTab from '@/components/admin/tabs/DriversTab';
import PromotionsTab from '@/components/admin/tabs/PromotionsTab';
import LoyaltyTab from '@/components/admin/tabs/LoyaltyTab';
import SupportTab from '@/components/admin/tabs/SupportTab';
import PaymentsTab from '@/components/admin/tabs/PaymentsTab';
import RolesTab from '@/components/admin/tabs/RolesTab';
import IntegrationsTab from '@/components/admin/tabs/IntegrationsTab';
import AuditTab from '@/components/admin/tabs/AuditTab';
import PagesTab from '@/components/admin/tabs/PagesTab';

const IDENTITY_KEYS = [
  'site_name',
  'site_tagline',
  'logo_image_url',
  'site_description',
  'meta_title',
  'meta_description',
  'footer_text',
  'contact_phone',
  'contact_email',
  'contact_address',
  'announcement',
  'announcement_enabled',
  'announcement_url',
  'hero_eyebrow',
  'hero_offer',
  'hero_cta_text',
  'hero_cta_link',
  'hero_secondary_text',
  'hero_secondary_link',
  'promo_banners',
  'category_strip_enabled',
  'featured_enabled',
  'featured_title',
  'featured_subtitle',
  'featured_limit',
  'featured_product_ids'
];

export default function AdminPage() {
  const [password, setPassword] = useState('');
  const [sessionPassword, setSessionPassword] = useState('');
  const [logged, setLogged] = useState(false);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('overview');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [file, setFile] = useState(null);
  const [heroUrl, setHeroUrl] = useState('');
  const [heroTitle, setHeroTitle] = useState('');
  const [heroSubtitle, setHeroSubtitle] = useState('');
  const [identity, setIdentity] = useState(() =>
    Object.fromEntries(IDENTITY_KEYS.map((k) => [k, '']))
  );
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');
  const [navOpen, setNavOpen] = useState(false);

  const supabaseClientRef = useRef(null);
  const seededRef = useRef(false);
  const sessionSeqRef = useRef(0);

  // Initialize client-side Supabase for Realtime subscriptions
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (url && anonKey) {
      try {
        supabaseClientRef.current = createClient(url, anonKey, {
          auth: { persistSession: false, autoRefreshToken: false }
        });
      } catch (e) {
        console.warn('Could not initialize Supabase Realtime client:', e);
      }
    }
  }, []);

  const headers = useCallback(
    () => (sessionPassword ? { 'x-admin-password': sessionPassword } : {}),
    [sessionPassword]
  );

  const recordAudit = useCallback(
    (action, detail = {}) => {
      if (!sessionPassword) return;
      fetch('/api/admin/audit', {
        method: 'POST',
        headers: { 'x-admin-password': sessionPassword, 'content-type': 'application/json' },
        body: JSON.stringify({ action, detail })
      }).catch(() => {});
    },
    [sessionPassword]
  );

  // Success banners fade out on their own; errors stay until dismissed.
  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(''), 6000);
    return () => clearTimeout(timer);
  }, [message]);

  const load = useCallback(
    async (showLoading = false, pw = sessionPassword) => {
      if (showLoading) setLoading(true);
      setError('');
      const seq = ++sessionSeqRef.current;
      try {
        const res = await fetch('/api/admin/dashboard', {
          headers: pw ? { 'x-admin-password': pw } : {},
          cache: 'no-store'
        });
        if (seq !== sessionSeqRef.current) return;

        if (res.status === 401) {
          setLogged(false);
          setSessionPassword('');
          setError(showLoading || logged ? 'Invalid admin password or session expired.' : '');
          return;
        }

        const resData = await res.json();
        if (seq !== sessionSeqRef.current) return;
        if (!res.ok) throw new Error(resData.error || 'Failed to fetch dashboard data');

        setData(resData);
        setLogged(true);
        setLastSync(new Date());

        const s = resData.siteSettings;
        if (s && !seededRef.current) {
          seededRef.current = true;
          setHeroUrl(s.hero_image_url || '');
          setHeroTitle(s.hero_title || '');
          setHeroSubtitle(s.hero_subtitle || '');
          setIdentity((prev) => {
            const next = { ...prev };
            for (const k of IDENTITY_KEYS) next[k] = s[k] ?? prev[k] ?? '';
            return next;
          });
        }
      } catch (e) {
        console.error('Admin load error:', e);
        if (seq === sessionSeqRef.current) setError(e.message || 'Could not load admin data');
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [sessionPassword, logged]
  );

  // Initial session restore (cookie based) - run exactly once on mount
  const initRef = useRef(false);
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    load(false);
  }, [load]);

  // Dual Realtime: 1) Supabase Realtime Broadcast Channel
  useEffect(() => {
    if (!logged || !supabaseClientRef.current) return;
    const sb = supabaseClientRef.current;

    const channel = sb
      .channel('pure-roots-admin-events')
      .on('broadcast', { event: 'admin_data_changed' }, () => load(false))
      .subscribe((status) => setConnected(status === 'SUBSCRIBED'));

    return () => sb.removeChannel(channel);
  }, [logged, load]);

  // Dual Realtime: 2) Background Polling Heartbeat (every 5 seconds)
  useEffect(() => {
    if (!logged) return;
    const interval = setInterval(() => load(false), 5000);
    return () => clearInterval(interval);
  }, [logged, load]);

  async function putSettings(pairs) {
    for (const [key, value] of pairs) {
      const r = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { ...headers(), 'content-type': 'application/json' },
        body: JSON.stringify({ key, value })
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d.error || `Could not save ${key}`);
      }
    }
  }

  async function login() {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const j = await res.json().catch(() => ({}));
      if (res.ok) {
        setSessionPassword(password);
        setPassword('');
        setLogged(true);
        await load(true, password);
      } else {
        setError(j.error || 'Invalid admin password');
      }
    } catch {
      setError('Could not connect to authentication service.');
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    sessionSeqRef.current += 1;
    try {
      await fetch('/api/admin/login', { method: 'DELETE' });
    } catch {
      // session cookie cleanup is best effort
    }
    setSessionPassword('');
    setPassword('');
    setLogged(false);
    setData(null);
    seededRef.current = false;
    setConnected(false);
    setError('');
    setMessage('');
    setLoading(false);
    setTab('overview');
    setQuery('');
    setStatusFilter('all');
    setSelected(null);
    setNavOpen(false);
  }

  async function updateStatus(id, newStatus) {
    try {
      setMessage('');
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { ...headers(), 'content-type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Could not update status');
      setMessage(`Order status updated to "${newStatus}".`);
      const orderNo = orders.find((o) => o.id === id)?.order_number || id;
      recordAudit('order.status', { order: orderNo, status: newStatus });

      // Optimistic update
      setData((prev) =>
        prev
          ? {
              ...prev,
              orders: prev.orders.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
            }
          : prev
      );

      if (selected && selected.id === id) setSelected((prev) => ({ ...prev, status: newStatus }));
      load(false);
    } catch (e) {
      setError(e.message || 'Status update failed.');
    }
  }

  async function uploadHero() {
    if (!file) return setMessage('Choose an image file first.');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/admin/hero', { method: 'POST', headers: headers(), body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setHeroUrl(d.url);
      setMessage('Hero image uploaded and published successfully!');
      setFile(null);
      load(false);
    } catch (e) {
      setMessage(e.message || 'Failed to upload hero image');
    } finally {
      setLoading(false);
    }
  }

  async function saveHeroUrl() {
    try {
      const r = await fetch('/api/admin/hero', {
        method: 'PUT',
        headers: { ...headers(), 'content-type': 'application/json' },
        body: JSON.stringify({ url: heroUrl })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      setMessage('Hero image URL saved.');
      load(false);
    } catch (e) {
      setMessage(e.message);
    }
  }

  async function saveCopy() {
    setSaving(true);
    try {
      await putSettings([
        ['hero_title', heroTitle],
        ['hero_subtitle', heroSubtitle]
      ]);
      setMessage('Homepage copy saved.');
      recordAudit('settings.copy', { hero_title: heroTitle });
      load(false);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function saveIdentity() {
    setSaving(true);
    try {
      await putSettings(IDENTITY_KEYS.map((k) => [k, identity[k] ?? '']));
      setMessage('Site identity saved. The storefront updates instantly.');
      recordAudit('settings.identity', { keys: IDENTITY_KEYS.join(',') });
      load(false);
    } catch (e) {
      setMessage(e.message);
    } finally {
      setSaving(false);
    }
  }

  function exportOrdersCSV() {
    const list = data?.orders || [];
    if (!list.length) return alert('No orders to export.');

    const cols = [
      'Order Number',
      'Placed At',
      'Customer Name',
      'Phone',
      'Email',
      'Address',
      'Area',
      'District',
      'Division',
      'Payment Method',
      'Subtotal',
      'Delivery Fee',
      'Total',
      'Status',
      'Items'
    ];

    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

    const rows = list.map((o) => {
      const c = o.customer || {};
      const itemsStr = (o.items || []).map((x) => `${x.name} (${x.size} x ${x.qty})`).join('; ');
      return [
        escape(o.order_number),
        escape(new Date(o.placed_at).toLocaleString('en-BD')),
        escape(c.name || ''),
        escape(o.phone || ''),
        escape(c.email || ''),
        escape(c.address || ''),
        escape(c.area || ''),
        escape(c.district || ''),
        escape(c.division || ''),
        escape(o.payment_method),
        escape(o.subtotal),
        escape(o.delivery_fee),
        escape(o.total),
        escape(o.status),
        escape(itemsStr)
      ].join(',');
    });

    const csv = 'data:text/csv;charset=utf-8,' + encodeURIComponent([cols.join(','), ...rows].join('\r\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csv);
    link.setAttribute('download', `pure-roots-orders-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const orders = data?.orders || [];
  const customers = data?.customers || [];

  const filteredOrders = useMemo(
    () =>
      orders.filter((o) => {
        const matchesQuery = `${o.order_number} ${o.phone} ${o.customer?.name || ''} ${o.status}`
          .toLowerCase()
          .includes(query.toLowerCase());
        const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchesQuery && matchesStatus;
      }),
    [orders, query, statusFilter]
  );

  const filteredCustomers = useMemo(
    () =>
      customers.filter((c) =>
        `${c.name} ${c.phone} ${c.email} ${c.address}`.toLowerCase().includes(query.toLowerCase())
      ),
    [customers, query]
  );

  function selectTab(id) {
    setTab(id);
    setQuery('');
  }

  const navCounts = useMemo(() => {
    const openOrders = orders.filter((o) => !['Delivered', 'Cancelled'].includes(o.status)).length;
    const cancelled = orders.filter((o) => o.status === 'Cancelled').length;
    return { orders: openOrders, returns: cancelled };
  }, [orders]);

  // -------------------------------------------------------------
  // LOGIN SCREEN
  // -------------------------------------------------------------
  if (!logged) {
    return (
      <main className="admin-app admin-login-screen">
        <section className="admin-login-art">
          <div className="admin-brand">
            <span>
              <ShieldCheck size={22} />
            </span>
            <div>
              <strong>PURE ROOTS</strong>
              <small>Control Center</small>
            </div>
          </div>

          <div>
            <div className="admin-kicker" style={{ color: '#7fd6a4' }}>
              Secure Admin Console
            </div>
            <h2>
              Run your store <em>with clarity.</em>
            </h2>
            <p>
              Real-time orders, customer profiles, live analytics, and store controls powered by
              Supabase Realtime.
            </p>

            <div className="admin-login-points">
              <div>
                <Radio size={16} /> Live order + visitor streaming
              </div>
              <div>
                <Zap size={16} /> Instant site settings, no redeploy
              </div>
              <div>
                <Lock size={16} /> Server-side protected credentials
              </div>
            </div>
          </div>

          <div className="admin-login-foot" style={{ borderTop: '1px solid rgba(255,255,255,.12)' }}>
            <Database size={14} /> Server-side protected • Supabase Realtime active
          </div>
        </section>

        <section className="admin-login-form">
          <div className="admin-kicker">Welcome back</div>
          <h1>Sign in to the console</h1>
          <p>Enter your admin password to access orders, customers and site controls.</p>

          <label>Admin password</label>
          <div className="admin-password">
            <Lock size={17} />
            <input
              autoFocus
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
              placeholder="Enter admin password"
            />
            <button type="button" onClick={login} disabled={loading} title="Sign In">
              <LogIn size={17} />
            </button>
          </div>

          {error && (
            <Alert type="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <button
            type="button"
            className="btn btn-primary admin-login-submit"
            onClick={login}
            disabled={loading}
          >
            {loading ? <RefreshCw size={16} className="spin" /> : <LogIn size={16} />}
            {loading ? 'Verifying…' : 'Enter Console'}
          </button>

          <div className="admin-login-foot">
            <Eye size={14} /> Sessions expire automatically. Activity is logged to Supabase.
          </div>
        </section>
      </main>
    );
  }

  // -------------------------------------------------------------
  // MAIN DASHBOARD CONSOLE
  // -------------------------------------------------------------
  return (
    <AdminShell
      tab={tab}
      onSelect={selectTab}
      connected={connected}
      lastSync={lastSync}
      loading={loading}
      onRefresh={() => load(true)}
      onLogout={logout}
      navOpen={navOpen}
      onToggleNav={() => setNavOpen((v) => !v)}
      onCloseNav={() => setNavOpen(false)}
      message={message}
      onDismissMessage={() => setMessage('')}
      error={error}
      onDismissError={() => setError('')}
      counts={navCounts}
      modal={
        selected && (
          <DetailModal
            item={selected}
            history={data?.statusHistory || []}
            onClose={() => setSelected(null)}
            onStatus={updateStatus}
          />
        )
      }
    >
      {tab === 'overview' && (
        <OverviewTab data={data} onOrder={setSelected} onOrders={() => setTab('orders')} />
      )}

      {tab === 'orders' && (
        <OrdersTab
          orders={filteredOrders}
          allOrdersCount={orders.length}
          query={query}
          setQuery={setQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          onStatus={updateStatus}
          onOrder={setSelected}
          onExport={exportOrdersCSV}
          password={sessionPassword}
        />
      )}

      {tab === 'customers' && (
        <CustomersTab
          customers={filteredCustomers}
          query={query}
          setQuery={setQuery}
          onCustomer={(c) => setSelected({ customerView: c })}
        />
      )}

      {tab === 'catalog' && <CatalogTab password={sessionPassword} />}

      {tab === 'products' && <ProductsTab password={sessionPassword} />}

      {tab === 'featured-categories' && <FeaturedCategoriesTab password={sessionPassword} />}

      {tab === 'analytics' && <AnalyticsTab data={data} />}

      {tab === 'settings' && (
        <SettingsTab
          data={data}
          heroUrl={heroUrl}
          setHeroUrl={setHeroUrl}
          heroTitle={heroTitle}
          setHeroTitle={setHeroTitle}
          heroSubtitle={heroSubtitle}
          setHeroSubtitle={setHeroSubtitle}
          file={file}
          setFile={setFile}
          uploadHero={uploadHero}
          saveHeroUrl={saveHeroUrl}
          saveCopy={saveCopy}
          identity={identity}
          setIdentity={setIdentity}
          saveIdentity={saveIdentity}
          loading={loading || saving}
        />
      )}

      {tab === 'reports' && (
        <ReportsTab
          data={data}
          orders={orders}
          customers={customers}
          onExportOrders={exportOrdersCSV}
        />
      )}

      {tab === 'returns' && (
        <ReturnsTab password={sessionPassword} orders={orders} onStatus={updateStatus} />
      )}

      {tab === 'inventory' && <InventoryTab password={sessionPassword} />}

      {tab === 'suppliers' && <SuppliersTab password={sessionPassword} />}

      {tab === 'fulfillment' && (
        <FulfillmentTab orders={orders} onStatus={updateStatus} onOrder={setSelected} />
      )}

      {tab === 'delivery' && <DeliveryTab password={sessionPassword} />}

      {tab === 'drivers' && (
        <DriversTab password={sessionPassword} orders={orders} onStatus={updateStatus} />
      )}

      {tab === 'promotions' && <PromotionsTab password={sessionPassword} />}

      {tab === 'loyalty' && <LoyaltyTab password={sessionPassword} customers={customers} />}

      {tab === 'support' && <SupportTab password={sessionPassword} />}

      {tab === 'payments' && (
        <PaymentsTab password={sessionPassword} data={data} saveSetting={putSettings} />
      )}

      {tab === 'roles' && <RolesTab password={sessionPassword} />}

      {tab === 'integrations' && <IntegrationsTab password={sessionPassword} data={data} />}

      {tab === 'audit' && <AuditTab password={sessionPassword} />}

      {tab === 'pages' && <PagesTab password={sessionPassword} />}
    </AdminShell>
  );
}
