import { View, Text, StyleSheet } from 'react-native';
import { COLORS, StatusColor, getStatusColor } from '../../constants/colors';

interface BadgeProps {
  label: string;
  variant?: StatusColor | 'info';
}

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const mappedVariant = variant === 'info' ? 'primary' : variant;
  const color = getStatusColor(mappedVariant);
  
  return (
    <View style={[styles.badge, { backgroundColor: `${color}20`, borderColor: color }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  }
});
