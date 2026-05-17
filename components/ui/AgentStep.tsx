import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, StatusColor } from '../../constants/colors';

type AgentStatus = 'pending' | 'running' | 'done' | 'error';

interface AgentStepProps {
  name: string;
  iconName: keyof typeof Ionicons.glyphMap;
  status: AgentStatus;
  output?: string;
}

export function AgentStep({ name, iconName, status, output }: AgentStepProps) {
  const getStatusColor = (): string => {
    switch (status) {
      case 'done': return COLORS.success;
      case 'error': return COLORS.danger;
      case 'running': return COLORS.primary;
      case 'pending': return COLORS.textMuted;
      default: return COLORS.textMuted;
    }
  };

  const statusColor = getStatusColor();

  return (
    <View style={styles.container}>
      <View style={[styles.iconContainer, { backgroundColor: `${statusColor}20` }]}>
        <Ionicons name={iconName} size={20} color={statusColor} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name}>{name}</Text>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {status.toUpperCase()}
          </Text>
        </View>
        
        {output && (
          <Text style={styles.output} numberOfLines={2}>
            {output}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  output: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  }
});
