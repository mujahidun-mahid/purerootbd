import { Eye, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { Panel, StatCard, StatusPill, EmptyState } from '../ui';
import { money, phoneMask } from '../constants';

export default function OverviewTab({ data, onOrder, onOrders }) {
  const k = data?.kpis || {};
  const statusCounts = data?.statusCounts || {};
  const orders = data?.orders || [];
  const topProducts = data?.topProducts || [];
  const topPages = data?.topPages || [];

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
        <Panel kicker="Latest Orders" title="Recent customer activity" action={onOrders} actionLabel="View all">
          <div className="mini-list">
            {orders.slice(0, 7).map((o) => (
              <button key={o.id} type="button" className="mini-row" onClick={() => onOrder(o)}>
                <div className="avatar">{(o.customer?.name || 'C').slice(0, 1).toUpperCase()}</div>
                <div className="mini-main">
                  <strong>{o.customer?.name || 'Customer'}</strong>
                  <span>
                    {o.order_number} • {phoneMask(o.phone)}
                  </span>
                </div>
                <div className="mini-end">
                  <strong>{money(o.total)}</strong>
                  <StatusPill status={o.status} />
                </div>
              </button>
            ))}
            {!orders.length && <EmptyState text="No orders recorded yet." />}
          </div>
        </Panel>

        <Panel kicker="Order Pipeline" title="Fulfillment status breakdown">
          <div className="status-bars">
            {(k.orders || 0) > 0 ? (
              Object.entries(statusCounts).map(([s, n]) => {
                const totalOrders = Math.max(1, k.orders || 1);
                const pct = Math.min(100, Math.round(((n || 0) / totalOrders) * 100));
                return (
                  <div className="status-bar" key={s}>
                    <div>
                      <span>{s}</span>
                      <b>
                        {n} ({pct}%)
                      </b>
                    </div>
                    <div>
                      <i style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState text="No orders yet." />
            )}
          </div>
        </Panel>
      </div>

      <div className="admin-grid-2">
        <Panel kicker="Best Sellers" title="Top purchased items">
          {topProducts.slice(0, 6).map((p, i) => (
            <div className="rank-row" key={p.slug || p.name}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <div>
                <strong>{p.name}</strong>
                <small>{p.units} units sold</small>
              </div>
              <b>{money(p.revenue)}</b>
            </div>
          ))}
          {!topProducts.length && (
            <EmptyState text="Product sales will rank here once orders are placed." />
          )}
        </Panel>

        <Panel kicker="Traffic Flow" title="Most viewed storefront pages">
          {topPages.slice(0, 7).map((p) => (
            <div className="rank-row" key={p.path}>
              <span>↗</span>
              <div>
                <strong>{p.path === '/' ? 'Home page (/)' : p.path}</strong>
                <small>Storefront route</small>
              </div>
              <b>{p.views} views</b>
            </div>
          ))}
          {!topPages.length && <EmptyState text="Visitor traffic events will show up here." />}
        </Panel>
      </div>
    </div>
  );
}
