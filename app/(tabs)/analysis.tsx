import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { COLORS } from '../../constants/colors';
import { Card, Badge, Button, SectionHeader, StatusDot, AgentStep, NetworkErrorCard, ApiErrorCard } from '../../components/ui';
import { useAppStore } from '../../lib/store';
import { AnalysisPipeline, AgentTraceViewer } from '../../components/agents';

export default function AnalysisScreen() {
  const router = useRouter();
  
  // Zustand Store Integration
  const { currentSession, isAnalyzing, analysisStep, error, startAnalysis, setDemoMode, clearError } = useAppStore();

  const [collapsedExplanation, setCollapsedExplanation] = useState(true);
  const [collapsedTrace, setCollapsedTrace] = useState(true);
  const [traceVisible, setTraceVisible] = useState(false);
  const [expandedPayloadIdx, setExpandedPayloadIdx] = useState<number | null>(null);

  const toggleViewPayload = (index: number) => {
    setExpandedPayloadIdx(expandedPayloadIdx === index ? null : index);
  };

  const handleRetry = () => {
    clearError();
    startAnalysis();
  };

  const handleTryDemo = () => {
    setDemoMode(true);
    clearError();
    startAnalysis();
  };

  const handleViewActionPlan = () => {
    router.push('/actions');
  };

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

  // State 1: Error Display Case
  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: COLORS.background }}>
          {error === 'NO_INTERNET' ? (
            <NetworkErrorCard onRetry={handleRetry} />
          ) : (
            <ApiErrorCard 
              message="The Google Gemini API request timed out. Please verify server connection." 
              onRetry={handleRetry} 
              onTryDemo={handleTryDemo} 
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  // State 2: Visual Multi-Agent Progress Pipeline
  if (isAnalyzing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AnalysisPipeline activeStep={analysisStep} />
      </SafeAreaView>
    );
  }

  // State 3: Empty State (No Telemetry Sessions)
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
              <Ionicons name="alert-circle-outline" size={20} color={severityColor} style={styles.summaryIcon} />
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

        {/* Google ADK / Antigravity Orchestrator Trace Card */}
        <Animated.View entering={FadeInUp.delay(450).duration(400)}>
          <SectionHeader title="Google ADK Agent Trace" />
          
          <TouchableOpacity 
            style={styles.launchVisualizerBtn}
            onPress={() => setTraceVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="desktop-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.launchVisualizerText}>LAUNCH ADK INTERACTIVE DASHBOARD</Text>
          </TouchableOpacity>

          <Card variant="neutral" style={styles.traceLogCard}>
            <TouchableOpacity 
              onPress={() => setCollapsedTrace(!collapsedTrace)}
              activeOpacity={0.7}
              style={styles.traceToggle}
            >
              <View style={styles.traceToggleHeader}>
                <Ionicons name="git-branch" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.traceHeaderTitle}>CIROOrchestrator Logs</Text>
              </View>
              <Ionicons 
                name={collapsedTrace ? "chevron-down" : "chevron-up"} 
                size={20} 
                color={COLORS.textSecondary} 
              />
            </TouchableOpacity>

            {!collapsedTrace && (
              <Animated.View entering={FadeIn} style={styles.traceContent}>
                <Text style={styles.traceAgentDesc}>
                  Agent: <Text style={{fontWeight: 'bold', color: COLORS.textPrimary}}>CIROOrchestrator</Text>{"\n"}
                  Description: Coordinates multi-agent crisis detection and response for Pakistani metropolitan areas.
                </Text>
                
                {currentSession.agentTrace && currentSession.agentTrace.map((step: any, idx: number) => {
                  const duration = step.durationMs ? `${step.durationMs}ms` : 'Completed';
                  const toolName = step.metadata?.adkTool || 
                                   (idx === 0 ? 'signalNormalizationTool' :
                                    idx === 1 ? 'crisisDetectionTool' :
                                    idx === 2 ? 'situationAnalysisTool' :
                                    idx === 3 ? 'actionPlanningTool' : 'simulationTool');
                  return (
                    <View key={idx} style={styles.traceStepItem}>
                      <View style={styles.traceStepHeader}>
                        <View style={styles.traceStepLeft}>
                          <View style={[styles.stepDot, { backgroundColor: (step.status || 'completed') === 'completed' ? COLORS.success : COLORS.primary }]} />
                          <Text style={styles.traceStepName}>{step.agent || `Agent Step ${idx + 1}`}</Text>
                        </View>
                        <Badge label={duration} variant="success" />
                      </View>
                      
                      <View style={styles.traceStepMeta}>
                        <Text style={styles.traceMetaLabel}>ADK Tool: <Text style={styles.traceMetaValue}>{toolName}</Text></Text>
                        <Text style={styles.traceMetaLabel}>Status: <Text style={[styles.traceMetaValue, {color: COLORS.success, fontWeight: '700'}]}>{(step.status || 'completed').toUpperCase()}</Text></Text>
                        
                        <TouchableOpacity 
                          style={styles.viewJsonBtn} 
                          onPress={() => toggleViewPayload(idx)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.viewJsonText}>
                            {expandedPayloadIdx === idx ? 'Hide ADK Parameters ▲' : 'View ADK Parameters ▼'}
                          </Text>
                        </TouchableOpacity>
                        
                        {expandedPayloadIdx === idx && (
                          <View style={styles.jsonBlock}>
                            <Text style={styles.jsonTitle}>ADK Telemetry Parameters:</Text>
                            <Text style={styles.jsonCode}>
                              {JSON.stringify({
                                tool: toolName,
                                status: step.status,
                                timestamp: step.timestamp,
                                input: step.metadata?.adkInput || "Raw data stream feeds from local sectors",
                                output: step.metadata?.adkOutput || "Processed multi-agent state mapping outcomes"
                              }, null, 2)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </Animated.View>
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

      {/* Interactive ADK Modal Viewer */}
      <AgentTraceViewer 
        visible={traceVisible}
        onClose={() => setTraceVisible(false)}
        trace={currentSession.agentTrace && currentSession.agentTrace.length > 0 ? currentSession.agentTrace as any : []}
      />
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
  traceLogCard: {
    padding: 12,
    marginTop: 4,
  },
  traceToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  traceToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  traceHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  traceContent: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    gap: 16,
  },
  traceAgentDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
    backgroundColor: `${COLORS.background}50`,
    padding: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  traceStepItem: {
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.border}50`,
    paddingBottom: 12,
    gap: 8,
  },
  traceStepHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  traceStepLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  traceStepName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  traceStepMeta: {
    paddingLeft: 16,
    gap: 4,
  },
  traceMetaLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  traceMetaValue: {
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  viewJsonBtn: {
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  viewJsonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  jsonBlock: {
    backgroundColor: '#0F1626',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    padding: 10,
    marginTop: 8,
  },
  jsonTitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 6,
    fontWeight: '700',
  },
  jsonCode: {
    fontSize: 10,
    color: '#38BDF8',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    lineHeight: 14,
  },
  launchVisualizerBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  launchVisualizerText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
