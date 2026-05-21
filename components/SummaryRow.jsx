'use client';

export default function SummaryRow({ name, passed, failed, pending, total }) {
  const pct = total ? Math.round((passed / total) * 100) : 0;
  return (
    <div className="summary-row">
      <div className="summary-name" style={{ fontSize: 13 }}>{name || 'Unassigned'}</div>
      <div className="summary-meta">
        <span style={{ background: '#dcfce7', color: '#15803d', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 600 }}>{passed} Pass</span>
        <span style={{ background: '#fee2e2', color: '#b91c1c', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 600 }}>{failed} Fail</span>
        <span style={{ background: '#fef3c7', color: '#b45309', borderRadius: 4, padding: '1px 6px', fontSize: 11, fontWeight: 600 }}>{pending} Pending</span>
      </div>
      <div className="summary-bar-wrap">
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${pct}%`, background: 'var(--pass)' }} />
        </div>
      </div>
    </div>
  );
}
