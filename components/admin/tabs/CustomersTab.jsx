import { SearchField } from '../ui';
import DataTable from '../DataTable';
import { money, formatDate } from '../constants';

export default function CustomersTab({ customers, query, setQuery, onCustomer }) {
  const columns = [
    {
      key: 'name',
      header: 'Customer',
      render: (c) => (
        <>
          <strong>{c.name}</strong>
          <small>{c.district || c.address || 'Bangladesh'}</small>
        </>
      )
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (c) => <span className="phone-cell">{c.phone}</span>
    },
    { key: 'email', header: 'Email', render: (c) => c.email || '—' },
    {
      key: 'orders',
      header: 'Orders Placed',
      render: (c) => (
        <b>
          {c.orders} order{c.orders === 1 ? '' : 's'}
        </b>
      )
    },
    {
      key: 'total',
      header: 'Lifetime Spend',
      render: (c) => <strong>{money(c.total)}</strong>
    },
    { key: 'lastOrder', header: 'Last Order', render: (c) => formatDate(c.lastOrder) }
  ];

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <div>
          <div className="admin-kicker">Customer Intelligence</div>
          <h2>
            Verified Customers <em>({customers.length})</em>
          </h2>
        </div>
        <div className="admin-toolbar-right">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search customer, phone, address…"
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={customers}
        rowKey={(c) => c.phone}
        onRowClick={onCustomer}
        filtered={Boolean(query)}
        pageSize={20}
        emptyText="Customer profiles appear automatically after orders are created."
        emptyFilteredText="No matching customers found."
      />
    </div>
  );
}
