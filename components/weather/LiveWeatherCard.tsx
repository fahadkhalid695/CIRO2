import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  Switch,
  Platform,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { Config } from '../../lib/config';

// Weather Codes to Ionicons mapping
function getWeatherIconName(code: number): string {
  if (code === 0) return 'sunny-outline';
  if ([1, 2, 3].includes(code)) return 'partly-sunny-outline';
  if ([45, 48].includes(code)) return 'cloudy-outline';
  if ([51, 53, 55].includes(code)) return 'rainy-outline';
  if ([61, 63, 65].includes(code)) return 'rainy';
  if ([80, 81, 82].includes(code)) return 'thunderstorm-outline';
  if ([95, 96, 99].includes(code)) return 'thunderstorm';
  return 'cloudy-outline';
}

export interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  precipitation: number;
  rain: number;
  windSpeed: number;
  windDirection: number;
  weatherCode: number;
  weatherDescription: string;
  isRaining: boolean;
  rainIntensity: 'none' | 'light' | 'moderate' | 'heavy' | 'extreme';
  floodRisk: 'low' | 'medium' | 'high' | 'critical';
  alertLevel: 'none' | 'watch' | 'warning' | 'emergency';
  alerts: Array<{
    type: string;
    severity: string;
    message: string;
    timestamp: string;
  }>;
  included?: boolean;
}

interface LiveWeatherCardProps {
  location: string;
  onWeatherLoaded: (data: WeatherData) => void;
}

// ----------------------------------------------------
// A Silky Smooth Pure React Native Rain Drops Animator
// ----------------------------------------------------
interface RainDrop {
  left: string;
  delay: number;
  duration: number;
}

const RAIN_DROPS: RainDrop[] = [
  { left: '10%', delay: 0, duration: 900 },
  { left: '25%', delay: 150, duration: 1100 },
  { left: '40%', delay: 300, duration: 800 },
  { left: '55%', delay: 50, duration: 1000 },
  { left: '70%', delay: 200, duration: 950 },
  { left: '85%', delay: 400, duration: 850 },
  { left: '92%', delay: 100, duration: 1050 }
];

function RainOverlay() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {RAIN_DROPS.map((drop, idx) => {
        const fallAnim = useRef(new Animated.Value(-20)).current;

        useEffect(() => {
          const runLoop = () => {
            fallAnim.setValue(-20);
            Animated.sequence([
              Animated.delay(drop.delay),
              Animated.timing(fallAnim, {
                toValue: 240,
                duration: drop.duration,
                easing: Easing.linear,
                useNativeDriver: true
              })
            ]).start(({ finished }) => {
              if (finished) {
                runLoop();
              }
            });
          };

          runLoop();
        }, []);

        return (
          <Animated.View
            key={idx}
            style={[
              styles.rainDrop,
              {
                left: drop.left,
                transform: [{ translateY: fallAnim }]
              }
            ]}
          />
        );
      })}
    </View>
  );
}

