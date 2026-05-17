import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { Card, Badge, StatusDot, SectionHeader, ScenarioCard } from '../../components/ui';
import { useAppStore } from '../../lib/store';
import { PRESET_SCENARIOS, PresetScenario } from '../../lib/mock/scenarios';

export default function DashboardScreen() {
  const router = useRouter();
  
  // Get Zustand state
  const { recentSessions, setAnalysisComplete } = useAppStore();

  const [showSplash, setShowSplash] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Prevent replaying splash on tab switching
    if ((global as any).splashAlreadyPlayed) {
      setShowSplash(false);
      return;
    }

    // 1. Fade in CIRO Logo
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true
    }).start();

    // 2. Slide up subtitle
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 1000,
      useNativeDriver: true
    }).start();

    // 3. Complete launch transition
    const timer = setTimeout(() => {
      (global as any).splashAlreadyPlayed = true;
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const handleSelectScenario = (scenario: PresetScenario) => {
    // 1. Pre-populate full pre-computed Google ADK session state directly so demo works 100% offline
    setAnalysisComplete(scenario.precomputedSession as any);
    // 2. Navigate to real-time Multi-Agent Trace pipeline animation hub
    router.push('/analysis');
  };

  const handleSelectSession = (session: any) => {
    // For demonstration, navigate to the simulation screen to view this session's outcome comparison
    router.push('/simulation');
  };

  // Derive metrics
  const activeAlerts = recentSessions.filter(s => s.severity === 'CRITICAL' || s.severity === 'HIGH').length;
  const simulationsRun = recentSessions.length;
  const avgResponseTime = recentSessions.length > 0 
    ? `${Math.round(recentSessions.reduce((acc, s) => acc + parseInt(s.outcome.after.responseTime || '12'), 0) / recentSessions.length)}m` 
    : '12m';

  if (showSplash) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.splashContainer]}>
        <Animated.View style={[styles.splashContent, { opacity: fadeAnim }]}>
          <View style={styles.splashLogoContainer}>
            <Ionicons name="shield-checkmark" size={68} color={COLORS.primary} />
            <Text style={styles.splashTitle}>CIRO</Text>
          </View>
          
          <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
            <Text style={styles.splashSubtitle}>CRISIS INTELLIGENCE & RESPONSE</Text>
            <View style={styles.splashTelemetryRow}>
              <ActivityIndicator size="small" color={COLORS.success} style={{ marginRight: 6 }} />
              <Text style={styles.splashTelemetryText}>Syncing satellite feeds...</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </SafeAreaView>
    );
  }

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
        <View style={styles.scenariosList}>
          {PRESET_SCENARIOS.map((scenario, idx) => (
            <ScenarioCard
              key={scenario.id}
              title={scenario.title}
              subtitle={scenario.subtitle}
              location={scenario.location}
              iconName={scenario.iconName as any}
              index={idx}
              onPress={() => handleSelectScenario(scenario)}
            />
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
  scenariosList: {
    gap: 8,
    marginBottom: 16,
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
  splashContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#05070F',
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  splashLogoContainer: {
    alignItems: 'center',
    gap: 12,
  },
  splashTitle: {
    fontSize: 48,
    fontWeight: '950',
    color: '#FFF',
    letterSpacing: 4,
    textShadowColor: `${COLORS.primary}80`,
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
  },
  splashSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '800',
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  splashTelemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  splashTelemetryText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
