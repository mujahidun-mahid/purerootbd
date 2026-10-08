import { useCallback, useEffect, useState } from 'react';
import { Package, RefreshCw, Save, ScrollText, Zap } from 'lucide-react';
import { Alert, Chip, EmptyState, StatCard } from '../ui';
import { formatDateTime } from '../constants';

const detailText = (detail) => {
  if (detail && typeof detail === 'object') {
    return Object.entries(detail)
      .map(([k, v]) => `${k}: ${v}`)
      .join(' · ');
  }
  return detail === undefined || detail === null ? '' : String(detail);
};

const prefixOf = (event) => String(event?.metadata?.action || '').split('.')[0];

export default function AuditTab({ password }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/audit', {
        headers: { 'x-admin-password': password },
        cache: 'no-store'
      });
      if (res.status === 401) {
        setError('Session expired — sign in again to load the audit log.');
        return;
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not load audit log.');
      setEvents(json.events || []);
    } catch (e) {
      setError(e?.message || 'Could not load audit log.');
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    load();
  }, [load]);

  const prefixes = [...new Set(events.map(prefixOf).filter(Boolean))];
  const filtered = filter === 'all' ? events : events.filter((e) => prefixOf(e) === filter);

  const uniqueActions = new Set(
    events.map((e) => e?.metadata?.action).filter(Boolean)
  ).size;
  const ordersChanged = events.filter((e) => prefixOf(e) === 'order').length;
  const settingsChanged = events.filter((e) => prefixOf(e) === 'settings').length;

  return (
    <div className="admin-content">
      <div className="admin-toolbar">
        <div>
          <div className="admin-kicker">Security</div>
          <h2>
            Audit Log <em>({events.length} actions)</em>
          </h2>
        </div>
        <div className="admin-toolbar-right">
          <button type="button" className="btn btn-outline" onClick={load} disabled={loading}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <Alert type="error" onClose={() => setError('')}>
          {error}{' '}
          <button type="button" className="link-button" onClick={load}>
            Retry
          </button>
        </Alert>
      )}

      <div className="kpi-row">
        <StatCard
          label="Total Actions"
          value={events.length}
          sub="Recorded admin changes"
          icon={ScrollText}
        />
        <StatCard
          label="Action Types"
          value={uniqueActions}
          sub="Distinct actions"
          icon={Zap}
          tone="gold"
        />
        <StatCard
          label="Orders Changed"
          value={ordersChanged}
          sub="order.* events"
          icon={Package}
          tone="green"
        />
        <StatCard
          label="Settings Changes"
          value={settingsChanged}
          sub="settings.* events"
          icon={Save}
        />
      </div>

      <div className="chip-row" style={{ marginBottom: 14 }}>
        <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
          All
        </Chip>
        {prefixes.map((p) => (
          <Chip key={p} active={filter === p} onClick={() => setFilter(p)}>
            {p}
          </Chip>
        ))}
      </div>

      {loading && !events.length ? (
        <EmptyState text="Loading audit actions…" icon={RefreshCw} />
      ) : filtered.length ? (
        <ul className="timeline">
          {filtered.map((event) => (
            <li className="timeline-item" key={event.id}>
              <b>{event?.metadata?.action || 'action'}</b>
              <span>{formatDateTime(event.created_at)}</span>
              <p>{detailText(event?.metadata?.detail)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          text="No admin actions recorded yet — status changes and setting saves appear here."
          icon={ScrollText}
        />
      )}
    </div>
  );
}
