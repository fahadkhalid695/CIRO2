import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { COLORS } from '../../constants/colors';
import { Card, Badge, Button, StatusDot, SectionHeader, AgentStep } from '../../components/ui';

export default function DashboardScreen() {
  const [loading, setLoading] = useState(false);
  const [pipelineStatus, setPipelineStatus] = useState<'idle' | 'running' | 'completed'>('idle');

  const triggerPipeline = () => {
    setLoading(true);
    setPipelineStatus('running');
    setTimeout(() => {
      setLoading(false);
      setPipelineStatus('completed');
    }, 2500);
  };

  const resetPipeline = () => {
    setPipelineStatus('idle');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>CIRO COMMAND</Text>
            <Text style={styles.subtitle}>Crisis Intelligence & Response Orchestrator</Text>
          </View>
          <View style={styles.liveIndicator}>
            <StatusDot status={pipelineStatus === 'running' ? 'warning' : 'ok'} size={12} />
            <Text style={styles.liveText}>SYSTEM LIVE</Text>
          </View>
        </View>

        {/* Overview Stats */}
        <SectionHeader title="Active Incident Monitor" />
        
        <View style={styles.statsGrid}>
          <Card variant="danger" style={styles.statCard}>
            <Text style={styles.statLabel}>SEVERITY LEVEL</Text>
            <Text style={styles.statValue}>CRITICAL</Text>
            <Badge label="HIGH CONFIDENCE" variant="danger" />
          </Card>

          <Card variant="neutral" style={styles.statCard}>
            <Text style={styles.statLabel}>RESPONSE AGENTS</Text>
            <Text style={styles.statValue}>5 / 5</Text>
            <Badge label="OPERATIONAL" variant="success" />
          </Card>
        </View>

        {/* Main Control Panel */}
        <SectionHeader title="Orchestration Pipeline" />
        <Card variant={pipelineStatus === 'running' ? 'warning' : 'primary'} style={styles.controlCard}>
          <Text style={styles.controlTitle}>Crisis Assessment Flow</Text>
          <Text style={styles.controlDesc}>
            Trigger multi-agent classification, impact analysis, action generation, and real-time execution simulation.
          </Text>
          
          <View style={styles.actionButtons}>
            {pipelineStatus === 'idle' && (
              <Button title="Execute Full Analysis" onPress={triggerPipeline} loading={loading} />
            )}
            {pipelineStatus === 'running' && (
              <Button title="Orchestrating Agents..." onPress={() => {}} loading={true} />
            )}
            {pipelineStatus === 'completed' && (
              <View style={styles.completedActions}>
                <Badge label="Pipeline Executed Successfully" variant="success" />
                <Button title="Reset Monitor" variant="ghost" onPress={resetPipeline} style={{ marginTop: 12 }} />
              </View>
            )}
          </View>
        </Card>

        {/* Agent Trace Steps */}
        <SectionHeader title="Agent Processing Logs" />
        <Card variant="neutral" style={styles.logsCard}>
          <AgentStep 
            name="1. Signal Ingestion Agent" 
            iconName="cloud-download-outline" 
            status={pipelineStatus === 'idle' ? 'pending' : 'done'} 
            output={pipelineStatus !== 'idle' ? "Parsed 3 live streams: Social, Traffic, Weather from G-10." : undefined} 
          />
          <AgentStep 
            name="2. Crisis Detector (Agent 2)" 
            iconName="shield-outline" 
            status={pipelineStatus === 'idle' ? 'pending' : pipelineStatus === 'running' ? 'running' : 'done'} 
            output={pipelineStatus === 'running' ? "Running LLM classifications..." : pipelineStatus === 'completed' ? "Identified: Flash Flood in G-10. Severity HIGH." : undefined} 
          />
          <AgentStep 
            name="3. Situation Analyst (Agent 3)" 
            iconName="analytics-outline" 
            status={pipelineStatus === 'completed' ? 'done' : pipelineStatus === 'running' ? 'running' : 'pending'} 
            output={pipelineStatus === 'completed' ? "Impact: 2,500 residents. Key requirement: Water rescue." : undefined} 
          />
          <AgentStep 
            name="4. Action Planner (Agent 4)" 
            iconName="list-outline" 
            status={pipelineStatus === 'completed' ? 'done' : 'pending'} 
            output={pipelineStatus === 'completed' ? "Generated 3 response tickets: Dispatch, Broadcast, Diversion." : undefined} 
          />
          <AgentStep 
            name="5. Executor Simulator (Agent 5)" 
            iconName="play-forward-outline" 
            status={pipelineStatus === 'completed' ? 'done' : 'pending'} 
            output={pipelineStatus === 'completed' ? "Evacuation routes projected successfully via F-10 corridor." : undefined} 
          />
        </Card>
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
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.success}15`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${COLORS.success}30`,
    gap: 6,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 6,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  controlCard: {
    gap: 12,
  },
  controlTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  controlDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  actionButtons: {
    marginTop: 8,
  },
  completedActions: {
    alignItems: 'stretch',
  },
  logsCard: {
    paddingVertical: 4,
  },
});
