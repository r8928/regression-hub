'use client';

export default function MetricCards({ cards, loading = false, columns }) {
  const gridStyle = columns ? { gridTemplateColumns: `repeat(${columns}, 1fr)` } : undefined;
  return (
    <div className="metric-grid" style={gridStyle}>
      {cards.map(({ label, value, cls, sub }) => (
        <div key={label} className={`metric-card ${cls || ''}`}>
          <div className="metric-label">{label}</div>
          <div className="metric-value">{loading ? '—' : value}</div>
          {sub && <div className="metric-sub">{sub}</div>}
        </div>
      ))}
    </div>
  );
}
