import { ShieldCheck, LogOut } from 'lucide-react';
import { tabs, navSections } from './constants';

export default function Sidebar({ tab, onSelect, connected, onLogout, open, onClose, counts = {} }) {
  const lookup = Object.fromEntries(tabs.map(([id, label, Icon]) => [id, { label, Icon }]));

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
          {navSections.map((section) => {
            const total = section.items.reduce((sum, id) => sum + (Number(counts[id]) || 0), 0);
            return (
              <div key={section.label} className="admin-side-group">
                <div className="admin-side-label">
                  {section.label}
                  {total > 0 ? <span className="nav-badge">{total > 99 ? '99+' : total}</span> : null}
                </div>
                {section.items.map((id) => {
                  const entry = lookup[id];
                  if (!entry) return null;
                  const { label, Icon } = entry;
                  return (
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
                  );
                })}
              </div>
            );
          })}
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
