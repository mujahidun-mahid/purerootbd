import { StatusPill, StatCard, EmptyState } from '../ui';
import { money, formatDateTime } from '../constants';
import { ClipboardList, PackageCheck, Truck, CheckCircle2, Inbox, ArrowRight } from 'lucide-react';

const LANES = [
  {
    id: 'pick',
    title: 'To Pick',
    statuses: ['Order Placed', 'Awaiting Payment', 'Awaiting Bank Transfer', 'Order Confirmed'],
    action: 'Start Picking',
    next: 'Processing',
    icon: ClipboardList
  },
  {
    id: 'picking',
    title: 'Picking',
    statuses: ['Processing'],
    action: 'Mark Packed',
    next: 'Packed',
    icon: PackageCheck
  },
  {
    id: 'packed',
    title: 'Ready to Ship',
    statuses: ['Packed'],
    action: 'Hand to Courier',
    next: 'Shipped',
    icon: Truck
  },
  {
    id: 'shipping',
    title: 'Shipping',
    statuses: ['Shipped', 'Out for Delivery'],
    action: 'Mark Delivered',
    next: 'Delivered',
    icon: ArrowRight
  },
  {
    id: 'done',
    title: 'Completed',
    statuses: ['Delivered', 'Cancelled'],
    action: null,
    next: null,
    icon: CheckCircle2
  }
];

export default function FulfillmentTab({ orders = [], onStatus, onOrder }) {
  const laneRows = LANES.map((lane) => ({
    ...lane,
    rows: orders.filter((o) => lane.statuses.includes(o.status))
  }));

  const active = laneRows
    .filter((l) => l.action)
    .reduce((sum, l) => sum + l.rows.length, 0);
  const revenueInPlay = laneRows
    .filter((l) => l.action)
    .flatMap((l) => l.rows)
    .reduce((sum, o) => sum + Number(o.total || 0), 0);
  const deliveredToday = orders.filter(
    (o) =>
      o.status === 'Delivered' &&
      new Date(o.updated_at || o.placed_at).toDateString() === new Date().toDateString()
  ).length;

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <div>
          <div className="admin-kicker">Order Operations</div>
          <h2>
            Fulfillment Board <em>({active} in progress)</em>
          </h2>
        </div>
        <div className="admin-toolbar-right muted">
          Pick → Pack → Ship → Deliver, straight from the live order queue.
        </div>
      </div>

      <div className="kpi-row">
        <StatCard label="Open Jobs" value={active} sub="Orders being fulfilled" icon={ClipboardList} />
        <StatCard
          label="Value In Progress"
          value={money(revenueInPlay)}
          sub="Across active lanes"
          icon={PackageCheck}
          tone="green"
        />
        <StatCard label="Delivered Today" value={deliveredToday} sub="Since midnight" icon={CheckCircle2} />
        <StatCard
          label="Completed"
          value={laneRows.find((l) => l.id === 'done')?.rows.length || 0}
          sub="Delivered + cancelled"
          icon={Inbox}
          tone="gold"
        />
      </div>

      <div className="lane-grid">
        {laneRows.map((lane) => {
          const Icon = lane.icon;
          return (
            <section className="lane" key={lane.id}>
              <div className="lane-head">
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <Icon size={15} /> {lane.title}
                </span>
                <span className="nav-badge">{lane.rows.length}</span>
              </div>
              <div className="lane-body">
                {!lane.rows.length && <EmptyState text="Nothing here right now." icon={Inbox} />}
                {lane.rows.slice(0, 30).map((o) => {
                  const c = o.customer || {};
                  return (
                    <article className="lane-card" key={o.id}>
                      <div className="lane-top">
                        <b>{o.order_number}</b>
                        <StatusPill status={o.status} />
                      </div>
                      <div className="lane-meta">
                        {c.name || 'Customer'} · {o.phone || c.phone || '—'}
                      </div>
                      <div className="lane-items">
                        {(o.items || []).length} item{(o.items || []).length === 1 ? '' : 's'} ·{' '}
                        {money(o.total)} · {formatDateTime(o.placed_at)}
                      </div>
                      <div className="lane-act">
                        <button type="button" className="btn btn-sm" onClick={() => onOrder?.(o)}>
                          Open
                        </button>
                        {lane.action && (
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => onStatus?.(o.id, lane.next)}
                          >
                            {lane.action}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
