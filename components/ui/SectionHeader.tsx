import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/colors';

interface SectionHeaderProps {
  title: string;
  rightAction?: React.ReactNode;
}

export function SectionHeader({ title, rightAction }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {rightAction && <View>{rightAction}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    marginTop: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  }
});
