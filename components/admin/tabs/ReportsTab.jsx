import { Banknote, Boxes, Download, FileText, Users, Wallet } from 'lucide-react';
import { Panel, StatCard, EmptyState } from '../ui';
import { AreaChart, DonutChart, BarList } from '../charts';
import DataTable from '../DataTable';
import { money } from '../constants';

const PALETTE = [
  '#2e8b57',
  '#f5a623',
  '#3f8fd1',
  '#e2543a',
  '#8b5cf6',
  '#14b8a6',
  '#ec4899',
  '#84cc16',
  '#f97316',
  '#64748b'
];

const EMPTY_TEXT = 'Reports populate once orders and visits are recorded.';

export default function ReportsTab({ data, orders, customers, onExportOrders }) {
  const k = data?.kpis || {};
  const dailySales = data?.dailySales || [];
  const statusCounts = data?.statusCounts || {};
  const topProducts = data?.topProducts || [];
  const topPages = data?.topPages || [];

  const revenue = Number(k.revenue || 0);
  const orderCount = k.orders ?? (orders || []).length;
  const aov = Number(orderCount) ? revenue / Number(orderCount) : 0;

  const statusEntries = Object.entries(statusCounts)
    .filter(([, n]) => Number(n) > 0)
    .map(([label, value], i) => ({
      label,
      value: Number(value),
      color: PALETTE[i % PALETTE.length]
    }));

  function exportCustomersCSV() {
    const list = customers || [];
    if (!list.length) {
      window.alert('No customers to export.');
      return;
    }

    const cols = ['Name', 'Phone', 'Email', 'Address', 'District', 'Orders', 'Lifetime Spend', 'Last Order'];
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const rows = list.map((c) =>
      [
        escape(c.name),
        escape(c.phone),
        escape(c.email),
        escape(c.address),
        escape(c.district),
        escape(c.orders),
        escape(c.total),
        escape(c.lastOrder ? new Date(c.lastOrder).toLocaleDateString('en-BD') : '')
      ].join(',')
    );

    const csv =
      'data:text/csv;charset=utf-8,' + encodeURIComponent([cols.join(','), ...rows].join('\r\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csv);
    link.setAttribute('download', `pure-roots-customers-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const pageColumns = [
    { key: 'path', header: 'Path', render: (p) => <strong>{p.path}</strong> },
    {
      key: 'views',
      header: 'Views',
      render: (p) => Number(p.views || 0).toLocaleString()
    }
  ];

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <div>
          <div className="admin-kicker">Reporting</div>
          <h2>
            Reports <em>({topPages.length} pages tracked)</em>
          </h2>
        </div>
        <div className="admin-toolbar-right">
          <button type="button" className="btn btn-outline" onClick={() => onExportOrders?.()}>
            <Download size={15} /> Export Orders CSV
          </button>
          <button type="button" className="btn btn-outline" onClick={exportCustomersCSV}>
            <FileText size={15} /> Export Customers CSV
          </button>
        </div>
      </div>

      <div className="kpi-row">
        <StatCard
          label="Revenue"
          value={money(revenue)}
          sub="All-time recorded"
          icon={Banknote}
          tone="green"
        />
        <StatCard label="Orders" value={orderCount} sub="Placed to date" icon={Boxes} />
        <StatCard label="AOV" value={money(aov)} sub="Revenue per order" icon={Wallet} tone="gold" />
        <StatCard
          label="Customers"
          value={k.customers ?? (customers || []).length}
          sub="Buyers on record"
          icon={Users}
        />
      </div>

      <div className="admin-grid-2">
        <Panel kicker="Revenue" title="Daily revenue · 14 days">
          {dailySales.length ? (
            <AreaChart
              data={dailySales.map((d) => ({
                label: String(d.date || '').slice(5),
                value: d.total
              }))}
              format={money}
            />
          ) : (
            <EmptyState text={EMPTY_TEXT} />
          )}
        </Panel>

        <Panel kicker="Orders" title="Status breakdown">
          {statusEntries.length ? (
            <DonutChart data={statusEntries} format={(v) => v} />
          ) : (
            <EmptyState text={EMPTY_TEXT} />
          )}
        </Panel>
      </div>

      <div className="admin-grid-2">
        <Panel kicker="Catalog" title="Best sellers">
          {topProducts.length ? (
            <BarList
              data={topProducts.slice(0, 8).map((p) => ({ label: p.name, value: p.revenue }))}
              format={money}
            />
          ) : (
            <EmptyState text={EMPTY_TEXT} />
          )}
        </Panel>

        <Panel kicker="Traffic" title="Top pages">
          <DataTable
            compact
            columns={pageColumns}
            rows={topPages}
            rowKey={(p, i) => p.path || i}
            emptyText={EMPTY_TEXT}
          />
        </Panel>
      </div>
    </div>
  );
}
