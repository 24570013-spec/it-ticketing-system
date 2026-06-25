const COLOR_MAP = {
  open:        { background: '#dbeafe', color: '#1d4ed8' },
  waiting:     { background: '#ede9fe', color: '#6d28d9' },
  in_progress: { background: '#ffedd5', color: '#c2410c' },
  checking:    { background: '#fef3c7', color: '#b45309' },
  pending:     { background: '#fce7f3', color: '#be185d' },
  resolved:    { background: '#dcfce7', color: '#15803d' },
  closed:      { background: '#f3f4f6', color: '#6b7280' },
};

const LABEL_MAP = {
  open:        'Open',
  waiting:     'Waiting',
  in_progress: 'In Progress',
  checking:    'Checking',
  pending:     'Pending',
  resolved:    'Resolved',
  closed:      'Closed',
};

export default function StatusBadge({ status }) {
  const style = COLOR_MAP[status] || { background: '#f3f4f6', color: '#6b7280' };
  return (
    <span style={{
      ...style,
      padding: '2px 10px',
      borderRadius: '12px',
      fontSize: '0.8rem',
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      {LABEL_MAP[status] || status}
    </span>
  );
}
