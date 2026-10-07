import { Clock, Inbox } from 'lucide-react';

export { default as StatCard } from './StatCard';

export function Kicker({ children }) {
  return <div className="admin-kicker">{children}</div>;
}

export function Panel({ kicker, title, desc, action, actionLabel, badge, className = '', children }) {
  return (
    <section className={`admin-panel ${className}`}>
      <div className="panel-head">
        <div>
          {kicker && <span className="admin-kicker">{kicker}</span>}
          <h2>{title}</h2>
          {desc && <p>{desc}</p>}
        </div>
        {action && (
          <button type="button" onClick={action}>
            {actionLabel}
          </button>
        )}
        {badge}
      </div>
      {children}
    </section>
  );
}

export function StatusPill({ status }) {
  const norm = String(status || '')
    .toLowerCase()
    .replaceAll(' ', '-');
  return <span className={`status-pill status-${norm}`}>{status}</span>;
}

export function EmptyState({ text, icon: Icon = Clock }) {
  return (
    <div className="empty">
      <Icon size={20} />
      <span>{text}</span>
    </div>
  );
}

export function NoResults({ text }) {
  return <EmptyState text={text} icon={Inbox} />;
}

export function Alert({ type = 'success', children, onClose }) {
  return (
    <div className={`admin-alert ${type === 'error' ? 'error' : ''}`}>
      {children}
      <button type="button" onClick={onClose} aria-label="Dismiss">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function SearchField({ value, onChange, placeholder }) {
  return (
    <label className="admin-search">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

export function Field({ label, hint, children }) {
  return (
    <div className={hint === 'full' ? 'full' : undefined}>
      <label>{label}</label>
      {children}
    </div>
  );
}