export default function LiveWeatherCard({
  location,
  onWeatherLoaded
}: LiveWeatherCardProps) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [includeInAnalysis, setIncludeInAnalysis] = useState<boolean>(true);

  // Animated values
  const riskBarWidth = useRef(new Animated.Value(0)).current;
  const alertPulse = useRef(new Animated.Value(0.4)).current;
  const refreshSpin = useRef(new Animated.Value(0)).current;

  // Pulsing alert banner animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(alertPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true
        }),
        Animated.timing(alertPulse, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  // Fetch Weather telemetries
  const fetchWeather = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);

    // Spin refresh icon
    refreshSpin.setValue(0);
    Animated.timing(refreshSpin, {
      toValue: 1,
      duration: 800,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true
    }).start();

    try {
      const normalizedLocation = location ? location.trim() : 'Islamabad';
      const response = await fetch(`${Config.apiBaseUrl}/api/weather/${encodeURIComponent(normalizedLocation)}`);

      if (!response.ok) {
        throw new Error(`Server returned status code: ${response.status}`);
      }

      const resJson = await response.json();
      if (!resJson.success) {
        throw new Error(resJson.error || 'Failed to resolve live weather.');
      }

      const weatherData: WeatherData = {
        location: resJson.location,
        coordinates: resJson.coordinates,
        temperature: resJson.temperature,
        humidity: resJson.humidity,
        precipitation: resJson.precipitation,
        rain: resJson.rain,
        windSpeed: resJson.windSpeed,
        windDirection: resJson.windDirection,
        weatherCode: resJson.weatherCode,
        weatherDescription: resJson.weatherDescription,
        isRaining: resJson.isRaining,
        rainIntensity: resJson.rainIntensity,
        floodRisk: resJson.floodRisk,
        alertLevel: resJson.alertLevel,
        alerts: resJson.alerts || []
      };

      setData(weatherData);

      // Trigger callback with toggle inclusion state
      onWeatherLoaded({ ...weatherData, included: includeInAnalysis });

      // Animate risk bar width transition
      let riskProgress = 0.25; // low
      if (weatherData.floodRisk === 'medium') riskProgress = 0.50;
      else if (weatherData.floodRisk === 'high') riskProgress = 0.75;
      else if (weatherData.floodRisk === 'critical') riskProgress = 1.0;

      Animated.timing(riskBarWidth, {
        toValue: riskProgress,
        duration: 1200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false
      }).start();

      const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastUpdated(timeNow);
    } catch (e: any) {
      console.error('[LiveWeatherCard] Fetch error:', e);
      setError(e.message || 'Weather unavailable');
    } finally {
      setLoading(false);
    }
  };

  // Mount/Refresh Effects
  useEffect(() => {
    fetchWeather(true);

    // Auto refresh every 5 minutes
    const interval = setInterval(() => {
      fetchWeather(false);
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [location]);

  // Sync includeInAnalysis toggle changes
  const handleToggleInclude = (value: boolean) => {
    setIncludeInAnalysis(value);
    if (data) {
      onWeatherLoaded({ ...data, included: value });
    }
  };

  // Map refresh spin to interpolation degrees
  const spinInterpolation = refreshSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Helper colors for Risk
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'medium': return COLORS.warning;
      case 'high': return '#F97316'; // orange
      case 'critical': return COLORS.danger;
      default: return COLORS.success;
    }
  };

  // Skeleton loading view
  if (loading && !data) {
    return (
      <View style={[styles.card, styles.skeletonContainer]}>
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonTextLineLarge} />
          <View style={styles.skeletonTextLineSmall} />
        </View>
        <View style={styles.skeletonMainDisplay}>
          <View style={styles.skeletonCircle} />
          <View style={{ flex: 1, gap: 8 }}>
            <View style={styles.skeletonTextLineMedium} />
            <View style={styles.skeletonTextLineSmall} />
          </View>
        </View>
        <View style={styles.skeletonFooter} />
      </View>
    );
  }

  // Error boundary layout
  if (error && !data) {
    return (
      <View style={[styles.card, styles.errorContainer]}>
        <Ionicons name="cloud-offline" size={40} color={COLORS.danger} />
        <Text style={styles.errorText}>Weather Data Offline</Text>
        <Text style={styles.errorSub}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => fetchWeather(true)}>
          <Ionicons name="refresh" size={14} color="#FFF" style={{ marginRight: 4 }} />
          <Text style={styles.retryText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data) return null;

  const hasAlert = data.alertLevel && data.alertLevel !== 'none';
  const riskColor = getRiskColor(data.floodRisk);

  // Generate beautiful custom flood reason based on telemetry indices
  let floodReason = 'Environmental metrics are within safe baseline thresholds.';
  if (data.floodRisk === 'critical') {
    floodReason = `Extremely critical: rainfall rate peaks at ${data.precipitation}mm/hr with maximum saturation. Emergency warnings active.`;
  } else if (data.floodRisk === 'high') {
    floodReason = `Precipitation exceeds 10mm/hr threshold (${data.precipitation}mm/hr). Elevated probability of immediate street pooling.`;
  } else if (data.floodRisk === 'medium') {
    floodReason = `Active rain (${data.precipitation}mm/hr) detected alongside relative humidity exceeding 85%.`;
  }

  return (
    <View style={styles.card}>
      {/* Rain animation overlay if active raining */}
      {data.isRaining && <RainOverlay />}

      {/* 1. Card Header Row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.locName} numberOfLines={1}>
            {data.location}
          </Text>
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.timestamp}>Updated {lastUpdated || 'just now'}</Text>
          <TouchableOpacity
            style={styles.refreshBtn}
            onPress={() => fetchWeather(true)}
            activeOpacity={0.7}
          >
            <Animated.View style={{ transform: [{ rotate: spinInterpolation }] }}>
              <Ionicons name="refresh-outline" size={18} color={COLORS.primary} />
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Main Weather Display (2 columns) */}
      <View style={styles.mainGrid}>
        {/* Left Column: Temperature, Description & WMO Icon */}
        <View style={styles.leftCol}>
          <Ionicons
            name={getWeatherIconName(data.weatherCode) as any}
            size={56}
            color={data.isRaining ? COLORS.primary : COLORS.warning}
          />
          <View>
            <Text style={styles.tempVal}>{Math.round(data.temperature)}°C</Text>
            <Text style={styles.descText}>{data.weatherDescription}</Text>
          </View>
        </View>

        {/* Right Column: Key metrics */}
        <View style={styles.rightCol}>
          <View style={styles.metricRow}>
            <Ionicons name="water-outline" size={15} color="#60A5FA" />
            <Text style={styles.metricLabel}>Humidity:</Text>
            <Text style={styles.metricValue}>{data.humidity}%</Text>
          </View>

          <View style={styles.metricRow}>
            <Ionicons name="umbrella-outline" size={15} color="#818CF8" />
            <Text style={styles.metricLabel}>Precipitation:</Text>
            <Text style={styles.metricValue}>{data.precipitation}mm/hr</Text>
          </View>

          <View style={styles.metricRow}>
            <Ionicons name="leaf-outline" size={15} color="#34D399" />
            <Text style={styles.metricLabel}>Wind:</Text>
            <Text style={styles.metricValue}>{data.windSpeed} km/h</Text>
          </View>

          <View style={styles.metricRow}>
            <Ionicons name="compass-outline" size={15} color="#94A3B8" />
            <Text style={styles.metricLabel}>Direction:</Text>
            <Animated.View
              style={[
                styles.arrowBox,
                { transform: [{ rotate: `${data.windDirection}deg` }] }
              ]}
            >
              <Ionicons name="arrow-up-outline" size={15} color="#FFF" />
            </Animated.View>
            <Text style={styles.directionText}>{data.windDirection}°</Text>
          </View>
        </View>
      </View>

      {/* 3. Flood Risk Indicator */}
      <View style={styles.riskContainer}>
        <View style={styles.riskHeader}>
          <Text style={styles.riskTitle}>Flood Risk Assessment</Text>
          <Text style={[styles.riskLabel, { color: riskColor }]}>
            {data.floodRisk.toUpperCase()}
          </Text>
        </View>

        {/* Animated fill track */}
        <View style={styles.barTrack}>
          <Animated.View
            style={[
              styles.barFill,
              {
                backgroundColor: riskColor,
                width: riskBarWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%']
                })
              }
            ]}
          />
        </View>

        <Text style={styles.riskReason}>{floodReason}</Text>
      </View>

      {/* 4. Alert Banner */}
      {hasAlert && (
        <Animated.View
          style={[
            styles.alertBanner,
            {
              borderColor: riskColor,
              shadowColor: riskColor,
              opacity: alertPulse
            }
          ]}
        >
          <Ionicons name="warning" size={18} color={riskColor} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.alertTitle, { color: riskColor }]}>
              {data.alertLevel.toUpperCase()} LEVEL WEATHER ALERT
            </Text>
            {data.alerts && data.alerts.length > 0 ? (
              <Text style={styles.alertMsg}>{data.alerts[0].message}</Text>
            ) : (
              <Text style={styles.alertMsg}>
                Severe localized telemetry recorded. Maintain precaution near Nullah Lai basins.
              </Text>
            )}
          </View>
        </Animated.View>
      )}

      {/* 5. Include in Analysis Toggle */}
      <View style={styles.toggleRow}>
        <View style={styles.toggleLeft}>
          <Ionicons
            name={includeInAnalysis ? "analytics-outline" : "analytics-sharp"}
            size={18}
            color={includeInAnalysis ? COLORS.success : COLORS.textMuted}
          />
          <View>
            <Text style={styles.toggleTitle}>Include in Incident Analysis</Text>
            <Text style={styles.toggleSub}>
              {includeInAnalysis
                ? 'Weather data feeds will compile into active AI orchestrations'
                : 'Excluded from multi-agent context analysis'}
            </Text>
          </View>
        </View>
        <Switch
          value={includeInAnalysis}
          onValueChange={handleToggleInclude}
          trackColor={{ false: COLORS.border, true: COLORS.success }}
          thumbColor={Platform.OS === 'android' ? COLORS.card : undefined}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0C111F',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45, 55, 72, 0.4)',
    paddingBottom: 12,
    marginBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  locName: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  liveBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 0.5,
    borderColor: COLORS.success,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
  },
  liveText: {
    color: COLORS.success,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timestamp: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  refreshBtn: {
    padding: 4,
  },
  mainGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  tempVal: {
    fontSize: 34,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: -1,
  },
  descText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: -2,
  },
  rightCol: {
    backgroundColor: 'rgba(26, 34, 54, 0.4)',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 10,
    gap: 6,
    minWidth: 140,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    width: 76,
  },
  metricValue: {
    fontSize: 11,
    color: COLORS.textPrimary,
    fontWeight: '700',
  },
  arrowBox: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  directionText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  riskContainer: {
    backgroundColor: 'rgba(26, 34, 54, 0.3)',
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    padding: 12,
    marginBottom: 14,
    gap: 6,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskTitle: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  riskLabel: {
    fontSize: 11,
    fontWeight: '900',
  },
  barTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 2,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  riskReason: {
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  alertBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 10,
    gap: 10,
    marginBottom: 14,
  },
  alertTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  alertMsg: {
    color: '#E2E8F0',
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '600',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(45, 55, 72, 0.4)',
    paddingTop: 12,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  toggleSub: {
    color: COLORS.textSecondary,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '500',
    marginTop: 1,
  },
  rainDrop: {
    position: 'absolute',
    width: 1.2,
    height: 14,
    backgroundColor: '#60A5FA',
    opacity: 0.6,
    borderRadius: 1,
  },
  skeletonContainer: {
    height: 240,
    justifyContent: 'space-between',
  },
  skeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonMainDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  skeletonCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  skeletonTextLineLarge: {
    width: 120,
    height: 18,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  skeletonTextLineMedium: {
    width: 80,
    height: 14,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  skeletonTextLineSmall: {
    width: 50,
    height: 10,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  skeletonFooter: {
    height: 40,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 10,
  },
  errorText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  errorSub: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: COLORS.danger,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  retryText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
});
