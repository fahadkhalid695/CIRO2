import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS, StatusColor, getStatusColor } from '../../constants/colors';

interface CardProps {
  children: React.ReactNode;
  variant?: StatusColor;
  style?: ViewStyle;
}

export function Card({ children, variant = 'neutral', style }: CardProps) {
  const borderColor = getStatusColor(variant);
  
  return (
    <View style={[
      styles.card,
      variant !== 'neutral' && { borderColor, borderWidth: 1 },
      style
    ]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  }
});
