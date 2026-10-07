import { getSupabaseAdmin, getSupabaseConfig } from './supabaseServer';
import { SETTINGS_DEFAULTS } from './site-settings';

export async function getAdminDashboardData() {
  const config = getSupabaseConfig();
  if (!config.configured) {
    return {
      configured: false,
      error: 'Supabase credentials are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
      kpis: { orders: 0, revenue: 0, customers: 0, visits: 0, activeVisitors: 0, todayOrders: 0, todayRevenue: 0, todayViews: 0, todayVisitors: 0 },
      stats: { revenue: 0, orders: 0, customers: 0, activeVisitors: 0, pageViews: 0 },
      statusCounts: {},
      orders: [],
      customers: [],
      topProducts: [],
      dailySales: [],
      topPages: [],
      recentEvents: [],
      statusHistory: [],
      systemHealth: { database: 'Not Configured', ordersCount: 0, eventsCount: 0, isServiceRole: false },
      siteSettings: { ...SETTINGS_DEFAULTS }
    };
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return {
      configured: false,
      error: 'Could not connect to database.',
      kpis: { orders: 0, revenue: 0, customers: 0, visits: 0, activeVisitors: 0, todayOrders: 0, todayRevenue: 0, todayViews: 0, todayVisitors: 0 },
      stats: { revenue: 0, orders: 0, customers: 0, activeVisitors: 0, pageViews: 0 },
      statusCounts: {},
      orders: [],
      customers: [],
      topProducts: [],
      dailySales: [],
      topPages: [],
      recentEvents: [],
      statusHistory: [],
      systemHealth: { database: 'Connection Failed', ordersCount: 0, eventsCount: 0, isServiceRole: false },
      siteSettings: { ...SETTINGS_DEFAULTS }
    };
  }

  try {
    const [ordersRes, eventsRes, historyRes, settingsRes] = await Promise.all([
      supabase.from('orders').select('*').order('placed_at', { ascending: false }).limit(1000),
      supabase.from('site_events').select('*').order('created_at', { ascending: false }).limit(3000),
      supabase.from('order_status_history').select('*').order('changed_at', { ascending: false }).limit(2000),
      supabase.from('site_settings').select('*').catch?.(() => ({ data: [] })) || { data: [] }
    ]);

    if (ordersRes.error) {
      console.error('Error fetching orders:', ordersRes.error);
    }

    const rows = ordersRes.data || [];
    const ev = eventsRes.data || [];
    const hist = historyRes.data || [];
    const settings = settingsRes.data || [];

    const customersMap = new Map();
    const productsMap = new Map();
    const statusCounts = {
      'Order Placed': 0,
      'Confirmed': 0,
      'Processing': 0,
      'Packed': 0,
      'Shipped': 0,
      'Out for Delivery': 0,
      'Delivered': 0,
      'Cancelled': 0
    };

    let totalRevenue = 0;
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    const fiveMinutesMs = 5 * 60 * 1000;

    for (const o of rows) {
      const orderTotal = Number(o.total || 0);
      const isCancelled = String(o.status || '').toLowerCase() === 'cancelled';
      if (!isCancelled) {
        totalRevenue += orderTotal;
      }

      // Status counts
      const statusKey = o.status || 'Order Placed';
      statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;

      // Customer mapping by phone
      const phone = String(o.phone || o.customer?.phone || '').trim();
      if (phone) {
        const existing = customersMap.get(phone) || {
          phone,
          name: o.customer?.name || 'Customer',
          email: o.customer?.email || '',
          address: o.customer?.address || '',
          district: o.customer?.district || '',
          orders: 0,
          total: 0,
          lastOrder: o.placed_at,
          allOrders: []
        };
        existing.orders += 1;
        existing.total += orderTotal;
        existing.allOrders.push({
          order_number: o.order_number,
          total: orderTotal,
          status: o.status,
          date: o.placed_at
        });
        if (new Date(o.placed_at) > new Date(existing.lastOrder)) {
          existing.lastOrder = o.placed_at;
          if (o.customer?.name) existing.name = o.customer.name;
          if (o.customer?.email) existing.email = o.customer.email;
          if (o.customer?.address) existing.address = o.customer.address;
        }
        customersMap.set(phone, existing);
      }

      // Products breakdown
      const items = Array.isArray(o.items) ? o.items : [];
      for (const item of items) {
        const key = item.productId || item.slug || item.name || 'product';
        const p = productsMap.get(key) || {
          name: item.name || 'Product',
          slug: item.slug || '',
          units: 0,
          revenue: 0
        };
        const qty = Number(item.qty || 1);
        const price = Number(item.price || 0);
        p.units += qty;
        p.revenue += qty * price;
        productsMap.set(key, p);
      }
    }

    // Today calculations
    const todayOrdersList = rows.filter(o => now - new Date(o.placed_at).getTime() <= oneDayMs);
    const todayOrders = todayOrdersList.length;
    const todayRevenue = todayOrdersList
      .filter(o => String(o.status || '').toLowerCase() !== 'cancelled')
      .reduce((s, o) => s + Number(o.total || 0), 0);

    // Visitor & page views calculations
    const todayEvents = ev.filter(e => now - new Date(e.created_at).getTime() <= oneDayMs);
    const todayViews = todayEvents.filter(e => e.event_type === 'page_view').length;
    const totalViews = ev.filter(e => e.event_type === 'page_view').length;
    const allSessions = new Set(ev.map(e => e.session_id).filter(Boolean));
    const todaySessions = new Set(todayEvents.map(e => e.session_id).filter(Boolean));
    const activeSessions = new Set(
      ev.filter(e => now - new Date(e.created_at).getTime() <= fiveMinutesMs).map(e => e.session_id).filter(Boolean)
    );

    // Most viewed pages
    const pagesMap = {};
    for (const e of ev) {
      if (e.event_type === 'page_view' && e.path) {
        pagesMap[e.path] = (pagesMap[e.path] || 0) + 1;
      }
    }

    // Daily sales last 14 days
    const dailyMap = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now - i * oneDayMs).toISOString().slice(0, 10);
      dailyMap[d] = { date: d, total: 0, orders: 0 };
    }
    for (const o of rows) {
      if (String(o.status || '').toLowerCase() !== 'cancelled') {
        const d = new Date(o.placed_at).toISOString().slice(0, 10);
        if (dailyMap[d]) {
          dailyMap[d].total += Number(o.total || 0);
          dailyMap[d].orders += 1;
        }
      }
    }

    const kpis = {
      orders: rows.length,
      revenue: totalRevenue,
      customers: customersMap.size,
      visits: allSessions.size,
      activeVisitors: activeSessions.size,
      todayOrders,
      todayRevenue,
      todayViews,
      todayVisitors: todaySessions.size
    };

    const stats = {
      revenue: totalRevenue,
      orders: rows.length,
      customers: customersMap.size,
      activeVisitors: activeSessions.size,
      pageViews: totalViews
    };

    return {
      configured: true,
      generatedAt: new Date().toISOString(),
      kpis,
      stats,
      statusCounts,
      orders: rows,
      customers: [...customersMap.values()].sort((a, b) => new Date(b.lastOrder) - new Date(a.lastOrder)),
      topProducts: [...productsMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 15),
      dailySales: Object.values(dailyMap),
      topPages: Object.entries(pagesMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([path, views]) => ({ path, views })),
      recentEvents: ev.slice(0, 30),
      statusHistory: hist,
      siteSettings: {
        ...SETTINGS_DEFAULTS,
        ...Object.fromEntries(
          settings
            .filter((s) => s.key && s.value !== null && String(s.value).trim() !== '')
            .map((s) => [s.key, s.value])
        )
      },
      systemHealth: {
        database: 'Connected',
        ordersCount: rows.length,
        eventsCount: ev.length,
        isServiceRole: config.isServiceRole
      }
    };
  } catch (error) {
    console.error('Error generating dashboard data:', error);
    return {
      configured: true,
      error: error.message || 'Error fetching data',
      kpis: { orders: 0, revenue: 0, customers: 0, visits: 0, activeVisitors: 0, todayOrders: 0, todayRevenue: 0, todayViews: 0, todayVisitors: 0 },
      stats: { revenue: 0, orders: 0, customers: 0, activeVisitors: 0, pageViews: 0 },
      statusCounts: {},
      orders: [],
      customers: [],
      topProducts: [],
      dailySales: [],
      topPages: [],
      recentEvents: [],
      statusHistory: [],
      systemHealth: { database: 'Error: ' + error.message, ordersCount: 0, eventsCount: 0, isServiceRole: config.isServiceRole },
      siteSettings: { ...SETTINGS_DEFAULTS }
    };
  }
}

