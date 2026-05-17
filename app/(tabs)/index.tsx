import React from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { Card, Badge, StatusDot, SectionHeader } from '../../components/ui';
import { useAppStore, SessionResult } from '../../lib/store';
import { MOCK_SCENARIOS, MockScenario } from '../../lib/mock';

export default function DashboardScreen() {
  const router = useRouter();
  
  // Get Zustand state
  const { recentSessions, setActiveScenario } = useAppStore();

  const handleSelectScenario = (scenario: MockScenario) => {
    // 1. Pre-fill state in Zustand store
    setActiveScenario(scenario);
    // 2. Navigate to Analysis screen
    router.push('/analysis');
  };

  const handleSelectSession = (session: SessionResult) => {
    // For demonstration, navigate to the simulation screen to view this session's outcome
    router.push('/simulation');
  };

  // Derive metrics
  const activeAlerts = recentSessions.filter(s => s.severity === 'CRITICAL' || s.severity === 'HIGH').length;
  const simulationsRun = recentSessions.length;
  const avgResponseTime = recentSessions.length > 0 
    ? `${Math.round(recentSessions.reduce((acc, s) => acc + parseInt(s.outcome.after.responseTime), 0) / recentSessions.length)}m` 
    : '12m';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* 1. Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>CIRO</Text>
            <Text style={styles.subtitle}>Crisis Intelligence & Response</Text>
          </View>
          <View style={styles.liveIndicator}>
            <StatusDot status="ok" size={10} />
            <Text style={styles.liveText}>SYSTEM ACTIVE</Text>
          </View>
        </View>

        {/* 2. Quick Stats Row */}
        <View style={styles.statsGrid}>
          <Card style={styles.statCard} variant="neutral">
            <Text style={styles.statLabel}>Active Alerts</Text>
            <Text style={[styles.statValue, { color: activeAlerts > 0 ? COLORS.danger : COLORS.textPrimary }]}>
              {activeAlerts}
            </Text>
          </Card>

          <Card style={styles.statCard} variant="neutral">
            <Text style={styles.statLabel}>Agents Online</Text>
            <Text style={[styles.statValue, { color: COLORS.success }]}>5/5</Text>
          </Card>

          <Card style={styles.statCard} variant="neutral">
            <Text style={styles.statLabel}>Sims Run</Text>
            <Text style={styles.statValue}>{simulationsRun}</Text>
          </Card>

          <Card style={styles.statCard} variant="neutral">
            <Text style={styles.statLabel}>Avg Resp</Text>
            <Text style={styles.statValue}>{avgResponseTime}</Text>
          </Card>
        </View>

        {/* 3. Quick Scenario Section */}
        <SectionHeader title="Quick Scenario Simulation" />
        <View style={styles.scenariosGrid}>
          {MOCK_SCENARIOS.map((scenario) => (
            <TouchableOpacity 
              key={scenario.id} 
              onPress={() => handleSelectScenario(scenario)}
              activeOpacity={0.8}
              style={styles.scenarioPressable}
            >
              <Card variant="neutral" style={styles.scenarioCard}>
                <View style={styles.scenarioHeader}>
                  <View style={styles.iconCircle}>
                    <Ionicons name={scenario.icon as any} size={20} color={COLORS.primary} />
                  </View>
                  <Text style={styles.scenarioTitle} numberOfLines={1}>{scenario.title}</Text>
                </View>
                
                <Text style={styles.scenarioLoc} numberOfLines={1}>
                  <Ionicons name="location-outline" size={12} /> {scenario.location}
                </Text>
                
                <View style={styles.scenarioFooter}>
                  <Text style={styles.analyzeText}>Analyze</Text>
                  <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
                </View>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* 4. Recent Sessions Section */}
        <SectionHeader title="Recent Sessions Log" />
        {recentSessions.length === 0 ? (
          <Card variant="neutral" style={styles.emptyCard}>
            <Ionicons name="folder-open-outline" size={32} color={COLORS.textMuted} style={styles.emptyIcon} />
            <Text style={styles.emptyText}>No recent sessions recorded.</Text>
            <Text style={styles.emptySubtext}>Select a quick scenario above or ingest signals to begin.</Text>
          </Card>
        ) : (
          <View style={styles.sessionsList}>
            {recentSessions.map((item) => {
              const severityVariant = 
                item.severity === 'CRITICAL' || item.severity === 'HIGH' ? 'danger' : 
                item.severity === 'MEDIUM' ? 'warning' : 'success';
              
              return (
                <TouchableOpacity 
                  key={item.sessionId} 
                  onPress={() => handleSelectSession(item)}
                  activeOpacity={0.7}
                >
                  <Card variant="neutral" style={styles.sessionRow}>
                    <View style={styles.sessionMain}>
                      <View style={styles.sessionInfo}>
                        <Badge label={item.crisisType} variant="neutral" />
                        <Text style={styles.sessionLocText} numberOfLines={1}>
                          {item.location}
                        </Text>
                      </View>
                      <Badge label={item.severity} variant={severityVariant} />
                    </View>
                    <View style={styles.sessionMeta}>
                      <Text style={styles.sessionTime}>
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 1.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}10`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${COLORS.success}30`,
    gap: 6,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: 0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  scenariosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  scenarioPressable: {
    width: '48%',
  },
  scenarioCard: {
    padding: 12,
    gap: 8,
    height: 120,
    justifyContent: 'space-between',
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scenarioTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    flex: 1,
  },
  scenarioLoc: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  scenarioFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
  },
  analyzeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  emptyIcon: {
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  emptySubtext: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  sessionsList: {
    gap: 10,
  },
  sessionRow: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sessionInfo: {
    gap: 4,
    flex: 1,
  },
  sessionLocText: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  sessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
