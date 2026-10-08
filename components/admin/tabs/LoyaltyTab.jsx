import { useState } from 'react';
import { BadgePercent, Gift, Pencil, Plus, Star, Trash2, Users, Wallet } from 'lucide-react';
import { Alert, ModalShell, Field, StatCard } from '../ui';
import DataTable from '../DataTable';
import { money, formatDate } from '../constants';
import { useLocalCollection } from '../useLocalData';
import { seedTiers } from '../mockData';

const blankTier = { name: '', minSpend: 0, pointsRate: 1, perks: '' };

export default function LoyaltyTab({ password, customers }) {
  const { items: tiers, save, remove } = useLocalCollection('loyaltyTiers', seedTiers);
  const [notice, setNotice] = useState(null);
  const [editing, setEditing] = useState(null);

  const memberList = customers || [];
  const sortedAsc = [...tiers].sort(
    (a, b) => Number(a.minSpend || 0) - Number(b.minSpend || 0)
  );
  const sortedDesc = [...tiers].sort(
    (a, b) => Number(b.minSpend || 0) - Number(a.minSpend || 0)
  );

  const pointsIssued = memberList.reduce(
    (sum, c) => sum + Math.floor(Number(c.total || 0) / 100),
    0
  );
  const avgSpend = memberList.length
    ? memberList.reduce((sum, c) => sum + Number(c.total || 0), 0) / memberList.length
    : 0;

  const memberCount = (tier) => {
    const index = sortedAsc.findIndex((t) => t.id === tier.id);
    const next = sortedAsc[index + 1];
    const min = Number(tier.minSpend || 0);
    const max = next ? Number(next.minSpend || 0) : Infinity;
    return memberList.filter((c) => {
      const total = Number(c.total || 0);
      return total >= min && total < max;
    }).length;
  };

  const tierName = (total) => {
    const match = sortedDesc.find((t) => total >= Number(t.minSpend || 0)) || sortedDesc[0];
    return match ? match.name : '—';
  };

  function openNew() {
    setNotice(null);
    setEditing({ ...blankTier });
  }

  function openEdit(tier) {
    setNotice(null);
    setEditing({ ...tier });
  }

  function saveTier() {
    const name = String(editing.name || '').trim();
    if (!name) {
      setNotice({ type: 'error', text: 'Tier name is required.' });
      return;
    }
    save({
      ...editing,
      name,
      minSpend: Number(editing.minSpend || 0),
      pointsRate: Number(editing.pointsRate || 1)
    });
    setNotice({ type: 'success', text: `Tier ${name} saved.` });
    setEditing(null);
  }

  function deleteTier(tier) {
    if (tiers.length <= 1) {
      setNotice({ type: 'error', text: 'At least one tier must remain.' });
      return;
    }
    if (!window.confirm(`Delete the ${tier.name} tier?`)) return;
    remove(tier.id);
    setNotice({ type: 'success', text: `Tier ${tier.name} deleted.` });
  }

  const columns = [
    {
      key: 'name',
      header: 'Customer',
      render: (c) => (
        <>
          <strong>{c.name}</strong>
          <small>{c.phone || c.email || '—'}</small>
        </>
      )
    },
    { key: 'total', header: 'Lifetime Spend', render: (c) => <strong>{money(c.total)}</strong> },
    { key: 'tier', header: 'Tier', render: (c) => tierName(Number(c.total || 0)) },
    {
      key: 'points',
      header: 'Points',
      render: (c) => Math.floor(Number(c.total || 0) / 100).toLocaleString()
    },
    {
      key: 'lastOrder',
      header: 'Last Order',
      render: (c) => (c.lastOrder ? formatDate(c.lastOrder) : '—')
    }
  ];

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <div>
          <div className="admin-kicker">Retention</div>
          <h2>
            Loyalty Program <em>({tiers.length} tiers)</em>
          </h2>
        </div>
        <div className="admin-toolbar-right">
          <button type="button" className="btn btn-primary" onClick={openNew}>
            <Plus size={15} /> Add Tier
          </button>
        </div>
      </div>

      <p className="admin-sub muted">
        Points are estimated from lifetime spend until the rewards engine ships.
      </p>

      {notice && (
        <Alert type={notice.type} onClose={() => setNotice(null)}>
          {notice.text}
        </Alert>
      )}

      <div className="kpi-row">
        <StatCard label="Tiers" value={tiers.length} sub="Configured levels" icon={Gift} />
        <StatCard label="Members" value={memberList.length} sub="Customers enrolled" icon={Users} tone="green" />
        <StatCard
          label="Points Issued"
          value={pointsIssued.toLocaleString()}
          sub="Estimated at 100৳ = 1 pt"
          icon={BadgePercent}
          tone="gold"
        />
        <StatCard label="Avg Spend" value={money(avgSpend)} sub="Lifetime per customer" icon={Wallet} />
      </div>

      <div className="card-grid">
        {sortedAsc.map((tier) => (
          <article className="info-card" key={tier.id}>
            <div className="ic-head">
              <div>
                <h4>{tier.name}</h4>
                <div className="ic-sub">Min spend {money(tier.minSpend)}</div>
              </div>
              <Star size={15} />
            </div>
            <div className="ic-lines">
              <span>
                Points rate <b>{tier.pointsRate}x</b>
              </span>
              <span>Perks: {tier.perks || '—'}</span>
              <span>Members: {memberCount(tier)}</span>
            </div>
            <div className="ic-actions">
              <button type="button" className="btn btn-sm" onClick={() => openEdit(tier)}>
                <Pencil size={13} /> Edit
              </button>
              <button type="button" className="btn btn-sm danger" onClick={() => deleteTier(tier)}>
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </article>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={memberList}
        rowKey={(c, i) => c.phone || c.name || i}
        pageSize={15}
        emptyText="No customers yet — members appear as orders are placed."
        emptyIcon={Users}
      />

      {editing && (
        <ModalShell
          kicker="Tier Editor"
          title={editing.name ? `Edit ${editing.name}` : 'New Tier'}
          onClose={() => setEditing(null)}
          actions={
            <>
              <button type="button" className="btn" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={saveTier}>
                Save Tier
              </button>
            </>
          }
        >
          <Field label="Tier Name">
            <input
              className="input"
              value={editing.name}
              placeholder="e.g. Seedling"
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
          </Field>
          <Field label="Minimum Spend (৳)">
            <input
              className="input"
              type="number"
              min="0"
              value={editing.minSpend}
              onChange={(e) => setEditing({ ...editing, minSpend: e.target.value })}
            />
          </Field>
          <Field label="Points Rate">
            <input
              className="input"
              type="number"
              step="0.1"
              min="0"
              value={editing.pointsRate}
              onChange={(e) => setEditing({ ...editing, pointsRate: e.target.value })}
            />
          </Field>
          <Field label="Perks" hint="full">
            <input
              className="input"
              value={editing.perks}
              placeholder="e.g. Free delivery over 1000৳"
              onChange={(e) => setEditing({ ...editing, perks: e.target.value })}
            />
          </Field>
        </ModalShell>
      )}
    </div>
  );
}
