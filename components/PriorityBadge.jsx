import { PRIORITIES, PRIORITY_DEFAULT } from '@/lib/constants';

const PRIORITY_PALETTE = {
  [PRIORITIES.HIGH]: { bg: '#fef2f2', border: '#fca5a5', color: '#dc2626' },
  [PRIORITIES.MEDIUM]: { bg: '#fffbeb', border: '#fcd34d', color: '#d97706' },
  [PRIORITIES.LOW]: { bg: '#f0fdf4', border: '#86efac', color: '#16a34a' },
};

export function priorityBadgeStyle(priority) {
  const p = PRIORITY_PALETTE[priority];
  if (!p) return {};
  return {
    background: p.bg,
    color: p.color,
    border: `1px solid ${p.border}`,
    fontWeight: 600,
  };
}

export default function PriorityBadge({ priority }) {
  const label = priority || PRIORITY_DEFAULT;
  const p = PRIORITY_PALETTE[label] || PRIORITY_PALETTE[PRIORITIES.MEDIUM];
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 20,
        fontSize: 11,
        fontWeight: 700,
        background: p.bg,
        border: `1px solid ${p.border}`,
        color: p.color,
        letterSpacing: '0.04em',
      }}
    >
      {label}
    </span>
  );
}
