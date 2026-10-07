export default function StatCard({ label, value, sub, icon: Icon, tone }) {
  return (
    <div className={`admin-stat ${tone || ''}`}>
      <div className="stat-icon">{Icon ? <Icon size={18} /> : null}</div>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
        <small>{sub}</small>
      </div>
    </div>
  );
}
