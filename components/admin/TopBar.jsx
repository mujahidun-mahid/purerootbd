import { Menu, RefreshCw } from 'lucide-react';
import { tabs } from './constants';

export default function TopBar({ tab, connected, lastSync, loading, onRefresh, onMenu }) {
  const current = tabs.find((x) => x[0] === tab);

  return (
    <header className="admin-header">
      <div>
        <button type="button" className="admin-menu-toggle" onClick={onMenu} aria-label="Open navigation">
          <Menu size={18} />
        </button>
        <div>
          <div className="admin-breadcrumb">
            Control Center <span>/</span> <b>{current?.[1]}</b>
          </div>
          <div className="admin-kicker">PURE ROOTS ADMIN</div>
          <h1>{current?.[1]}</h1>
        </div>
      </div>

      <div className="admin-header-actions">
        <span className="sync-time">
          <i style={{ background: connected ? '#2e8b57' : '#f5a623' }} />
          {lastSync
            ? `Synced ${lastSync.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}`
            : 'Syncing…'}
        </span>
        <button
          type="button"
          className="admin-refresh"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh Database"
        >
          <RefreshCw size={16} className={loading ? 'spin' : ''} />
        </button>
      </div>
    </header>
  );
}
