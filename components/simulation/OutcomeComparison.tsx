import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { Card } from '../ui';

interface MetricState {
  congestion: number;
  responseTime: number;
  vehicles: number;
}

interface OutcomeComparisonProps {
  before: { congestionScore: number; responseTime: string; affectedVehicles: number; severity: string };
  after: { congestionScore: number; responseTime: string; affectedVehicles: number; severity: string };
}

export function OutcomeComparison({ before, after }: OutcomeComparisonProps) {
  const getDigits = (str: string) => parseInt(str.replace(/\D/g, '')) || 0;

  const timeBefore = getDigits(before.responseTime);
  const timeAfter = getDigits(after.responseTime);

  const congestionReduction = Math.max(0, Math.round(((before.congestionScore - after.congestionScore) / before.congestionScore) * 100));
  const timeReduction = timeBefore > 0 ? Math.max(0, Math.round(((timeBefore - timeAfter) / timeBefore) * 100)) : 0;
  const vehiclesReduction = Math.max(0, Math.round(((before.affectedVehicles - after.affectedVehicles) / before.affectedVehicles) * 100));

  const [currentBefore, setCurrentBefore] = useState<MetricState>({ congestion: 0, responseTime: 0, vehicles: 0 });
  const [currentAfter, setCurrentAfter] = useState<MetricState>({ congestion: 0, responseTime: 0, vehicles: 0 });

  // RN Animated values for bar widths
  const beforeCongestionAnim = useRef(new Animated.Value(0)).current;
  const afterCongestionAnim = useRef(new Animated.Value(0)).current;
  const beforeVehiclesAnim = useRef(new Animated.Value(0)).current;
  const afterVehiclesAnim = useRef(new Animated.Value(0)).current;
  const beforeTimeAnim = useRef(new Animated.Value(0)).current;
  const afterTimeAnim = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const maxVehicles = Math.max(before.affectedVehicles, after.affectedVehicles, 10);
    const maxTime = Math.max(timeBefore, timeAfter, 10);

    Animated.parallel([
      Animated.timing(beforeCongestionAnim, { toValue: before.congestionScore * 10, duration: 1500, useNativeDriver: false }),
      Animated.timing(afterCongestionAnim, { toValue: after.congestionScore * 10, duration: 1500, useNativeDriver: false }),
      Animated.timing(beforeVehiclesAnim, { toValue: (before.affectedVehicles / maxVehicles) * 100, duration: 1500, useNativeDriver: false }),
      Animated.timing(afterVehiclesAnim, { toValue: (after.affectedVehicles / maxVehicles) * 100, duration: 1500, useNativeDriver: false }),
      Animated.timing(beforeTimeAnim, { toValue: (timeBefore / maxTime) * 100, duration: 1500, useNativeDriver: false }),
      Animated.timing(afterTimeAnim, { toValue: (timeAfter / maxTime) * 100, duration: 1500, useNativeDriver: false }),
      Animated.timing(bannerOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    Animated.timing(badgeOpacity, { toValue: 1, duration: 400, delay: 1600, useNativeDriver: true }).start();

    // Count-up numbers
    const duration = 1500;
    const steps = 30;
    let stepCount = 0;
    const timer = setInterval(() => {
      stepCount += 1;
      const progress = stepCount / steps;
      setCurrentBefore({
        congestion: Math.min(before.congestionScore, +(before.congestionScore * progress).toFixed(1)),
        responseTime: Math.min(timeBefore, Math.round(timeBefore * progress)),
        vehicles: Math.min(before.affectedVehicles, Math.round(before.affectedVehicles * progress)),
      });
      setCurrentAfter({
        congestion: Math.min(after.congestionScore, +(after.congestionScore * progress).toFixed(1)),
        responseTime: Math.min(timeAfter, Math.round(timeAfter * progress)),
        vehicles: Math.min(after.affectedVehicles, Math.round(after.affectedVehicles * progress)),
      });
      if (stepCount >= steps) clearInterval(timer);
    }, duration / steps);

    return () => clearInterval(timer);
  }, [before, after]);

  const toWidthStyle = (anim: Animated.Value) => ({
    width: anim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.summaryBanner, { opacity: bannerOpacity }]}>
        <View style={styles.bannerRow}>
          <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
          <Text style={styles.bannerText}>
            Simulation reduced overall impact by an estimated {congestionReduction}%
          </Text>
        </View>
      </Animated.View>

      <Card variant="neutral" style={styles.comparisonCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.headerTitle}>Intervention Telemetry Comparison</Text>
        </View>

        {/* METRIC 1: Congestion */}
        <View style={styles.metricSection}>
          <Text style={styles.metricLabel}>Congestion Index</Text>
          <View style={styles.dualBarContainer}>
            <View style={styles.metricBlock}>
              <Text style={[styles.metricVal, { color: COLORS.danger }]}>{currentBefore.congestion}/10</Text>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, toWidthStyle(beforeCongestionAnim), { backgroundColor: COLORS.danger }]} />
              </View>
            </View>
            <View style={styles.dividerBlock}><Ionicons name="arrow-forward" size={16} color={COLORS.textSecondary} /></View>
            <View style={styles.metricBlock}>
              <Text style={[styles.metricVal, { color: COLORS.success }]}>{currentAfter.congestion}/10</Text>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, toWidthStyle(afterCongestionAnim), { backgroundColor: COLORS.success }]} />
              </View>
            </View>
          </View>
          <Animated.View style={[styles.badgeContainer, { opacity: badgeOpacity }]}>
            <View style={styles.badge}>
              <Ionicons name="trending-down" size={12} color={COLORS.success} />
              <Text style={styles.badgeText}>-{congestionReduction}% Congestion Reduction</Text>
            </View>
          </Animated.View>
        </View>

        {/* METRIC 2: Response Time */}
        <View style={styles.metricSection}>
          <Text style={styles.metricLabel}>Evacuation Response Time</Text>
          <View style={styles.dualBarContainer}>
            <View style={styles.metricBlock}>
              <Text style={[styles.metricVal, { color: COLORS.danger }]}>{currentBefore.responseTime} mins</Text>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, toWidthStyle(beforeTimeAnim), { backgroundColor: COLORS.danger }]} />
              </View>
            </View>
            <View style={styles.dividerBlock}><Ionicons name="arrow-forward" size={16} color={COLORS.textSecondary} /></View>
            <View style={styles.metricBlock}>
              <Text style={[styles.metricVal, { color: COLORS.success }]}>{currentAfter.responseTime} mins</Text>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, toWidthStyle(afterTimeAnim), { backgroundColor: COLORS.success }]} />
              </View>
            </View>
          </View>
          <Animated.View style={[styles.badgeContainer, { opacity: badgeOpacity }]}>
            <View style={styles.badge}>
              <Ionicons name="flash-outline" size={12} color={COLORS.success} />
              <Text style={styles.badgeText}>-{timeReduction}% Response Arrival Delay</Text>
            </View>
          </Animated.View>
        </View>

        {/* METRIC 3: Stranded Motorists */}
        <View style={styles.metricSection}>
          <Text style={styles.metricLabel}>Stranded Motorists</Text>
          <View style={styles.dualBarContainer}>
            <View style={styles.metricBlock}>
              <Text style={[styles.metricVal, { color: COLORS.danger }]}>{currentBefore.vehicles} cars</Text>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, toWidthStyle(beforeVehiclesAnim), { backgroundColor: COLORS.danger }]} />
              </View>
            </View>
            <View style={styles.dividerBlock}><Ionicons name="arrow-forward" size={16} color={COLORS.textSecondary} /></View>
            <View style={styles.metricBlock}>
              <Text style={[styles.metricVal, { color: COLORS.success }]}>{currentAfter.vehicles} cars</Text>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, toWidthStyle(afterVehiclesAnim), { backgroundColor: COLORS.success }]} />
              </View>
            </View>
          </View>
          <Animated.View style={[styles.badgeContainer, { opacity: badgeOpacity }]}>
            <View style={styles.badge}>
              <Ionicons name="people-outline" size={12} color={COLORS.success} />
              <Text style={styles.badgeText}>-{vehiclesReduction}% Population Clearance</Text>
            </View>
          </Animated.View>
        </View>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: '100%', gap: 12 },
  summaryBanner: {
    backgroundColor: `${COLORS.success}10`,
    borderWidth: 1,
    borderColor: `${COLORS.success}40`,
    borderRadius: 8,
    padding: 10,
  },
  bannerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  bannerText: { fontSize: 12, fontWeight: '800', color: COLORS.success },
  comparisonCard: { padding: 16, gap: 16 },
  cardHeader: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 8 },
  headerTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textPrimary },
  metricSection: { gap: 8 },
  metricLabel: { fontSize: 12, fontWeight: '700', color: COLORS.textSecondary },
  dualBarContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  metricBlock: { flex: 1, gap: 4 },
  metricVal: { fontSize: 15, fontWeight: '800' },
  barTrack: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  dividerBlock: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 },
  badgeContainer: { alignSelf: 'center', marginTop: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: `${COLORS.success}10`, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '700', color: COLORS.success },
});
