import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay,
  FadeIn
} from 'react-native-reanimated';
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
  // Helper to extract digits from string (e.g. "40 mins" -> 40)
  const getDigits = (str: string) => parseInt(str.replace(/\D/g, '')) || 0;

  const timeBefore = getDigits(before.responseTime);
  const timeAfter = getDigits(after.responseTime);

  // 1. Dynamic Percentage Reductions
  const congestionReduction = Math.max(0, Math.round(((before.congestionScore - after.congestionScore) / before.congestionScore) * 100));
  const timeReduction = timeBefore > 0 ? Math.max(0, Math.round(((timeBefore - timeAfter) / timeBefore) * 100)) : 0;
  const vehiclesReduction = Math.max(0, Math.round(((before.affectedVehicles - after.affectedVehicles) / before.affectedVehicles) * 100));

  // 2. Count-Up States for Numbers
  const [currentBefore, setCurrentBefore] = useState<MetricState>({ congestion: 0, responseTime: 0, vehicles: 0 });
  const [currentAfter, setCurrentAfter] = useState<MetricState>({ congestion: 0, responseTime: 0, vehicles: 0 });

  // 3. Shared Values for Reanimated Bar Widths and Opacities
  const beforeCongestionWidth = useSharedValue(0);
  const afterCongestionWidth = useSharedValue(0);
  
  const beforeVehiclesWidth = useSharedValue(0);
  const afterVehiclesWidth = useSharedValue(0);

  const beforeTimeWidth = useSharedValue(0);
  const afterTimeWidth = useSharedValue(0);

  const badgeOpacity = useSharedValue(0);

  useEffect(() => {
    // A. Trigger progress bar width transitions
    beforeCongestionWidth.value = withTiming(before.congestionScore * 10, { duration: 1500 });
    afterCongestionWidth.value = withTiming(after.congestionScore * 10, { duration: 1500 });

    const maxVehicles = Math.max(before.affectedVehicles, after.affectedVehicles, 10);
    beforeVehiclesWidth.value = withTiming((before.affectedVehicles / maxVehicles) * 100, { duration: 1500 });
    afterVehiclesWidth.value = withTiming((after.affectedVehicles / maxVehicles) * 100, { duration: 1500 });

    const maxTime = Math.max(timeBefore, timeAfter, 10);
    beforeTimeWidth.value = withTiming((timeBefore / maxTime) * 100, { duration: 1500 });
    afterTimeWidth.value = withTiming((timeAfter / maxTime) * 100, { duration: 1500 });

    // Fade-in badges after numbers complete counting
    badgeOpacity.value = withDelay(1600, withTiming(1, { duration: 400 }));

    // B. High-Fidelity Count-Up Number interpolation over 1.5 seconds
    const duration = 1500;
    const steps = 30;
    const intervalTime = duration / steps;
    let stepCount = 0;

    const timer = setInterval(() => {
      stepCount += 1;
      const progress = stepCount / steps;

      setCurrentBefore({
        congestion: Math.min(before.congestionScore, +(before.congestionScore * progress).toFixed(1)),
        responseTime: Math.min(timeBefore, Math.round(timeBefore * progress)),
        vehicles: Math.min(before.affectedVehicles, Math.round(before.affectedVehicles * progress))
      });

      setCurrentAfter({
        congestion: Math.min(after.congestionScore, +(after.congestionScore * progress).toFixed(1)),
        responseTime: Math.min(timeAfter, Math.round(timeAfter * progress)),
        vehicles: Math.min(after.affectedVehicles, Math.round(after.affectedVehicles * progress))
      });

      if (stepCount >= steps) {
        clearInterval(timer);
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [before, after]);

  // 4. Animated Width Styles
  const animBeforeCongestion = useAnimatedStyle(() => ({ width: `${beforeCongestionWidth.value}%` }));
  const animAfterCongestion = useAnimatedStyle(() => ({ width: `${afterCongestionWidth.value}%` }));

  const animBeforeVehicles = useAnimatedStyle(() => ({ width: `${beforeVehiclesWidth.value}%` }));
  const animAfterVehicles = useAnimatedStyle(() => ({ width: `${afterVehiclesWidth.value}%` }));

  const animBeforeTime = useAnimatedStyle(() => ({ width: `${beforeTimeWidth.value}%` }));
  const animAfterTime = useAnimatedStyle(() => ({ width: `${afterTimeWidth.value}%` }));

  const animBadge = useAnimatedStyle(() => ({ opacity: badgeOpacity.value }));

  return (
    <View style={styles.container}>
      {/* Summary Banner */}
      <Animated.View entering={FadeIn.duration(400)} style={styles.summaryBanner}>
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

        {/* METRIC 1: Congestion Score */}
        <View style={styles.metricSection}>
          <Text style={styles.metricLabel}>Congestion Index</Text>
          <View style={styles.dualBarContainer}>
            {/* Before (Red) */}
            <View style={styles.metricBlock}>
              <Text style={[styles.metricVal, { color: COLORS.danger }]}>{currentBefore.congestion}/10</Text>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, animBeforeCongestion, { backgroundColor: COLORS.danger }]} />
              </View>
            </View>

            {/* Middle Divider */}
            <View style={styles.dividerBlock}>
              <Ionicons name="arrow-forward" size={16} color={COLORS.textSecondary} />
            </View>

            {/* After (Green) */}
            <View style={styles.metricBlock}>
              <Text style={[styles.metricVal, { color: COLORS.success }]}>{currentAfter.congestion}/10</Text>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, animAfterCongestion, { backgroundColor: COLORS.success }]} />
              </View>
            </View>
          </View>
          
          <Animated.View style={[styles.badgeContainer, animBadge]}>
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
            {/* Before */}
            <View style={styles.metricBlock}>
              <Text style={[styles.metricVal, { color: COLORS.danger }]}>{currentBefore.responseTime} mins</Text>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, animBeforeTime, { backgroundColor: COLORS.danger }]} />
              </View>
            </View>

            {/* Divider */}
            <View style={styles.dividerBlock}>
              <Ionicons name="arrow-forward" size={16} color={COLORS.textSecondary} />
            </View>

            {/* After */}
            <View style={styles.metricBlock}>
              <Text style={[styles.metricVal, { color: COLORS.success }]}>{currentAfter.responseTime} mins</Text>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, animAfterTime, { backgroundColor: COLORS.success }]} />
              </View>
            </View>
          </View>

          <Animated.View style={[styles.badgeContainer, animBadge]}>
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
            {/* Before */}
            <View style={styles.metricBlock}>
              <Text style={[styles.metricVal, { color: COLORS.danger }]}>{currentBefore.vehicles} cars</Text>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, animBeforeVehicles, { backgroundColor: COLORS.danger }]} />
              </View>
            </View>

            {/* Divider */}
            <View style={styles.dividerBlock}>
              <Ionicons name="arrow-forward" size={16} color={COLORS.textSecondary} />
            </View>

            {/* After */}
            <View style={styles.metricBlock}>
              <Text style={[styles.metricVal, { color: COLORS.success }]}>{currentAfter.vehicles} cars</Text>
              <View style={styles.barTrack}>
                <Animated.View style={[styles.barFill, animAfterVehicles, { backgroundColor: COLORS.success }]} />
              </View>
            </View>
          </View>

          <Animated.View style={[styles.badgeContainer, animBadge]}>
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
  container: {
    width: '100%',
    gap: 12,
  },
  summaryBanner: {
    backgroundColor: `${COLORS.success}10`,
    borderWidth: 1,
    borderColor: `${COLORS.success}40`,
    borderRadius: 8,
    padding: 10,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  bannerText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.success,
  },
  comparisonCard: {
    padding: 16,
    gap: 16,
  },
  cardHeader: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  metricSection: {
    gap: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  dualBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricBlock: {
    flex: 1,
    gap: 4,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
  },
  barTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  dividerBlock: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeContainer: {
    alignSelf: 'center',
    marginTop: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: `${COLORS.success}10`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
});
