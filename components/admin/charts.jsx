'use client';

function pathFor(values, width, height, pad = 4) {
  if (!values.length) return { line: '', area: '' };
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const step = values.length > 1 ? (width - pad * 2) / (values.length - 1) : 0;
  const points = values.map((v, i) => [
    pad + i * step,
    height - pad - ((v - min) / span) * (height - pad * 2)
  ]);
  const line = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${line} L${points[points.length - 1][0].toFixed(1)},${height} L${points[0][0].toFixed(1)},${height} Z`;
  return { line, area };
}

export function AreaChart({ data = [], height = 170, format = (v) => v }) {
  const values = data.map((d) => Number(d.value) || 0);
  const { line, area } = pathFor(values, 600, height);
  const max = Math.max(...values, 1);
  const total = values.reduce((a, b) => a + b, 0);

  return (
    <div className="chart-wrap">
      <div className="chart-summary">
        <strong>{format(total)}</strong>
        <span className="muted">{data.length ? `${data.length} days` : 'No data yet'}</span>
      </div>
      <svg className="area-chart" viewBox={`0 0 600 ${height}`} preserveAspectRatio="none" role="img" aria-label="Trend chart">
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--a-accent, #2F8F62)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--a-accent, #2F8F62)" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((t) => (
          <line key={t} x1="0" x2="600" y1={height * t} y2={height * t} className="chart-grid" />
        ))}
        {line && <path d={area} fill="url(#areaFill)" />}
        {line && <path d={line} fill="none" stroke="var(--a-accent, #2F8F62)" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />}
      </svg>
      <div className="chart-axis">
        <span>{data[0]?.label}</span>
        <span>{data.length > 1 ? data[data.length - 1].label : ''}</span>
      </div>
      <div className="chart-peak muted">Peak {format(max)}</div>
    </div>
  );
}

export function DonutChart({ data = [], size = 132, format = (v) => v }) {
  const total = data.reduce((a, b) => a + (Number(b.value) || 0), 0);
  const radius = 54;
  const c = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="donut-wrap">
      <svg width={size} height={size} viewBox="0 0 132 132" role="img" aria-label="Breakdown chart">
        <circle cx="66" cy="66" r={radius} fill="none" className="donut-track" strokeWidth="15" />
        {total > 0 &&
          data.map((d) => {
            const frac = (Number(d.value) || 0) / total;
            const dash = frac * c;
            const el = (
              <circle
                key={d.label}
                cx="66"
                cy="66"
                r={radius}
                fill="none"
                stroke={d.color || 'var(--a-accent, #2F8F62)'}
                strokeWidth="15"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
                transform="rotate(-90 66 66)"
              />
            );
            offset += dash;
            return el;
          })}
        <text x="66" y="62" textAnchor="middle" className="donut-total">
          {total.toLocaleString()}
        </text>
        <text x="66" y="80" textAnchor="middle" className="donut-sub">
          total
        </text>
      </svg>
      <ul className="donut-legend">
        {data.map((d) => (
          <li key={d.label}>
            <i style={{ background: d.color || 'var(--a-accent, #2F8F62)' }} />
            <span>{d.label}</span>
            <b>{format(d.value)}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BarList({ data = [], format = (v) => v }) {
  const max = Math.max(...data.map((d) => Number(d.value) || 0), 1);
  return (
    <ul className="bar-list">
      {data.map((d) => (
        <li key={d.label}>
          <span className="bar-label">{d.label}</span>
          <span className="bar-track">
            <i style={{ width: `${Math.max(4, ((Number(d.value) || 0) / max) * 100)}%` }} />
          </span>
          <b>{format(d.value)}</b>
        </li>
      ))}
    </ul>
  );
}

export function Sparkline({ values = [], width = 84, height = 26 }) {
  const { line } = pathFor(values, width, height, 2);
  if (!line) return <span className="muted">—</span>;
  return (
    <svg className="sparkline" width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={line} fill="none" stroke="var(--a-accent, #2F8F62)" strokeWidth="2" />
    </svg>
  );
}
