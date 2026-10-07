import { Activity, Eye, ShoppingBag, Users } from 'lucide-react';
import { Panel, StatCard, EmptyState } from '../ui';
import { money } from '../constants';

export default function AnalyticsTab({ data }) {
  const k = data?.kpis || {};
  const recentEvents = data?.recentEvents || [];
  const dailySales = data?.dailySales || [];
  const maxSale = Math.max(1, ...dailySales.map((x) => x.total || 0));

  return (
    <div className="admin-content">
      <div className="admin-stats">
        <StatCard
          label="Page Views (24h)"
          value={k.todayViews || 0}
          sub="Real-time page loads"
          icon={Eye}
        />
        <StatCard
          label="Unique Visitors (24h)"
          value={k.todayVisitors || 0}
          sub="Distinct browsing sessions"
          icon={Users}
        />
        <StatCard label="Active Now" value={k.activeVisitors || 0} sub="Last 5 minutes" icon={Activity} tone="gold" />
        <StatCard
          label="Today’s Revenue"
          value={money(k.todayRevenue)}
          sub={`${k.todayOrders || 0} orders today`}
          icon={ShoppingBag}
          tone="green"
        />
      </div>

      <div className="admin-grid-2">
        <Panel
          kicker="Visitor Stream"
          title="Real-time Site Activity"
          badge={
            <span className="live-badge">
              <i /> Live
            </span>
          }
        >
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
              <EmptyState text="Visitor events will appear here as customers browse your store." />
            )}
          </div>
        </Panel>

        <Panel kicker="Sales Revenue" title="Recent Daily Totals">
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
            {!dailySales.length && <EmptyState text="Sales trends appear after orders are completed." />}
          </div>
        </Panel>
      </div>
    </div>
  );
}
