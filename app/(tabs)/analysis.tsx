import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeIn, Layout } from 'react-native-reanimated';
import { COLORS } from '../../constants/colors';
import { Card, Badge, Button, SectionHeader, StatusDot, AgentStep } from '../../components/ui';
import { useAppStore } from '../../lib/store';

export default function AnalysisScreen() {
  const router = useRouter();
  const { recentSessions } = useAppStore();

  const currentSession = recentSessions.length > 0 ? recentSessions[0] : null;

  // Local state to manage the visual multi-agent trace steps
  const [traceSessionId, setTraceSessionId] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);
  const [activeStep, setActiveStep] = useState(0); // 0 to 5
  const [collapsedExplanation, setCollapsedExplanation] = useState(true);

  // Trigger real-time multi-agent trace animation when a new session is processed
  useEffect(() => {
    if (currentSession && currentSession.sessionId !== traceSessionId) {
      setTraceSessionId(currentSession.sessionId);
      startAgentTraceAnimation();
    }
  }, [currentSession]);

  const startAgentTraceAnimation = () => {
    setAnimating(true);
    setActiveStep(1);

    // Sequence through each of the 5 agents
    let step = 1;
    const interval = setInterval(() => {
      step += 1;
      if (step <= 5) {
        setActiveStep(step);
      } else {
        clearInterval(interval);
        setAnimating(false);
      }
    }, 1200); // 1.2 seconds per agent step
  };

  const handleViewActionPlan = () => {
    router.push('/actions');
  };

  // 0. Empty State
  if (!currentSession) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Crisis Analyst Hub</Text>
          <Text style={styles.emptySubtitle}>
            No active crisis telemetry detected. Please enter signals or load a preset scenario.
          </Text>
          <Button 
            title="Go to Signal Input" 
            onPress={() => router.push('/input')} 
            style={styles.emptyBtn}
          />
        </View>
      </SafeAreaView>
    );
  }

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'CRITICAL': return COLORS.danger;
      case 'HIGH': return COLORS.danger;
      case 'MEDIUM': return COLORS.warning;
      case 'LOW': return COLORS.success;
      default: return COLORS.textSecondary;
    }
  };

  const getCrisisBadgeColor = (type: string) => {
    switch (type) {
      case 'URBAN_FLOODING': return COLORS.primary;
      case 'ACCIDENT': return COLORS.danger;
      case 'HEATWAVE': return COLORS.warning;
      case 'INFRASTRUCTURE_FAILURE': return '#F59E0B'; // Orange
      default: return COLORS.textSecondary;
    }
  };

  // State 1: Loading/Processing
  if (animating) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.header}>
            <View>
              <Text style={styles.processingTitle}>AI Orchestrator Pipeline</Text>
              <Text style={styles.processingSub}>Sequencing multi-agent telemetry...</Text>
            </View>
            <StatusDot status="warning" size={12} />
          </View>

          <View style={styles.traceContainer}>
            {/* Agent 1 */}
            <AgentStep 
              name="Agent 1 — Signal Collector" 
              iconName="cloud-download-outline" 
              status={activeStep === 1 ? 'running' : activeStep > 1 ? 'done' : 'pending'} 
              output={activeStep >= 1 ? "Normalizing informal Roman Urdu/English reports and APIs..." : undefined}
            />

            {/* Agent 2 */}
            <AgentStep 
              name="Agent 2 — Crisis Detector" 
              iconName="warning-outline" 
              status={activeStep === 2 ? 'running' : activeStep > 2 ? 'done' : 'pending'} 
              output={activeStep >= 2 ? "Analyzing signal clusters for crisis patterns..." : undefined}
            />

            {/* Agent 3 */}
            <AgentStep 
              name="Agent 3 — Situation Analyst" 
              iconName="analytics-outline" 
              status={activeStep === 3 ? 'running' : activeStep > 3 ? 'done' : 'pending'} 
              output={activeStep >= 3 ? "Estimating population threat, affected boundaries..." : undefined}
            />

            {/* Agent 4 */}
            <AgentStep 
              name="Agent 4 — Action Planner" 
              iconName="construct-outline" 
              status={activeStep === 4 ? 'running' : activeStep > 4 ? 'done' : 'pending'} 
              output={activeStep >= 4 ? "Designing localized responder deployment schedules..." : undefined}
            />

            {/* Agent 5 */}
            <AgentStep 
              name="Agent 5 — Simulation Executor" 
              iconName="play-forward-outline" 
              status={activeStep === 5 ? 'running' : activeStep > 5 ? 'done' : 'pending'} 
              output={activeStep >= 5 ? "Executing path simulations & outcomes..." : undefined}
            />
          </View>

          <View style={styles.loaderFooter}>
            <ActivityIndicator size="small" color={COLORS.primary} />
            <Text style={styles.loaderFooterText}>Orchestrating Gemini responses...</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // State 2: Results Display
  const severityColor = getSeverityColor(currentSession.severity);
  const badgeColor = getCrisisBadgeColor(currentSession.crisisType);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Results Header */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.resultsHeader}>
          <View style={styles.badgeRow}>
            <View style={[styles.crisisBadge, { backgroundColor: badgeColor + '20', borderColor: badgeColor }]}>
              <Text style={[styles.crisisBadgeText, { color: badgeColor }]}>{currentSession.crisisType}</Text>
            </View>
            <Badge label={currentSession.severity} variant={currentSession.severity === 'CRITICAL' || currentSession.severity === 'HIGH' ? 'danger' : 'warning'} />
          </View>
          <Text style={styles.sessionLocTitle}>
            <Ionicons name="location" size={20} color={COLORS.danger} /> {currentSession.location}
          </Text>
        </Animated.View>

        {/* Confidence Meter */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <Card variant="neutral" style={styles.confidenceCard}>
            <View style={styles.confidenceHeader}>
              <Text style={styles.confidenceLabel}>Detection Confidence</Text>
              <Text style={[styles.confidenceValue, { color: badgeColor }]}>94%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressBar, { width: '94%', backgroundColor: badgeColor }]} />
            </View>
          </Card>
        </Animated.View>

        {/* Situation Summary Card */}
        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <SectionHeader title="Situation Summary" />
          <Card variant="neutral" style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Ionicons name="shield-alert-outline" size={20} color={severityColor} style={styles.summaryIcon} />
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Incident Severity</Text>
                <Text style={[styles.summaryVal, { color: severityColor }]}>{currentSession.severity}</Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <Ionicons name="people-outline" size={20} color={COLORS.primary} style={styles.summaryIcon} />
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Population Threatened</Text>
                <Text style={styles.summaryVal}>{currentSession.outcome.before.affectedVehicles} vehicles stranded</Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <Ionicons name="map-outline" size={20} color={COLORS.success} style={styles.summaryIcon} />
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Estimated Area Bound</Text>
                <Text style={styles.summaryVal}>{currentSession.location}</Text>
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Collapsible AI Explanation Card */}
        <Animated.View entering={FadeInUp.delay(400).duration(400)}>
          <SectionHeader title="Orchestrator Explanation" />
          <Card variant="neutral" style={styles.explanationCard}>
            <TouchableOpacity 
              onPress={() => setCollapsedExplanation(!collapsedExplanation)}
              activeOpacity={0.7}
              style={styles.explanationToggle}
            >
              <Text style={styles.explanationHeaderTitle}>Gemini Crisis Analysis</Text>
              <Ionicons 
                name={collapsedExplanation ? "chevron-down" : "chevron-up"} 
                size={20} 
                color={COLORS.textSecondary} 
              />
            </TouchableOpacity>

            {!collapsedExplanation && (
              <Animated.Text entering={FadeIn} style={styles.explanationText}>
                {currentSession.explanation}
              </Animated.Text>
            )}
          </Card>
        </Animated.View>

        {/* View Action Plan Button */}
        <Animated.View entering={FadeInUp.delay(500).duration(400)}>
          <Button 
            title="View Action Plan →" 
            onPress={handleViewActionPlan} 
            style={styles.actionBtn}
          />
        </Animated.View>

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
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 16,
  },
  processingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  processingSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  traceContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    gap: 4,
  },
  loaderFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginVertical: 16,
  },
  loaderFooterText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyBtn: {
    width: '80%',
    marginTop: 8,
  },
  resultsHeader: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 16,
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  crisisBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  crisisBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sessionLocTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceCard: {
    padding: 14,
    gap: 10,
    marginBottom: 8,
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  summaryCard: {
    padding: 16,
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryIcon: {
    width: 24,
    textAlign: 'center',
  },
  summaryContent: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.border}50`,
    paddingBottom: 8,
  },
  summaryLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  summaryVal: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  explanationCard: {
    padding: 12,
  },
  explanationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  explanationHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  explanationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
  },
  actionBtn: {
    marginTop: 24,
    marginBottom: 16,
  },
});
