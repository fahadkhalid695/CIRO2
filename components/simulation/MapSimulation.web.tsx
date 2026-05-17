import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated,
  Easing,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

export interface LatLng {
  latitude: number;
  longitude: number;
}

export interface Route {
  id: string;
  coordinates: LatLng[];
  label: string;
  type: 'blocked' | 'alternate';
}

export interface EmergencyUnit {
  id: string;
  type: 'ambulance' | 'police' | 'fire';
  position: LatLng;
  targetPosition: LatLng;
}

interface MapSimulationProps {
  crisisLocation: { lat: number; lng: number; label: string };
  simulatedRoutes: Route[];
  emergencyUnits: EmergencyUnit[];
}

export function MapSimulation({ crisisLocation, simulatedRoutes, emergencyUnits }: MapSimulationProps) {
  const [mapLoading, setMapLoading] = useState(true);
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate radar sweep scanning
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true
        }),
        Animated.timing(scanAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true
        })
      ])
    ).start();

    const timer = setTimeout(() => {
      setMapLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // 1. Animated pulsing marker setup
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 2.5,
            duration: 1500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: false
          })
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.8,
            duration: 0,
            useNativeDriver: false
          })
        ])
      ])
    ).start();
  }, []);

  // 2. Animated emergency unit positions state for slide simulation
  const [activeUnits, setActiveUnits] = useState<EmergencyUnit[]>([]);

  useEffect(() => {
    // Sync starting positions
    setActiveUnits(JSON.parse(JSON.stringify(emergencyUnits)));
  }, [emergencyUnits]);

  // Interpolation/stepping logic: Slides units 12% closer to targets every 500ms
  useEffect(() => {
    if (activeUnits.length === 0) return;

    const timer = setInterval(() => {
      setActiveUnits((prevUnits) => {
        let reachedAll = true;
        const updated = prevUnits.map((unit) => {
          const latDiff = unit.targetPosition.latitude - unit.position.latitude;
          const lngDiff = unit.targetPosition.longitude - unit.position.longitude;
          const distance = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

          // If close enough, lock to target
          if (distance < 0.0002) {
            return {
              ...unit,
              position: { ...unit.targetPosition }
            };
          }

          reachedAll = false;
          return {
            ...unit,
            position: {
              latitude: unit.position.latitude + latDiff * 0.12, // Step 12% closer
              longitude: unit.position.longitude + lngDiff * 0.12
            }
          };
        });

        if (reachedAll) {
          clearInterval(timer);
        }
        return updated;
      });
    }, 500);

    return () => clearInterval(timer);
  }, [emergencyUnits]);

  const getUnitSymbol = (type: string) => {
    switch (type) {
      case 'ambulance': return '🚑';
      case 'police': return '🚔';
      case 'fire': return '🚒';
      default: return '🚨';
    }
  };

  const renderLegend = () => (
    <View style={styles.legend}>
      <View style={styles.legendItem}>
        <View style={styles.legendCrisisDot} />
        <Text style={styles.legendText}>Crisis Point</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={styles.legendBlockedLine} />
        <Text style={styles.legendText}>Blocked Road</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={styles.legendAltLine} />
        <Text style={styles.legendText}>Alt Route</Text>
      </View>
      <View style={styles.legendItem}>
        <Text style={styles.legendIcon}>🚑 🚔</Text>
        <Text style={styles.legendText}>Responders</Text>
      </View>
    </View>
  );

  if (mapLoading) {
    const scanTranslateY = scanAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-10, 290]
    });

    return (
      <View style={styles.container}>
        <View style={styles.mapLoadingFrame}>
          {/* Animated Scanning Sweep Line */}
          <Animated.View style={[
            styles.scanningLine,
            { transform: [{ translateY: scanTranslateY }] }
          ]} />
          
          {/* Decorative Grid Lines Overlay (Satellite scan feel) */}
          <View style={styles.scanningGridOverlay}>
            <View style={styles.gridLineH1} />
            <View style={styles.gridLineH2} />
            <View style={styles.gridLineV1} />
            <View style={styles.gridLineV2} />
          </View>

          {/* Text Indicators */}
          <View style={styles.loadingInfo}>
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginBottom: 12 }} />
            <Text style={styles.loadingMainText}>INITIALIZING MAP SIMULATION...</Text>
            <Text style={styles.loadingSubText}>Acquiring twin-city digital satellite nodes...</Text>
          </View>
        </View>
        {renderLegend()}
      </View>
    );
  }

  // Render Web vector map
  return (
    <View style={styles.container}>
      <View style={styles.fallbackMap}>
        {/* Stunning Web Command Grid Vector Map layout */}
        <View style={styles.gridCanvas}>
          <View style={styles.vectorRoadH} />
          <View style={styles.vectorRoadV} />
          
          {/* Blocked dashed red indicators */}
          <View style={styles.blockedVectorRoad} />
          
          {/* Crisis pulsing center */}
          <View style={styles.crisisVectorCenter}>
            <Animated.View style={[
              styles.fallbackPulseCircle,
              { transform: [{ scale: pulseAnim }], opacity: pulseOpacity }
            ]} />
            <View style={styles.fallbackSolidDot} />
          </View>

          {/* Alternates indicator */}
          <View style={[styles.vectorLabelBubble, { top: '25%', left: '60%' }]}>
            <Text style={styles.vectorLabelText}>Alt Route Clear</Text>
          </View>

          {/* Active responder markers slide simulator indicators */}
          {activeUnits.map((unit) => {
            // Map simulated coordinate percentages dynamically onto the vector grid
            // For demonstration bounding: maps lat 33.68 -> 33.69 to top/bottom layout percents
            const topPercent = 90 - ((unit.position.latitude - 33.67) * 4500);
            const leftPercent = 10 + ((unit.position.longitude - 73.00) * 4500);
            
            return (
              <View 
                key={unit.id} 
                style={[
                  styles.vectorUnitMarker, 
                  { top: `${Math.min(90, Math.max(10, topPercent))}%`, left: `${Math.min(90, Math.max(10, leftPercent))}%` }
                ]}
              >
                <Text style={styles.vectorUnitEmoji}>{getUnitSymbol(unit.type)}</Text>
                <Text style={styles.vectorUnitId}>{unit.id}</Text>
              </View>
            );
          })}
        </View>

        {/* Fallback zoom buttons */}
        <View style={styles.fallbackControls}>
          <TouchableOpacity onPress={() => {}} style={styles.controlBtn}>
            <Ionicons name="add" size={18} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {}} style={styles.controlBtn}>
            <Ionicons name="remove" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {renderLegend()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 12,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendCrisisDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  legendBlockedLine: {
    width: 16,
    height: 3,
    backgroundColor: COLORS.danger,
    borderStyle: 'dashed',
    borderRadius: 1,
  },
  legendAltLine: {
    width: 16,
    height: 3,
    backgroundColor: COLORS.primary,
  },
  legendIcon: {
    fontSize: 12,
  },
  legendText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  fallbackMap: {
    height: 280,
    backgroundColor: '#0F1626',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
  },
  gridCanvas: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  vectorRoadH: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '50%',
    height: 14,
    backgroundColor: '#1E293B',
    marginTop: -7,
  },
  vectorRoadV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 14,
    backgroundColor: '#1E293B',
    marginLeft: -7,
  },
  blockedVectorRoad: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 80,
    height: 14,
    marginLeft: -40,
    marginTop: -7,
    backgroundColor: `${COLORS.danger}30`,
    borderWidth: 1,
    borderColor: COLORS.danger,
    borderStyle: 'dashed',
  },
  crisisVectorCenter: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 40,
    height: 40,
    marginLeft: -20,
    marginTop: -20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fallbackPulseCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${COLORS.danger}30`,
    position: 'absolute',
  },
  fallbackSolidDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.danger,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  vectorLabelBubble: {
    position: 'absolute',
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vectorLabelText: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.primary,
  },
  vectorUnitMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  vectorUnitEmoji: {
    fontSize: 18,
  },
  vectorUnitId: {
    fontSize: 7,
    fontWeight: '800',
    color: COLORS.textPrimary,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 2,
    borderRadius: 3,
    marginTop: 1,
  },
  fallbackControls: {
    position: 'absolute',
    top: 10,
    right: 10,
    gap: 6,
  },
  controlBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(17,24,39,0.85)',
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLoadingFrame: {
    height: 280,
    backgroundColor: '#070B14',
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  scanningLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: COLORS.primary,
    opacity: 0.8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    zIndex: 2,
  },
  scanningGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  gridLineH1: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '33%',
    height: 1,
    backgroundColor: '#FFF',
  },
  gridLineH2: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '66%',
    height: 1,
    backgroundColor: '#FFF',
  },
  gridLineV1: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '33%',
    width: 1,
    backgroundColor: '#FFF',
  },
  gridLineV2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '66%',
    width: 1,
    backgroundColor: '#FFF',
  },
  loadingInfo: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  loadingMainText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  loadingSubText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
});
