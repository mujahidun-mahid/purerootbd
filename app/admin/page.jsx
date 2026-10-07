'use client';
import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Activity,
  BarChart3,
  Box,
  ChevronDown,
  Clock,
  Database,
  Download,
  Eye,
  Image as ImageIcon,
  LayoutDashboard,
  LogIn,
  LogOut,
  Package,
  Phone,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
  X,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { products as catalogProducts } from '@/lib/products';

const statuses = [
  'Order Placed',
  'Order Confirmed',
  'Processing',
  'Packed',
  'Shipped',
  'Out for Delivery',
  'Delivered',
  'Cancelled'
];

const tabs = [
  ['overview', 'Overview', LayoutDashboard],
  ['orders', 'Orders', ShoppingBag],
  ['customers', 'Customers', Users],
  ['catalog', 'Catalog', Package],
  ['analytics', 'Live Analytics', Activity],
  ['settings', 'Site Controls & Health', Settings]
];

const money = (n) => `৳${Number(n || 0).toLocaleString('en-BD')}`;
const phoneMask = (p) => (p ? `${String(p).slice(0, 3)}••••${String(p).slice(-4)}` : '—');

export default function AdminPage() {
  const [password, setPassword] = useState('');
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
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState('');

  const supabaseClientRef = useRef(null);

  // Initialize client-side Supabase for Realtime subscriptions
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
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

  const headers = useCallback(() => {
    return password ? { 'x-admin-password': password } : {};
  }, [password]);

  const load = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/dashboard', {
        headers: headers(),
        cache: 'no-store'
      });

      if (res.status === 401) {
        setLogged(false);
        if (showLoading) setError('Invalid admin password or session expired.');
        return;
      }

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to fetch dashboard data');
      }

      setData(resData);
      setLogged(true);
      setLastSync(new Date());

      if (resData.siteSettings) {
        if (!heroUrl && resData.siteSettings.hero_image_url) setHeroUrl(resData.siteSettings.hero_image_url);
        if (!heroTitle && resData.siteSettings.hero_title) setHeroTitle(resData.siteSettings.hero_title);
        if (!heroSubtitle && resData.siteSettings.hero_subtitle) setHeroSubtitle(resData.siteSettings.hero_subtitle);
      }
    } catch (e) {
      console.error('Admin load error:', e);
      setError(e.message || 'Could not load admin data');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [headers, heroUrl, heroTitle, heroSubtitle]);

  // Initial check on mount
  useEffect(() => {
    load(false);
  }, [load]);

  // Dual Realtime: 1) Supabase Realtime Channel
  useEffect(() => {
    if (!logged || !supabaseClientRef.current) return;
    const sb = supabaseClientRef.current;

    const channel = sb
      .channel('pure-roots-admin-events')
      .on('broadcast', { event: 'admin_data_changed' }, () => {
        load(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        load(false);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_events' }, () => {
        load(false);
      })
      .subscribe((status) => {
        setConnected(status === 'SUBSCRIBED');
      });

    return () => {
      sb.removeChannel(channel);
    };
  }, [logged, load]);

  // Dual Realtime: 2) Background Polling Heartbeat (every 5 seconds)
  useEffect(() => {
    if (!logged) return;
    const interval = setInterval(() => {
      load(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [logged, load]);

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
        setLogged(true);
        load(true);
      } else {
        setError(j.error || 'Invalid admin password');
      }
    } catch (e) {
      setError('Could not connect to authentication service.');
    } finally {
      setLoading(false);
    }
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

      // Optimistic update
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          orders: prev.orders.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
        };
      });

      if (selected && selected.id === id) {
        setSelected((prev) => ({ ...prev, status: newStatus }));
      }
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
      const r = await fetch('/api/admin/hero', {
        method: 'POST',
        headers: headers(),
        body: fd
      });
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
    try {
      for (const [key, value] of [
        ['hero_title', heroTitle],
        ['hero_subtitle', heroSubtitle]
      ]) {
        const r = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers: { ...headers(), 'content-type': 'application/json' },
          body: JSON.stringify({ key, value })
        });
        if (!r.ok) {
          const d = await r.json();
          throw new Error(d.error);
        }
      }
      setMessage('Homepage copy saved.');
      load(false);
    } catch (e) {
      setMessage(e.message);
    }
  }

  function exportOrdersCSV() {
    const list = data?.orders || [];
    if (!list.length) return alert('No orders to export.');

    const headersList = [
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

    const rows = list.map((o) => {
      const c = o.customer || {};
      const itemsStr = (o.items || []).map((x) => `${x.name} (${x.size} x ${x.qty})`).join('; ');
      return [
        o.order_number,
        new Date(o.placed_at).toLocaleString('en-BD'),
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${o.phone || ''}"`,
        `"${c.email || ''}"`,
        `"${(c.address || '').replace(/"/g, '""')}"`,
        `"${c.area || ''}"`,
        `"${c.district || ''}"`,
        `"${c.division || ''}"`,
        o.payment_method,
        o.subtotal,
        o.delivery_fee,
        o.total,
        o.status,
        `"${itemsStr.replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headersList.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pure-roots-orders-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const orders = data?.orders || [];
  const customers = data?.customers || [];

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesQuery = `${o.order_number} ${o.phone} ${o.customer?.name || ''} ${o.status}`
        .toLowerCase()
        .includes(query.toLowerCase());
      const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [orders, query, statusFilter]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) =>
      `${c.name} ${c.phone} ${c.email} ${c.address}`.toLowerCase().includes(query.toLowerCase())
    );
  }, [customers, query]);

  // LOGIN SCREEN
  if (!logged) {
    return (
      <main className="admin-app admin-login-screen">
        <div className="admin-login-card">
          <div className="admin-brand">
            <span>
              <ShieldCheck size={24} />
            </span>
            <div>
              <strong>PURE ROOTS</strong>
              <small>Control Center</small>
            </div>
          </div>
          <div className="admin-login-copy">
            <div className="admin-kicker">SECURE ADMIN CONSOLE</div>
            <h1>
              Run your store
              <br />
              <em>with clarity.</em>
            </h1>
            <p>Real-time orders, customer profiles, live analytics, and store controls powered by Supabase.</p>
          </div>
          <label>Admin password</label>
          <div className="admin-password">
            <ShieldCheck size={18} />
            <input
              autoFocus
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && login()}
              placeholder="Enter admin password"
            />
            <button onClick={login} disabled={loading} title="Sign In">
              <LogIn size={17} />
            </button>
          </div>
          {error && <div className="admin-alert error" style={{ margin: '14px 0 0' }}>{error}</div>}
          <div className="admin-login-foot">
            <Database size={14} /> Server-side protected • Supabase Realtime active
          </div>
        </div>
      </main>
    );
  }

  // MAIN DASHBOARD CONSOLE
  return (
    <main className="admin-app">
      {/* SIDEBAR NAVIGATION */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span>
            <ShieldCheck size={21} />
          </span>
          <div>
            <strong>PURE ROOTS</strong>
            <small>Admin Console</small>
          </div>
        </div>

        <nav>
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              className={tab === id ? 'active' : ''}
              onClick={() => {
                setTab(id);
                setQuery('');
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-side-bottom">
          <div className="live-dot">
            <i style={{ background: connected ? '#66d48c' : '#f5a623' }} />
            {connected ? 'Live WebSocket' : 'Polling Active'}
          </div>
          <small>Auto-syncs every 5s</small>
          <button
            onClick={() => setLogged(false)}
            style={{
              marginTop: 12,
              background: 'transparent',
              border: 0,
              color: '#8faea0',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontSize: 11,
              cursor: 'pointer',
              padding: 0
            }}
          >
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN VIEWPORT */}
      <section className="admin-main">
        {/* TOP BAR */}
        <header className="admin-header">
          <div>
            <div className="admin-kicker">CONTROL CENTER</div>
            <h1>{tabs.find((x) => x[0] === tab)?.[1]}</h1>
          </div>
          <div className="admin-header-actions">
            <span className="sync-time">
              <i style={{ background: connected ? '#66d48c' : '#f5a623' }} />
              {lastSync ? `Synced ${lastSync.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : 'Syncing…'}
            </span>
            <button className="admin-refresh" onClick={() => load(true)} disabled={loading} title="Refresh Database">
              <RefreshCw size={17} className={loading ? 'spin' : ''} />
            </button>
          </div>
        </header>

        {/* ALERTS & NOTICES */}
        {message && (
          <div className="admin-alert">
            {message}
            <button onClick={() => setMessage('')}>
              <X size={14} />
            </button>
          </div>
        )}
        {error && (
          <div className="admin-alert error">
            {error}
            <button onClick={() => setError('')}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* TAB PANELS */}
        {tab === 'overview' && (
          <OverviewTab
            data={data}
            onOrder={setSelected}
            onOrders={() => setTab('orders')}
            onUpdateStatus={updateStatus}
          />
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
        {tab === 'catalog' && <CatalogTab />}
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
            loading={loading}
          />
        )}
      </section>

      {/* DETAIL MODAL (ORDERS & CUSTOMERS) */}
      {selected && (
        <DetailModal
          item={selected}
          history={data?.statusHistory || []}
          onClose={() => setSelected(null)}
          onStatus={updateStatus}
        />
      )}
    </main>
  );
}

// -------------------------------------------------------------
// OVERVIEW TAB
// -------------------------------------------------------------
function OverviewTab({ data, onOrder, onOrders, onUpdateStatus }) {
  const k = data?.kpis || {};
  const statusCounts = data?.statusCounts || {};
  const orders = data?.orders || [];

  return (
    <div className="admin-content">
      <div className="admin-live-banner">
        <div>
          <i /> Live store snapshot
        </div>
        <span>Orders, visitors, and revenue update in real time with Supabase</span>
      </div>

      <div className="admin-stats">
        <StatCard
          label="Total Revenue"
          value={money(k.revenue)}
          sub={`${money(k.todayRevenue)} in last 24h`}
          icon={TrendingUp}
          tone="green"
        />
        <StatCard
          label="Total Orders"
          value={k.orders || 0}
          sub={`${k.todayOrders || 0} placed today`}
          icon={ShoppingBag}
        />
        <StatCard
          label="Unique Customers"
          value={k.customers || 0}
          sub="Verified phone profiles"
          icon={Users}
        />
        <StatCard
          label="Live Visitors"
          value={k.activeVisitors || 0}
          sub={`${k.todayViews || 0} views today`}
          icon={Eye}
          tone="gold"
        />
      </div>

      <div className="admin-grid-2">
        {/* RECENT ORDERS */}
        <div className="admin-panel">
          <div className="panel-head">
            <div>
              <span className="admin-kicker">LATEST ORDERS</span>
              <h2>Recent customer activity</h2>
            </div>
            <button onClick={onOrders}>View all</button>
          </div>
          <div className="mini-list">
            {orders.slice(0, 7).map((o) => (
              <button key={o.id} className="mini-row" onClick={() => onOrder(o)}>
                <div className="avatar">{(o.customer?.name || 'C').slice(0, 1).toUpperCase()}</div>
                <div className="mini-main">
                  <strong>{o.customer?.name || 'Customer'}</strong>
                  <span>{o.order_number} • {phoneMask(o.phone)}</span>
                </div>
                <div className="mini-end">
                  <strong>{money(o.total)}</strong>
                  <StatusPill status={o.status} />
                </div>
              </button>
            ))}
            {!orders.length && <EmptyPlaceholder text="No orders recorded yet." />}
          </div>
        </div>

        {/* ORDER PIPELINE */}
        <div className="admin-panel">
          <div className="panel-head">
            <div>
              <span className="admin-kicker">ORDER PIPELINE</span>
              <h2>Fulfillment status breakdown</h2>
            </div>
          </div>
          <div className="status-bars">
            {Object.keys(statusCounts).length > 0 ? (
              Object.entries(statusCounts).map(([s, n]) => {
                const totalOrders = Math.max(1, k.orders || 1);
                const pct = Math.min(100, Math.round(((n || 0) / totalOrders) * 100));
                return (
                  <div className="status-bar" key={s}>
                    <div>
                      <span>{s}</span>
                      <b>{n} ({pct}%)</b>
                    </div>
                    <div>
                      <i style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyPlaceholder text="No orders yet." />
            )}
          </div>
        </div>
      </div>

      <div className="admin-grid-2">
        {/* TOP PRODUCTS */}
        <div className="admin-panel">
          <div className="panel-head">
            <div>
              <span className="admin-kicker">BEST SELLERS</span>
              <h2>Top purchased items</h2>
            </div>
          </div>
          {(data?.topProducts || []).slice(0, 6).map((p, i) => (
            <div className="rank-row" key={p.slug || p.name}>
              <span>0{i + 1}</span>
              <div>
                <strong>{p.name}</strong>
                <small>{p.units} units sold</small>
              </div>
              <b>{money(p.revenue)}</b>
            </div>
          ))}
          {!(data?.topProducts || []).length && (
            <EmptyPlaceholder text="Product sales will rank here once orders are placed." />
          )}
        </div>

        {/* MOST VIEWED PAGES */}
        <div className="admin-panel">
          <div className="panel-head">
            <div>
              <span className="admin-kicker">TRAFFIC FLOW</span>
              <h2>Most viewed storefront pages</h2>
            </div>
          </div>
          {(data?.topPages || []).slice(0, 7).map((p) => (
            <div className="rank-row" key={p.path}>
              <span>↗</span>
              <div>
                <strong>{p.path === '/' ? 'Home page (/)' : p.path}</strong>
                <small>Storefront route</small>
              </div>
              <b>{p.views} views</b>
            </div>
          ))}
          {!(data?.topPages || []).length && (
            <EmptyPlaceholder text="Visitor traffic events will show up here." />
          )}
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// ORDERS TAB
// -------------------------------------------------------------
function OrdersTab({
  orders,
  allOrdersCount,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  onStatus,
  onOrder,
  onExport
}) {
  return (
    <div className="admin-content">
      <div className="admin-toolbar" style={{ flexWrap: 'wrap', gap: 14 }}>
        <div>
          <span className="admin-kicker">ORDERS DATABASE</span>
          <h2>
            All Orders <em>({orders.length} of {allOrdersCount})</em>
          </h2>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <select
            className="filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ height: 44, padding: '0 12px' }}
          >
            <option value="all">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <label className="admin-search" style={{ margin: 0 }}>
            <Search size={17} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search order #, customer, phone…"
            />
          </label>

          <button className="btn btn-outline" onClick={onExport} title="Download CSV for couriers">
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Payment</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Placed At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <button className="link-button" onClick={() => onOrder(o)}>
                      {o.order_number}
                    </button>
                    <small>{new Date(o.placed_at).toLocaleDateString('en-BD')}</small>
                  </td>
                  <td>
                    <strong>{o.customer?.name || 'Customer'}</strong>
                    <small>{o.phone}</small>
                  </td>
                  <td>
                    <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
                      {o.payment_method === 'cod' ? 'Cash on Delivery' : o.payment_method}
                    </span>
                  </td>
                  <td>
                    {(o.items || []).reduce((s, x) => s + Number(x.qty || 1), 0)} items
                  </td>
                  <td>
                    <strong>{money(o.total)}</strong>
                  </td>
                  <td>
                    <select
                      className="status-select"
                      value={o.status}
                      onChange={(e) => onStatus(o.id, e.target.value)}
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    {new Date(o.placed_at).toLocaleString('en-BD', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td>
                    <button className="icon-action" onClick={() => onOrder(o)} title="View Order Details">
                      <ChevronDown size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!orders.length && (
          <EmptyPlaceholder text={query || statusFilter !== 'all' ? 'No matching orders found.' : 'No orders in database.'} />
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// CUSTOMERS TAB
// -------------------------------------------------------------
function CustomersTab({ customers, query, setQuery, onCustomer }) {
  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <div>
          <span className="admin-kicker">CUSTOMER INTELLIGENCE</span>
          <h2>
            Verified Customers <em>({customers.length})</em>
          </h2>
        </div>
        <label className="admin-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer, phone, address…"
          />
        </label>
      </div>

      <div className="table-card">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Customer</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Orders Placed</th>
                <th>Lifetime Spend</th>
                <th>Last Order</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.phone} onClick={() => onCustomer(c)} style={{ cursor: 'pointer' }}>
                  <td>
                    <strong>{c.name}</strong>
                    <small>{c.district || c.address || 'Bangladesh'}</small>
                  </td>
                  <td>
                    <span className="phone-cell">
                      <Phone size={13} /> {c.phone}
                    </span>
                  </td>
                  <td>{c.email || '—'}</td>
                  <td>
                    <b>{c.orders} order{c.orders === 1 ? '' : 's'}</b>
                  </td>
                  <td>
                    <strong>{money(c.total)}</strong>
                  </td>
                  <td>{new Date(c.lastOrder).toLocaleDateString('en-BD')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!customers.length && <EmptyPlaceholder text="Customer profiles appear automatically after orders are created." />}
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// CATALOG TAB
// -------------------------------------------------------------
function CatalogTab() {
  return (
    <div className="admin-content">
      <div className="admin-live-banner">
        <div>
          <Package size={16} /> Storefront Product Catalog
        </div>
        <span>{catalogProducts.length} Active Nutrition Products across 7 Categories</span>
      </div>

      <div className="catalog-grid">
        {catalogProducts.map((p, i) => (
          <div className="catalog-card" key={p.id}>
            <div className="catalog-art">
              {p.category === 'nuts'
                ? '🥜'
                : p.category === 'seeds'
                ? '🌱'
                : p.category === 'spices'
                ? '🌿'
                : p.category === 'honey'
                ? '🍯'
                : '✨'}
            </div>
            <div>
              <strong>{p.name}</strong>
              <span>
                {money(p.price)} • {(p.packages || []).map((x) => x.size).join(', ')}
              </span>
            </div>
            <b>Active</b>
          </div>
        ))}
      </div>

      <div className="admin-note" style={{ marginTop: 22 }}>
        <Database size={18} />
        <div>
          <strong>Catalog Architecture</strong>
          <p>
            Products are powered by the Pure Roots product registry. All order purchases, customer data, and status changes are dynamically saved to Supabase in real time.
          </p>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// ANALYTICS TAB
// -------------------------------------------------------------
function AnalyticsTab({ data }) {
  const k = data?.kpis || {};
  const recentEvents = data?.recentEvents || [];
  const dailySales = data?.dailySales || [];
  const maxSale = Math.max(1, ...dailySales.map((x) => x.total || 0));

  return (
    <div className="admin-content">
      <div className="admin-stats">
        <StatCard label="Page Views (24h)" value={k.todayViews || 0} sub="Real-time page loads" icon={Eye} />
        <StatCard label="Unique Visitors (24h)" value={k.todayVisitors || 0} sub="Distinct browsing sessions" icon={Users} />
        <StatCard label="Active Now" value={k.activeVisitors || 0} sub="Last 5 minutes" icon={Activity} tone="gold" />
        <StatCard label="Today’s Revenue" value={money(k.todayRevenue)} sub={`${k.todayOrders || 0} orders today`} icon={ShoppingBag} tone="green" />
      </div>

      <div className="admin-grid-2">
        {/* LIVE VISITOR STREAM */}
        <div className="admin-panel">
          <div className="panel-head">
            <div>
              <span className="admin-kicker">VISITOR STREAM</span>
              <h2>Real-time Site Activity</h2>
            </div>
            <span className="live-badge">
              <i /> Live
            </span>
          </div>
          <div className="event-list">
            {recentEvents.slice(0, 15).map((e, i) => (
              <div className="event-row" key={`${e.created_at}-${i}`}>
                <span className="event-dot" />
                <div>
                  <strong>{e.path}</strong>
                  <small>
                    Session: {String(e.session_id || '').slice(0, 8)} •{' '}
                    {new Date(e.created_at).toLocaleTimeString()}
                  </small>
                </div>
                <b>{e.event_type}</b>
              </div>
            ))}
            {!recentEvents.length && (
              <EmptyPlaceholder text="Visitor events will appear here as customers browse your store." />
            )}
          </div>
        </div>

        {/* DAILY SALES CHART */}
        <div className="admin-panel">
          <div className="panel-head">
            <div>
              <span className="admin-kicker">SALES REVENUE</span>
              <h2>Recent Daily Totals</h2>
            </div>
          </div>
          <div className="sales-list">
            {dailySales.map((d) => (
              <div key={d.date}>
                <span>{d.date.slice(5)}</span>
                <div>
                  <i style={{ width: `${Math.min(100, (d.total / maxSale) * 100)}%` }} />
                </div>
                <b>{money(d.total)}</b>
              </div>
            ))}
            {!dailySales.length && <EmptyPlaceholder text="Sales trends appear after orders are completed." />}
          </div>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// SETTINGS & HEALTH TAB
// -------------------------------------------------------------
function SettingsTab({
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
  loading
}) {
  const health = data?.systemHealth || {};

  return (
    <div className="admin-content">
      <div className="settings-grid">
        {/* HOMEPAGE HERO EXPERIENCE */}
        <section className="admin-panel">
          <div className="panel-head">
            <div>
              <span className="admin-kicker">HOMEPAGE HERO</span>
              <h2>Hero Banner & Messaging</h2>
              <p>Control the hero image and marketing copy displayed on the storefront.</p>
            </div>
          </div>

          <div
            className="hero-admin-preview"
            style={{
              backgroundImage: heroUrl
                ? `linear-gradient(90deg, rgba(7,38,22,.85), rgba(7,38,22,.2)), url(${heroUrl})`
                : 'linear-gradient(135deg, #164D2A, #2E8B57)'
            }}
          >
            <span>LIVE PREVIEW</span>
            <strong>{heroTitle || 'Nature’s Nutrition, Delivered Pure'}</strong>
          </div>

          <label>Upload Banner Image to Supabase Storage</label>
          <div className="file-row">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
            <button className="btn btn-primary" onClick={uploadHero} disabled={loading || !file}>
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
            <button className="btn btn-outline" onClick={saveHeroUrl} disabled={!heroUrl}>
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

          <button className="btn btn-primary" style={{ marginTop: 14 }} onClick={saveCopy}>
            Save Homepage Copy
          </button>
        </section>

        {/* SYSTEM HEALTH & DIAGNOSTICS */}
        <section className="admin-panel">
          <div className="panel-head">
            <div>
              <span className="admin-kicker">DIAGNOSTICS</span>
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
              <i style={{ background: health.database === 'Connected' ? '#55b878' : '#e05353' }} />
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
                All database modifications are secured server-side. The Supabase service-role secret key is strictly kept in private server environment variables and never leaked to browser bundles.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// DETAIL MODAL (ORDERS & CUSTOMERS)
// -------------------------------------------------------------
function DetailModal({ item, history, onClose, onStatus }) {
  if (item.customerView) {
    const c = item.customerView;
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
          <div className="admin-kicker">CUSTOMER PROFILE</div>
          <h2>{c.name}</h2>
          <p className="muted">
            <Phone size={13} style={{ display: 'inline', marginRight: 4 }} />
            {c.phone}
          </p>

          <div className="customer-detail-grid">
            <div>
              <span>Orders Placed</span>
              <strong>{c.orders}</strong>
            </div>
            <div>
              <span>Lifetime Value</span>
              <strong>{money(c.total)}</strong>
            </div>
            <div>
              <span>Email</span>
              <strong>{c.email || '—'}</strong>
            </div>
            <div>
              <span>Last Order</span>
              <strong>{new Date(c.lastOrder).toLocaleDateString('en-BD')}</strong>
            </div>
          </div>

          {c.address && (
            <div style={{ marginTop: 18, padding: 14, background: '#f6f9f6', borderRadius: 12, fontSize: 12 }}>
              <span className="muted" style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
                Delivery Address
              </span>
              <strong>{c.address}</strong>
            </div>
          )}

          {Array.isArray(c.allOrders) && c.allOrders.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h3>Order History</h3>
              <div className="detail-items">
                {c.allOrders.map((ord, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px' }}>
                    <span>{ord.order_number} ({new Date(ord.date).toLocaleDateString('en-BD')})</span>
                    <b>{money(ord.total)} • {ord.status}</b>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const o = item;
  const relatedHistory = history
    .filter((x) => x.order_id === o.id)
    .sort((a, b) => new Date(a.changed_at) - new Date(b.changed_at));

  const c = o.customer || {};

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="detail-modal order-detail" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          <X size={18} />
        </button>

        <div className="order-detail-head">
          <div>
            <div className="admin-kicker">ORDER DETAILS</div>
            <h2>{o.order_number}</h2>
            <p>
              {c.name || 'Customer'} • <a href={`tel:${o.phone}`} style={{ color: 'var(--green)' }}>{o.phone}</a>
            </p>
          </div>
          <StatusPill status={o.status} />
        </div>

        <div className="detail-summary">
          <div>
            <span>Total Amount</span>
            <strong>{money(o.total)}</strong>
          </div>
          <div>
            <span>Payment Method</span>
            <strong>{o.payment_method === 'cod' ? 'Cash on Delivery' : o.payment_method}</strong>
          </div>
          <div>
            <span>Placed At</span>
            <strong>{new Date(o.placed_at).toLocaleDateString('en-BD')}</strong>
          </div>
        </div>

        {/* CUSTOMER DELIVERY ADDRESS */}
        <div style={{ marginTop: 18, padding: 14, background: '#f8faf8', borderRadius: 12, border: '1px solid #e4eae4', fontSize: 12 }}>
          <span className="muted" style={{ display: 'block', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
            Delivery Information
          </span>
          <div style={{ marginTop: 6 }}>
            <strong>{c.name}</strong> • {o.phone} {c.email ? `• ${c.email}` : ''}
          </div>
          <div style={{ marginTop: 4, color: '#444' }}>
            {c.address}
            {c.area ? `, ${c.area}` : ''}
            {c.district ? `, ${c.district}` : ''}
            {c.division ? `, ${c.division}` : ''}
          </div>
          {c.notes && (
            <div style={{ marginTop: 6, fontStyle: 'italic', color: '#666' }}>
              <strong>Customer Note:</strong> {c.notes}
            </div>
          )}
        </div>

        <h3>Ordered Items</h3>
        <div className="detail-items">
          {(o.items || []).map((x, i) => (
            <div key={i}>
              <span>
                {x.name} • {x.size} × {x.qty}
              </span>
              <b>{money(Number(x.price) * Number(x.qty))}</b>
            </div>
          ))}
        </div>

        <h3>Status Timeline</h3>
        <div className="timeline">
          {(relatedHistory.length
            ? relatedHistory
            : [{ status: o.status, changed_at: o.updated_at || o.placed_at }]
          ).map((x, i, arr) => (
            <div className="timeline-row" key={i}>
              <i className={i === arr.length - 1 ? 'current' : ''} />
              <div>
                <strong>{x.status}</strong>
                <small>{new Date(x.changed_at).toLocaleString('en-BD')}</small>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-actions" style={{ alignItems: 'center', marginTop: 18 }}>
          <span style={{ fontSize: 12, fontWeight: 700, marginRight: 'auto' }}>Change Status:</span>
          <select
            className="status-select"
            value={o.status}
            onChange={(e) => onStatus(o.id, e.target.value)}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// REUSABLE MICRO-COMPONENTS
// -------------------------------------------------------------
function StatCard({ label, value, sub, icon: Icon, tone }) {
  return (
    <div className={`admin-stat ${tone || ''}`}>
      <div className="stat-icon">
        <Icon size={18} />
      </div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{sub}</small>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const norm = String(status || '').toLowerCase().replaceAll(' ', '-');
  return <span className={`status-pill status-${norm}`}>{status}</span>;
}

function EmptyPlaceholder({ text }) {
  return (
    <div className="empty">
      <Clock size={18} />
      <span>{text}</span>
    </div>
  );
}
