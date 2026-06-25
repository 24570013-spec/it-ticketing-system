import { COLORS } from '../../styles/theme';

const LABEL_MAP = { high: 'High', medium: 'Medium', low: 'Low' };

export default function PriorityBadge({ priority }) {
  const p = COLORS.priority[priority] || { color: '#6b7280', bg: '#f3f4f6', border: '#e2e8f0' };
  return (
    <span style={{
      padding: '2px 10px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 700,
      background: p.bg,
      color: p.color,
      border: `1px solid ${p.border}`,
      whiteSpace: 'nowrap',
      letterSpacing: '0.3px',
    }}>
      {LABEL_MAP[priority] || priority}
    </span>
  );
}
