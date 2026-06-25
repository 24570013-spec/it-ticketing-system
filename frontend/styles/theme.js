// ── Centralized Design System ─────────────────────────────────────────────────
// Single source of truth for all colors, spacing, and shared styles

export const COLORS = {
  // Primary palette
  primary:      '#3182ce',
  primaryDark:  '#2b6cb0',
  primaryLight: '#ebf8ff',
  primaryText:  '#bee3f8',

  // Backgrounds
  bgPage:    '#f7fafc',
  bgCard:    '#ffffff',
  bgMuted:   '#f7fafc',
  bgHover:   '#ebf8ff',

  // Borders
  border:    '#e2e8f0',
  borderFocus: '#3182ce',

  // Text
  textMain:      '#2d3748',
  textSecondary: '#4a5568',
  textMuted:     '#718096',
  textDisabled:  '#a0aec0',
  textWhite:     '#ffffff',

  // Semantic
  danger:     '#c53030',
  dangerBg:   '#fff5f5',
  dangerBorder:'#feb2b2',

  success:      '#276749',
  successBg:    '#f0fff4',
  successBorder:'#9ae6b4',

  warning:      '#c05621',
  warningBg:    '#fffaf0',
  warningBorder:'#fbd38d',

  info:        '#2b6cb0',
  infoBg:      '#ebf8ff',
  infoBorder:  '#bee3f8',

  // Priority
  priority: {
    high:   { color: '#c53030', bg: '#fff5f5', border: '#feb2b2' },
    medium: { color: '#c05621', bg: '#fffaf0', border: '#fbd38d' },
    low:    { color: '#276749', bg: '#f0fff4', border: '#9ae6b4' },
  },

  // Status
  status: {
    open:        { bg: '#dbeafe', color: '#1d4ed8' },
    waiting:     { bg: '#ede9fe', color: '#6d28d9' },
    in_progress: { bg: '#ffedd5', color: '#c2410c' },
    checking:    { bg: '#fef3c7', color: '#b45309' },
    pending:     { bg: '#fce7f3', color: '#be185d' },
    resolved:    { bg: '#dcfce7', color: '#15803d' },
    closed:      { bg: '#f3f4f6', color: '#6b7280' },
  },
};

export const RADIUS = { sm: 4, md: 6, lg: 8, full: 9999 };
export const SHADOW = {
  sm: '0 1px 3px rgba(0,0,0,0.06)',
  md: '0 2px 8px rgba(0,0,0,0.10)',
};

// ── Shared style objects ───────────────────────────────────────────────────────

export const labelStyle = {
  display: 'block',
  fontSize: 13,
  fontWeight: 600,
  color: COLORS.textSecondary,
  marginBottom: 5,
};

export const inputStyle = {
  display: 'block',
  width: '100%',
  padding: '8px 12px',
  border: `1px solid ${COLORS.border}`,
  borderRadius: RADIUS.md,
  fontSize: 13,
  boxSizing: 'border-box',
  color: COLORS.textMain,
  background: COLORS.bgCard,
  outline: 'none',
  transition: 'border-color 0.15s',
};

export const btnPrimary = {
  padding: '8px 20px',
  background: COLORS.primary,
  color: COLORS.textWhite,
  border: 'none',
  borderRadius: RADIUS.md,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 600,
};

export const btnSecondary = {
  padding: '8px 16px',
  background: '#edf2f7',
  color: COLORS.textSecondary,
  border: 'none',
  borderRadius: RADIUS.md,
  cursor: 'pointer',
  fontSize: 13,
};

export const btnDanger = {
  padding: '4px 12px',
  background: COLORS.dangerBg,
  color: COLORS.danger,
  border: 'none',
  borderRadius: RADIUS.sm,
  cursor: 'pointer',
  fontSize: 12,
};

export const card = {
  background: COLORS.bgCard,
  border: `1px solid ${COLORS.border}`,
  borderRadius: RADIUS.lg,
  padding: '20px',
  boxShadow: SHADOW.sm,
};

export const thStyle = {
  padding: '10px 14px',
  fontWeight: 600,
  color: COLORS.textSecondary,
  textAlign: 'left',
  borderBottom: `2px solid ${COLORS.border}`,
  whiteSpace: 'nowrap',
  fontSize: 12,
  background: COLORS.bgMuted,
};

export const tdStyle = {
  padding: '10px 14px',
  color: COLORS.textMain,
  borderBottom: `1px solid #edf2f7`,
  fontSize: 13,
};

export const alertError = {
  background: COLORS.dangerBg,
  border: `1px solid ${COLORS.dangerBorder}`,
  borderRadius: RADIUS.md,
  padding: '10px 14px',
  color: COLORS.danger,
  fontSize: 13,
  marginBottom: 16,
};

export const alertSuccess = {
  background: COLORS.successBg,
  border: `1px solid ${COLORS.successBorder}`,
  borderRadius: RADIUS.md,
  padding: '10px 14px',
  color: COLORS.success,
  fontSize: 13,
};

export const alertWarning = {
  background: COLORS.warningBg,
  border: `1px solid ${COLORS.warningBorder}`,
  borderRadius: RADIUS.md,
  padding: '10px 14px',
  color: COLORS.warning,
  fontSize: 13,
};
