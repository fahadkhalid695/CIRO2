export const COLORS = {
  background: '#0A0E1A',
  surface: '#111827',
  card: '#1A2236',
  border: '#2D3748',
  primary: '#3B82F6', // blue
  success: '#10B981', // green
  warning: '#F59E0B', // amber
  danger: '#EF4444',  // red
  textPrimary: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#475569',
};

export type ThemeColors = typeof COLORS;
export type StatusColor = 'primary' | 'success' | 'warning' | 'danger' | 'neutral';

export const getStatusColor = (status: StatusColor) => {
  switch (status) {
    case 'primary': return COLORS.primary;
    case 'success': return COLORS.success;
    case 'warning': return COLORS.warning;
    case 'danger': return COLORS.danger;
    case 'neutral': return COLORS.border;
    default: return COLORS.border;
  }
};
