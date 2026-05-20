import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TextInput, 
  Switch, 
  TouchableOpacity, 
  Modal, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { COLORS } from '../../constants/colors';
import { Card, Badge, Button, SectionHeader } from '../../components/ui';
import { useAppStore, Signal, AnalysisSession } from '../../lib/store';
import { MOCK_SCENARIOS, MockScenario } from '../../lib/mock';
import LiveWeatherCard, { WeatherData } from '../../components/weather/LiveWeatherCard';

// Local Server URL fallback (standard Android emulator loopback / web)
const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';

export default function InputScreen() {
  const router = useRouter();
  
  // Zustand Store
  const { activeScenario, currentLocation, currentSignals, startAnalysis } = useAppStore();

  // Component States
  const [location, setLocation] = useState('');
  const [socialSignals, setSocialSignals] = useState<string[]>(['']);
  
  const [includeWeather, setIncludeWeather] = useState(true);
  const [liveWeatherData, setLiveWeatherData] = useState<WeatherData | null>(null);
  const [rainfall, setRainfall] = useState<'none' | 'light' | 'moderate' | 'heavy' | 'extreme'>('none');
  
  const [includeTraffic, setIncludeTraffic] = useState(false);
  const [congestionLevel, setCongestionLevel] = useState<number>(5);

  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // Synchronize state if scenario is loaded
  useEffect(() => {
    if (activeScenario) {
      loadScenarioData(activeScenario);
    }
  }, [activeScenario]);

  useEffect(() => {
    if (currentLocation) {
      setLocation(currentLocation);
    }
  }, [currentLocation]);

  useEffect(() => {
    if (currentSignals && currentSignals.length > 0) {
      const socialTexts = currentSignals
        .filter(s => s.type === 'social')
        .map(s => s.text || '');
      setSocialSignals(socialTexts.length > 0 ? socialTexts : ['']);

      const weatherSignal = currentSignals.find(s => s.type === 'weather');
      if (weatherSignal && weatherSignal.data) {
        setIncludeWeather(true);
        setRainfall(weatherSignal.data.rainfall || 'none');
      } else {
        setIncludeWeather(false);
      }

      const trafficSignal = currentSignals.find(s => s.type === 'traffic');
      if (trafficSignal && trafficSignal.data) {
        setIncludeTraffic(true);
        setCongestionLevel(trafficSignal.data.congestionScore || 5);
      } else {
        setIncludeTraffic(false);
      }
    }
  }, [currentSignals]);

  const loadScenarioData = (scenario: any) => {
    setLocation(scenario.location);
    
    // Extract social reports
    const socialTexts = scenario.signals
      .filter((s: any) => s.type === 'social')
      .map((s: any) => s.text || '');
    setSocialSignals(socialTexts.length > 0 ? socialTexts : ['']);

    // Extract weather reports
    const weatherSignal = scenario.signals.find((s: any) => s.type === 'weather');
    if (weatherSignal && weatherSignal.data) {
      setIncludeWeather(true);
      setRainfall(weatherSignal.data.rainfall || 'none');
    } else {
      setIncludeWeather(false);
    }

    // Extract traffic reports
    const trafficSignal = scenario.signals.find((s: any) => s.type === 'traffic');
    if (trafficSignal && trafficSignal.data) {
      setIncludeTraffic(true);
      setCongestionLevel(trafficSignal.data.congestionScore || 5);
    } else {
      setIncludeTraffic(false);
    }

    setModalVisible(false);
  };

  const handleAddSocialSignal = () => {
    if (socialSignals.length < 5) {
      setSocialSignals([...socialSignals, '']);
    }
  };

  const handleRemoveSocialSignal = (index: number) => {
    const updated = [...socialSignals];
    updated.splice(index, 1);
    setSocialSignals(updated.length > 0 ? updated : ['']);
  };

  const handleSocialTextChange = (text: string, index: number) => {
    const updated = [...socialSignals];
    updated[index] = text;
    setSocialSignals(updated);
  };

  // Derive weather info based on rainfall selection
  const getSimulatedWeatherData = () => {
    switch (rainfall) {
      case 'none': return { temp: 32, humidity: 45, alert: false };
      case 'light': return { temp: 28, humidity: 65, alert: false };
      case 'moderate': return { temp: 26, humidity: 80, alert: false };
      case 'heavy': return { temp: 24, humidity: 90, alert: true, alertType: 'FLASH_FLOOD_WARNING' };
      case 'extreme': return { temp: 22, humidity: 95, alert: true, alertType: 'EMERGENCY_ALERT' };
    }
  };

  const weatherData = getSimulatedWeatherData();

  // Derive traffic info based on congestion
  const getSimulatedTrafficData = () => {
    const speed = Math.max(2, Math.round(50 - (congestionLevel * 4.8)));
    const vehicles = Math.round(congestionLevel * 90);
    return { speed, vehicles };
  };

  const trafficData = getSimulatedTrafficData();

  const handleRunAnalysis = async () => {
    // 1. Validation
    if (!location.trim()) {
      Alert.alert('Validation Error', 'Please enter a crisis location.');
      return;
    }
    const filledSocial = socialSignals.filter(s => s.trim());
    if (filledSocial.length === 0) {
      Alert.alert('Validation Error', 'Please enter at least one social media report.');
      return;
    }

    setLoading(true);

    // 2. Prepare payload signals list
    const signalsPayload: any[] = [];
    filledSocial.forEach((text, idx) => {
      signalsPayload.push({ 
        id: `sig-${Date.now()}-${idx}`, 
        type: 'social', 
        text, 
        timestamp: new Date().toISOString() 
      });
    });

    if (includeWeather) {
      if (liveWeatherData) {
        signalsPayload.push({
          id: `sig-weather-${Date.now()}`,
          type: 'weather',
          data: {
            location: liveWeatherData.location,
            temperature: liveWeatherData.temperature,
            humidity: liveWeatherData.humidity,
            rainfall: liveWeatherData.rainIntensity,
            precipitation: liveWeatherData.precipitation,
            alert: liveWeatherData.alertLevel !== 'none',
            alertType: liveWeatherData.alerts?.[0]?.type || 'NONE',
            floodRisk: liveWeatherData.floodRisk,
            alertLevel: liveWeatherData.alertLevel
          },
          timestamp: new Date().toISOString()
        });
      } else {
        signalsPayload.push({
          id: `sig-weather-${Date.now()}`,
          type: 'weather',
          data: {
            location,
            temperature: weatherData.temp,
            humidity: weatherData.humidity,
            rainfall,
            alert: weatherData.alert,
            alertType: weatherData.alert ? (rainfall === 'heavy' ? 'FLASH_FLOOD_WARNING' : 'EMERGENCY_ALERT') : 'NONE'
          },
          timestamp: new Date().toISOString()
        });
      }
    }

    if (includeTraffic) {
      signalsPayload.push({
        id: `sig-traffic-${Date.now()}`,
        type: 'traffic',
        data: {
          location,
          congestionScore: congestionLevel,
          avgSpeed: trafficData.speed,
          affectedVehicles: trafficData.vehicles
        },
        timestamp: new Date().toISOString()
      });
    }

    try {
      // 3. Update Zustand Store inputs atomically
      useAppStore.setState({
        currentLocation: location,
        currentSignals: signalsPayload,
        error: null
      });

      // 4. Trigger Orchestration pipeline async and navigate immediately to loading steps
      startAnalysis();
      router.push('/analysis');
    } catch (err) {
      console.error("Zustand store startAnalysis trigger failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          
          {/* 1. Header Row */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Signal Input</Text>
            <TouchableOpacity 
              style={styles.presetButton} 
              onPress={() => setModalVisible(true)}
              activeOpacity={0.7}
            >
              <Ionicons name="folder-open" size={14} color={COLORS.primary} />
              <Text style={styles.presetText}>Load Preset</Text>
            </TouchableOpacity>
          </View>

          {/* 2. Location Input */}
          <SectionHeader title="Target Location" />
          <Card variant="neutral" style={styles.cardInput}>
            <View style={styles.inputContainer}>
              <Ionicons name="location" size={18} color={COLORS.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter location (e.g. G-10, Islamabad)"
                placeholderTextColor={COLORS.textMuted}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </Card>

          {/* 3. Social Media Signals */}
          <SectionHeader 
            title="Social Media Reports" 
            rightAction={
              socialSignals.length < 5 ? (
                <TouchableOpacity onPress={handleAddSocialSignal} style={styles.addBtn}>
                  <Ionicons name="add-circle-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.addBtnText}>Add Report</Text>
                </TouchableOpacity>
              ) : undefined
            }
          />
          
          {socialSignals.map((signal, index) => (
            <Card key={index} variant="neutral" style={styles.socialCard}>
              <View style={styles.socialHeader}>
                <Badge label={`Report #${index + 1}`} variant="primary" />
                {socialSignals.length > 1 && (
                  <TouchableOpacity onPress={() => handleRemoveSocialSignal(index)}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                multiline
                numberOfLines={3}
                style={styles.textArea}
                placeholder="Paste social media posts, complaints, or reports here..."
                placeholderTextColor={COLORS.textMuted}
                value={signal}
                onChangeText={(text) => handleSocialTextChange(text, index)}
              />
              <Text style={styles.charCount}>{signal.length} characters</Text>
            </Card>
          ))}

          {/* 4. Weather Ingestion Section */}
          <SectionHeader title="Live Meteorological Telemetry" />
          <View style={{ marginBottom: 14 }}>
            <LiveWeatherCard 
              location={location || 'Islamabad'} 
              onWeatherLoaded={(wData) => {
                setLiveWeatherData(wData);
                setIncludeWeather(!!wData.included);
              }}
            />
          </View>

          {/* 5. Traffic Ingestion Section */}
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Include Traffic Ingestion</Text>
            <Switch
              value={includeTraffic}
              onValueChange={setIncludeTraffic}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={Platform.OS === 'android' ? COLORS.card : undefined}
            />
          </View>

          {includeTraffic && (
            <Card variant="neutral" style={styles.trafficCard}>
              <Text style={styles.sectionSub}>Congestion Level (1 - 10)</Text>
              
              {/* Stepper Congestion Meter */}
              <View style={styles.stepperRow}>
                <TouchableOpacity 
                  onPress={() => setCongestionLevel(Math.max(1, congestionLevel - 1))}
                  style={styles.stepBtn}
                >
                  <Ionicons name="remove" size={20} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.stepperVal}>{congestionLevel}</Text>
                <TouchableOpacity 
                  onPress={() => setCongestionLevel(Math.min(10, congestionLevel + 1))}
                  style={styles.stepBtn}
                >
                  <Ionicons name="add" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.weatherMetrics}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Projected Speed</Text>
                  <Text style={styles.metricVal}>{trafficData.speed} km/h</Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Affected Vehicles</Text>
                  <Text style={styles.metricVal}>{trafficData.vehicles} cars</Text>
                </View>
              </View>
            </Card>
          )}

          {/* 7. Action Button */}
          <Button 
            title="Run Analysis" 
            onPress={handleRunAnalysis} 
            loading={loading}
            style={styles.submitButton}
          />

        </ScrollView>

        {/* 6. Load Preset Scenario Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Load Preset Scenario</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close-circle-outline" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.modalScroll}>
                {MOCK_SCENARIOS.map((scenario) => (
                  <TouchableOpacity
                    key={scenario.id}
                    onPress={() => loadScenarioData(scenario)}
                    activeOpacity={0.8}
                    style={styles.modalScenarioBtn}
                  >
                    <Card variant="primary" style={styles.modalCard}>
                      <View style={styles.modalCardHeader}>
                        <Ionicons name={scenario.icon as any} size={24} color={COLORS.primary} />
                        <Text style={styles.modalCardTitle}>{scenario.title}</Text>
                      </View>
                      <Text style={styles.modalCardLoc}>
                        <Ionicons name="location" size={12} /> {scenario.location}
                      </Text>
                    </Card>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>

      </KeyboardAvoidingView>
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
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}15`,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 6,
  },
  presetText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '700',
  },
  cardInput: {
    padding: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: 40,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  socialCard: {
    marginBottom: 12,
    gap: 8,
  },
  socialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textArea: {
    minHeight: 60,
    color: COLORS.textPrimary,
    fontSize: 14,
    textAlignVertical: 'top',
    backgroundColor: `${COLORS.background}50`,
    borderRadius: 6,
    padding: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  charCount: {
    fontSize: 11,
    color: COLORS.textMuted,
    alignSelf: 'flex-end',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 14,
    paddingHorizontal: 4,
  },
  toggleLabel: {
    fontSize: 16,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  weatherCard: {
    gap: 12,
    marginBottom: 8,
  },
  sectionSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  rainfallRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  rainTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: `${COLORS.background}30`,
  },
  rainTabActive: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}15`,
  },
  rainTabText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  rainTabTextActive: {
    color: COLORS.primary,
  },
  weatherMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 12,
    marginTop: 4,
  },
  metricItem: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  trafficCard: {
    gap: 12,
    marginBottom: 8,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 4,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperVal: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    minWidth: 30,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 24,
    marginBottom: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 16,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  modalScroll: {
    gap: 12,
    paddingBottom: 20,
  },
  modalScenarioBtn: {
    width: '100%',
  },
  modalCard: {
    padding: 14,
    gap: 6,
  },
  modalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalCardLoc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: 32,
  },
});
