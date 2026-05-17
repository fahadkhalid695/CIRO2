import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { Card, StatusDot } from '../ui';

interface AnalysisPipelineProps {
  activeStep: number; // 1 to 5
}

export function AnalysisPipeline({ activeStep }: AnalysisPipelineProps) {
  // Creating individual progress animators for each of the 5 agents
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;
  const anim4 = useRef(new Animated.Value(0)).current;
  const anim5 = useRef(new Animated.Value(0)).current;

  const animators = [anim1, anim2, anim3, anim4, anim5];

  useEffect(() => {
    // Whenever activeStep changes, animate the corresponding progress bar from 0 to 1
    const idx = activeStep - 1;
    if (idx >= 0 && idx < 5) {
      // Reset current animator
      animators[idx].setValue(0);
      Animated.timing(animators[idx], {
        toValue: 1,
        duration: 1100, // Slightly shorter than step transition to finish cleanly
        useNativeDriver: false // Width doesn't support native driver
      }).start();
    }

    // Set previous animators to complete (1.0)
    for (let i = 0; i < idx; i++) {
      animators[i].setValue(1);
    }
  }, [activeStep]);

  const agents = [
    { id: 1, name: "Signal Collector", icon: "cloud-download-outline", desc: "Parsing Roman Urdu dialect complaints & utility APIs..." },
    { id: 2, name: "Crisis Detector", icon: "warning-outline", desc: "Cross-checking signal patterns for active emergencies..." },
    { id: 3, name: "Situation Analyst", icon: "analytics-outline", desc: "Estimating local population threat & boundary risk sectors..." },
    { id: 4, name: "Action Planner", icon: "construct-outline", desc: "Designing deployment instructions for emergency wardens..." },
    { id: 5, name: "Simulation Executor", icon: "play-forward-outline", desc: "Running alternative bypass routing models in sandbox..." }
  ];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>AI Orchestrator Pipeline</Text>
          <Text style={styles.subtitle}>Executing Google ADK pipeline tools...</Text>
        </View>
        <StatusDot status="warning" size={12} />
      </View>

      <View style={styles.pipelineBox}>
        {agents.map((agent, idx) => {
          const isPending = activeStep < agent.id;
          const isRunning = activeStep === agent.id;
          const isComplete = activeStep > agent.id;

          const progressWidth = animators[idx].interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%']
          });

          return (
            <Card 
              key={agent.id} 
              variant="neutral" 
              style={[
                styles.agentCard,
                isRunning && styles.runningCard,
                isComplete && styles.completeCard
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[
                    styles.iconCircle,
                    { 
                      backgroundColor: isComplete ? `${COLORS.success}15` : 
                                       isRunning ? `${COLORS.primary}15` : `${COLORS.textMuted}10` 
                    }
                  ]}>
                    <Ionicons 
                      name={agent.icon as any} 
                      size={18} 
                      color={isComplete ? COLORS.success : isRunning ? COLORS.primary : COLORS.textMuted} 
                    />
                  </View>
                  <Text style={[
                    styles.agentTitle, 
                    { color: isComplete || isRunning ? '#FFF' : COLORS.textSecondary }
                  ]}>
                    Agent {agent.id} — {agent.name}
                  </Text>
                </View>

                {/* Status Indicator */}
                {isComplete && (
                  <View style={styles.statusBadge}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                    <Text style={[styles.statusText, { color: COLORS.success }]}>COMPLETE</Text>
                  </View>
                )}
                {isRunning && (
                  <View style={styles.statusBadge}>
                    <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 4 }} />
                    <Text style={[styles.statusText, { color: COLORS.primary }]}>RUNNING</Text>
                  </View>
                )}
                {isPending && (
                  <Text style={[styles.statusText, { color: COLORS.textMuted }]}>PENDING</Text>
                )}
              </View>

              {/* Progress bar container (only for running or finished agents) */}
              {(isRunning || isComplete) && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressTrack}>
                    <Animated.View 
                      style={[
                        styles.progressBar, 
                        { 
                          width: progressWidth,
                          backgroundColor: isComplete ? COLORS.success : COLORS.primary 
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.agentDesc}>{agent.desc}</Text>
                </View>
              )}
            </Card>
          );
        })}
      </View>

      <View style={styles.loaderFooter}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.loaderFooterText}>Orchestrating Gemini responses...</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    fontSize: 22,
    fontWeight: '950',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  pipelineBox: {
    gap: 12,
  },
  agentCard: {
    padding: 14,
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
  },
  runningCard: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}05`,
  },
  completeCard: {
    borderColor: `${COLORS.success}40`,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  agentTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginTop: 12,
    gap: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  agentDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  loaderFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
  },
  loaderFooterText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
