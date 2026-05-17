import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  TouchableOpacity,
  Platform,
  Clipboard,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { Card, Badge, Button, SectionHeader, SuccessToast } from '../../components/ui';
import { useAppStore } from '../../lib/store';

// Conditionally import MapView to prevent web bundling failures
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;

if (Platform.OS !== 'web') {
  try {
    const MapModule = require('react-native-maps');
    MapView = MapModule.default;
    Marker = MapModule.Marker;
    Polyline = MapModule.Polyline;
  } catch (e) {
    console.warn("Failed to load react-native-maps, falling back to vector simulation map.", e);
  }
}

export default function SimulationScreen() {
  const router = useRouter();
  
  // Zustand Store
  const { currentSession } = useAppStore();

  // Local references and states
  const logScrollViewRef = useRef<ScrollView>(null);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    if (currentSession) {
      // Small timeout to let screen transition finish before dropping the premium toast
      const t = setTimeout(() => setToastVisible(true), 250);
      return () => clearTimeout(t);
    }
  }, [currentSession]);

  useEffect(() => {
    // Auto-scroll logs to bottom if they load
    if (logScrollViewRef.current) {
      setTimeout(() => {
        logScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 500);
    }
  }, [currentSession]);

  const handleCopyLogs = () => {
    if (!currentSession) return;
    const logString = currentSession.simulation.systemLogs
      .map((log: { time: string; message: string }) => `[${new Date(log.time).toLocaleTimeString()}] ${log.message}`)
      .join('\n');
    Clipboard.setString(logString);
    Alert.alert('Logs Copied', 'Simulated execution trace copied to clipboard.');
  };

  const handleNewAnalysis = () => {
    useAppStore.setState({
      currentLocation: '',
      currentSignals: [],
      activeScenario: null,
      error: null
    });
    router.push('/input');
  };

  if (!currentSession) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Ionicons name="desktop-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Simulation Control Room</Text>
          <Text style={styles.emptySubtitle}>
            No active simulation trace available. Plan and execute actions to run the outcome simulator.
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

  // hardcoded coordinates for G-10 Islamabad
  const mapRegion = {
    latitude: 33.6844,
    longitude: 73.0118,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  const alternateRoute1 = [
    { latitude: 33.6900, longitude: 73.0100 },
    { latitude: 33.6915, longitude: 73.0180 },
    { latitude: 33.6844, longitude: 73.0250 }
  ];

  const alternateRoute2 = [
    { latitude: 33.6800, longitude: 73.0020 },
    { latitude: 33.6760, longitude: 73.0120 },
    { latitude: 33.6844, longitude: 73.0118 }
  ];

  const beforeScore = currentSession.outcome.before.congestionScore || 9;
  const afterScore = currentSession.outcome.after.congestionScore || 3;

  return (
    <SafeAreaView style={styles.safeArea}>
      <SuccessToast 
        message={`Simulation complete — impact reduced by ${Math.round(((beforeScore - afterScore) / beforeScore) * 100)}%!`} 
        visible={toastVisible} 
        onDismiss={() => setToastVisible(false)} 
      />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* SECTION 1: Simulation Header */}
        <Card variant="success" style={styles.successHeader}>
          <View style={styles.successRow}>
            <View style={styles.checkIconCircle}>
              <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.successTitle}>Simulation Complete</Text>
              <Text style={styles.successSubtitle}>All response actions modeled in active sandboxes</Text>
            </View>
          </View>
          <View style={styles.timestampRow}>
            <Ionicons name="time-outline" size={13} color={COLORS.textSecondary} />
            <Text style={styles.timestampText}>
              Executed: {new Date(currentSession.timestamp).toLocaleTimeString()} ({new Date(currentSession.timestamp).toLocaleDateString()})
            </Text>
          </View>
        </Card>

        {/* SECTION 2: Before vs After Cards */}
        <SectionHeader title="Intervention Outcome Analytics" />
        <View style={styles.metricsGrid}>
          
          {/* Congestion metric */}
          <Card variant="neutral" style={styles.metricCard}>
            <Text style={styles.metricHeaderLabel}>Congestion Index</Text>
            <View style={styles.comparisonRow}>
              <Text style={[styles.valBefore, { color: COLORS.danger }]}>{beforeScore}/10</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.textSecondary} />
              <Text style={[styles.valAfter, { color: COLORS.success }]}>{afterScore}/10</Text>
            </View>
            <View style={styles.miniProgressTrack}>
              <View style={[styles.miniProgressBar, { width: `${beforeScore * 10}%`, backgroundColor: COLORS.danger }]} />
            </View>
            <View style={styles.miniProgressTrack}>
              <View style={[styles.miniProgressBar, { width: `${afterScore * 10}%`, backgroundColor: COLORS.success }]} />
            </View>
          </Card>

          {/* Response time metric */}
          <Card variant="neutral" style={styles.metricCard}>
            <Text style={styles.metricHeaderLabel}>Evac Response Time</Text>
            <View style={styles.comparisonRow}>
              <Text style={[styles.valBefore, { color: COLORS.danger }]}>{currentSession.outcome.before.responseTime}</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.textSecondary} />
              <Text style={[styles.valAfter, { color: COLORS.success }]}>{currentSession.outcome.after.responseTime}</Text>
            </View>
            <Text style={styles.reductionLabel}>
              <Ionicons name="trending-down" size={12} color={COLORS.success} /> 73% faster arrival
            </Text>
          </Card>

          {/* Affected vehicles metric */}
          <Card variant="neutral" style={styles.metricCard}>
            <Text style={styles.metricHeaderLabel}>Stranded Motorists</Text>
            <View style={styles.comparisonRow}>
              <Text style={[styles.valBefore, { color: COLORS.danger }]}>{currentSession.outcome.before.affectedVehicles}</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.textSecondary} />
              <Text style={[styles.valAfter, { color: COLORS.success }]}>{currentSession.outcome.after.affectedVehicles}</Text>
            </View>
            <Text style={styles.reductionLabel}>
              <Ionicons name="people" size={12} color={COLORS.success} /> {currentSession.outcome.before.affectedVehicles - currentSession.outcome.after.affectedVehicles} vehicles clear
            </Text>
          </Card>
        </View>

        {/* SECTION 3: Simulated Map View */}
        <SectionHeader title="Simulation Map Corridor" />
        {MapView ? (
          <View style={styles.mapContainer}>
            <MapView
              style={styles.map}
              initialRegion={mapRegion}
              customMapStyle={darkMapStyle}
            >
              {/* Crisis location */}
              <Marker
                coordinate={{ latitude: 33.6844, longitude: 73.0118 }}
                title="Crisis Point"
                description={currentSession.location}
              >
                <View style={styles.redMarkerDot} />
              </Marker>

              {/* Alt Routes */}
              <Polyline
                coordinates={alternateRoute1}
                strokeColor={COLORS.primary}
                strokeWidth={3}
              />
              <Polyline
                coordinates={alternateRoute2}
                strokeColor={COLORS.success}
                strokeWidth={3}
              />

              {/* Emergency units */}
              <Marker
                coordinate={{ latitude: 33.6870, longitude: 73.0150 }}
                title="Rescue 1122"
              >
                <View style={styles.ambulanceMarker}>
                  <Ionicons name="medical" size={12} color="#FFF" />
                </View>
              </Marker>
            </MapView>
            <View style={styles.legend}>
              <Text style={styles.legendText}>🔴 Crisis Area</Text>
              <Text style={styles.legendText}>🔵 Diversion Corridors</Text>
              <Text style={styles.legendText}>🚑 Active Emergency Units</Text>
            </View>
          </View>
        ) : (
          <Card variant="neutral" style={styles.vectorMapCard}>
            <View style={styles.vectorMap}>
              {/* Stunning Vector Map Fallback representing roads and diversion corridors */}
              <View style={styles.vectorRoadContainer}>
                {/* Horizontal main avenue */}
                <View style={styles.vectorRoadH} />
                {/* Vertical bypass */}
                <View style={styles.vectorRoadV} />
                
                {/* Active diversion indicator */}
                <View style={[styles.vectorIndicatorCircle, { left: '48%', top: '48%', backgroundColor: COLORS.danger }]}>
                  <Ionicons name="warning" size={14} color="#FFF" />
                </View>
                
                {/* Rescue unit truck moving */}
                <View style={[styles.vectorIndicatorCircle, { left: '20%', top: '75%', backgroundColor: COLORS.primary }]}>
                  <Ionicons name="medical" size={12} color="#FFF" />
                </View>
                
                {/* Clear green route arrow */}
                <View style={[styles.vectorIndicatorCircle, { left: '75%', top: '25%', backgroundColor: COLORS.success }]}>
                  <Ionicons name="arrow-forward" size={12} color="#FFF" />
                </View>
              </View>
            </View>
            <View style={styles.legend}>
              <Text style={styles.legendText}>🔴 G-10 Markaz (Blocked)</Text>
              <Text style={styles.legendText}>🔵 F-10 Bypass (Clear)</Text>
              <Text style={styles.legendText}>🚑 Rescue 1122 active</Text>
            </View>
          </Card>
        )}

        {/* SECTION 4: Emergency Tickets */}
        <SectionHeader title="Generated Dispatch Tickets" />
        {currentSession.simulation.emergencyTickets.length === 0 ? (
          <Card variant="neutral" style={styles.emptyRow}>
            <Text style={styles.emptyText}>No dispatch tickets generated.</Text>
          </Card>
        ) : (
          <View style={styles.ticketsList}>
            {currentSession.simulation.emergencyTickets.map((t: string, idx: number) => {
              const [id, ...rest] = t.split(': ');
              const details = rest.join(': ');
              return (
                <Card key={idx} variant="neutral" style={styles.ticketCard}>
                  <View style={styles.ticketHeader}>
                    <Badge label={id} variant="primary" />
                    <Badge label="DISPATCHED" variant="success" />
                  </View>
                  <Text style={styles.ticketDesc}>{details}</Text>
                  <View style={styles.assignedRow}>
                    <Ionicons name="shield" size={12} color={COLORS.textSecondary} />
                    <Text style={styles.assignedUnit}>Assigned Responder Unit: Islamabad Rescue Team 3</Text>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* SECTION 5: Sent Alerts */}
        <SectionHeader title="Simulated Alerts Dispatched" />
        {currentSession.simulation.sentAlerts.length === 0 ? (
          <Card variant="neutral" style={styles.emptyRow}>
            <Text style={styles.emptyText}>No emergency alerts dispatched.</Text>
          </Card>
        ) : (
          <View style={styles.alertsList}>
            {currentSession.simulation.sentAlerts.map((alert: string, idx: number) => {
              const icon = alert.includes('SMS') ? 'phone-portrait-outline' : 'radio-outline';
              return (
                <Card key={idx} variant="neutral" style={styles.alertRow}>
                  <View style={styles.alertIconBlock}>
                    <Ionicons name={icon} size={20} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.alertMsg}>{alert}</Text>
                    <Badge label="DISPATCHED SUCCESSFULLY" variant="success" />
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* SECTION 6: Agent Execution Logs */}
        <SectionHeader 
          title="Agent Trace / Execution Log" 
          rightAction={
            <TouchableOpacity onPress={handleCopyLogs} style={styles.copyBtn}>
              <Ionicons name="copy-outline" size={14} color={COLORS.primary} />
              <Text style={styles.copyBtnText}>Copy Logs</Text>
            </TouchableOpacity>
          }
        />
        <View style={styles.terminalContainer}>
          <ScrollView 
            ref={logScrollViewRef}
            style={styles.terminalScroll} 
            contentContainerStyle={styles.terminalContent}
            nestedScrollEnabled
          >
            {currentSession.simulation.systemLogs.length === 0 ? (
              <Text style={styles.terminalLine}>[00:00:00] [SYSTEM] Ready to execute simulation trace...</Text>
            ) : (
              currentSession.simulation.systemLogs.map((log: { time: string; message: string }, idx: number) => (
                <Text key={idx} style={styles.terminalLine}>
                  [{new Date(log.time).toLocaleTimeString()}] {log.message}
                </Text>
              ))
            )}
          </ScrollView>
        </View>

        {/* SECTION 7: New Analysis Button */}
        <Button 
          title="Begin New Analysis Session" 
          onPress={handleNewAnalysis} 
          style={styles.newAnalysisBtn}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

// Minimal dark style config for MapView
const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#0A0E1A" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1F2937" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#111827" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] }
];

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  successHeader: {
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${COLORS.success}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  successSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: `${COLORS.success}20`,
    paddingTop: 8,
    marginTop: 4,
  },
  timestampText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  metricsGrid: {
    gap: 10,
    marginBottom: 16,
  },
  metricCard: {
    padding: 12,
    gap: 8,
  },
  metricHeaderLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  valBefore: {
    fontSize: 18,
    fontWeight: '800',
  },
  valAfter: {
    fontSize: 18,
    fontWeight: '800',
  },
  reductionLabel: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
  },
  miniProgressTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  miniProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  mapContainer: {
    height: 240,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  redMarkerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.danger,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  ambulanceMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 8,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  legendText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  vectorMapCard: {
    marginBottom: 20,
  },
  vectorMap: {
    height: 180,
    backgroundColor: '#0F1626',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  vectorRoadContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  vectorRoadH: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 16,
    backgroundColor: '#1E293B',
    marginTop: -8,
  },
  vectorRoadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 16,
    backgroundColor: '#1E293B',
    marginLeft: -8,
  },
  vectorIndicatorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
    elevation: 3,
  },
  ticketsList: {
    gap: 10,
    marginBottom: 16,
  },
  ticketCard: {
    padding: 12,
    gap: 8,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketDesc: {
    fontSize: 13,
    color: COLORS.textPrimary,
    lineHeight: 18,
    fontWeight: '500',
  },
  assignedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  assignedUnit: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  alertsList: {
    gap: 10,
    marginBottom: 16,
  },
  alertRow: {
    padding: 12,
    flexDirection: 'row',
    gap: 12,
  },
  alertIconBlock: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertMsg: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
    lineHeight: 18,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyBtnText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  terminalContainer: {
    height: 160,
    backgroundColor: '#05070F',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  terminalScroll: {
    flex: 1,
  },
  terminalContent: {
    paddingBottom: 8,
  },
  terminalLine: {
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    color: COLORS.success,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  newAnalysisBtn: {
    marginTop: 16,
    marginBottom: 24,
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
  emptyRow: {
    padding: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
