import { ShieldCheck, LogOut } from 'lucide-react';
import { tabs } from './constants';

export default function Sidebar({ tab, onSelect, connected, onLogout, open, onClose }) {
  return (
    <>
      {open && <div className="admin-scrim" onClick={onClose} />}
      <aside className={`admin-sidebar ${open ? 'open' : ''}`}>
        <div className="admin-brand">
          <span>
            <ShieldCheck size={21} />
          </span>
          <div>
            <strong>PURE ROOTS</strong>
            <small>Admin Console</small>
          </div>
        </div>

        <nav className="admin-side-nav">
          <div className="admin-side-label">Workspace</div>
          {tabs.map(([id, label, Icon]) => (
            <button
              key={id}
              type="button"
              className={tab === id ? 'active' : ''}
              onClick={() => {
                onSelect(id);
                if (onClose) onClose();
              }}
            >
              <Icon size={17} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="admin-side-bottom">
          <div className="live-dot">
            <i style={{ background: connected ? '#5ee095' : '#f5a623' }} />
            {connected ? 'Live WebSocket' : 'Polling Active'}
          </div>
          <small>Auto-syncs every 5s</small>
          <button type="button" className="admin-logout" onClick={onLogout}>
            <LogOut size={13} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
