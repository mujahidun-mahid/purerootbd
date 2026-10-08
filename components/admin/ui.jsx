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

export function ModalShell({ kicker, title, onClose, children, actions }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="detail-modal" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="admin-kicker">{kicker || 'Editor'}</div>
        <h2>{title}</h2>
        <div className="editor-grid">{children}</div>
        {actions && <div className="modal-actions">{actions}</div>}
      </div>
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      className={`a-switch ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      aria-label={label}
    >
      <i />
    </button>
  );
}

export function SegTabs({ items = [], value, onChange }) {
  return (
    <div className="seg-tabs">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`seg-tab ${value === item.id ? 'on' : ''}`}
          onClick={() => onChange(item.id)}
        >
          {item.label}
          {item.count != null ? <span className="seg-count">{item.count}</span> : null}
        </button>
      ))}
    </div>
  );
}

export function Chip({ active, onClick, children }) {
  return (
    <button type="button" className={`chip ${active ? 'on' : ''}`} onClick={onClick}>
      {children}
    </button>
  );
}

export function KV({ items = [] }) {
  return (
    <dl className="kv">
      {items.map((item) => (
        <div key={item[0]}>
          <dt>{item[0]}</dt>
          <dd>{item[1]}</dd>
        </div>
      ))}
    </dl>
  );
}
