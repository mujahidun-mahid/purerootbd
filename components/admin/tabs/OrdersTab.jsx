import { ChevronRight, Download } from 'lucide-react';
import { SearchField } from '../ui';
import DataTable from '../DataTable';
import { statuses, money, formatDateTime, formatDate } from '../constants';

export default function OrdersTab({
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
  const filtered = query || statusFilter !== 'all';

  const columns = [
    {
      key: 'order_number',
      header: 'Order #',
      render: (o) => (
        <>
          <button type="button" className="link-button" onClick={() => onOrder(o)}>
            {o.order_number}
          </button>
          <small>{formatDate(o.placed_at)}</small>
        </>
      )
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (o) => (
        <>
          <strong>{o.customer?.name || 'Customer'}</strong>
          <small>{o.phone}</small>
        </>
      )
    },
    {
      key: 'payment_method',
      header: 'Payment',
      render: (o) => (
        <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>
          {o.payment_method === 'cod' ? 'Cash on Delivery' : o.payment_method}
        </span>
      )
    },
    {
      key: 'items',
      header: 'Items',
      render: (o) => `${(o.items || []).reduce((s, x) => s + Number(x.qty || 1), 0)} items`
    },
    {
      key: 'total',
      header: 'Total',
      render: (o) => <strong>{money(o.total)}</strong>
    },
    {
      key: 'status',
      header: 'Status',
      render: (o) => (
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
          {!statuses.includes(o.status) && (
            <option value={o.status || ''}>{o.status || 'Unknown'}</option>
          )}
        </select>
      )
    },
    {
      key: 'placed_at',
      header: 'Placed At',
      render: (o) => formatDateTime(o.placed_at)
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (o) => (
        <button
          type="button"
          className="icon-action"
          onClick={() => onOrder(o)}
          title="View Order Details"
        >
          <ChevronRight size={16} />
        </button>
      )
    }
  ];

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <div>
          <div className="admin-kicker">Orders Database</div>
          <h2>
            All Orders <em>({orders.length} of {allOrdersCount})</em>
          </h2>
        </div>

        <div className="admin-toolbar-right">
          <select
            className="filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search order #, customer, phone…"
          />

          <button type="button" className="btn btn-outline" onClick={onExport} title="Download CSV for couriers">
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={orders}
        rowKey={(o) => o.id}
        filtered={filtered}
        emptyText="No orders in database yet."
        emptyFilteredText="No matching orders found. Try clearing the search or status filter."
      />
    </div>
  );
}
