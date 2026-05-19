import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import {
  ApiErrorCard,
  Badge,
  Button,
  Card,
  NetworkErrorCard,
  SectionHeader,
  StatusDot,
} from '../../components/ui';
import { AnalysisPipeline } from '../../components/agents';
import { Config } from '../../lib/config';
import { useAppStore } from '../../lib/store';

type StepSourceType = 'google' | 'gemini' | 'live_api';
type StepStatus = 'pending' | 'running' | 'completed' | 'error';

type PipelineStep = {
  id: number;
  backendId: number;
  title: string;
  subtitle: string;
  source: StepSourceType;
  status: StepStatus;
  statusText: string;
  durationMs?: number;
  startedAt?: string;
  completedAt?: string;
  input?: unknown;
  output?: unknown;
  liveDataFetched?: unknown;
  summary?: string;
};

type PipelineResult = {
  sessionId?: string;
  timestamp?: string;
  location?: string;
  crisisType?: string;
  severity?: string;
  explanation?: string;
  normalizedSignals?: unknown[];
  detectedCrisis?: {
    type?: string;
    location?: string;
    confidence?: number;
    reasoning?: string;
  };
  liveWeather?: {
    temperature?: number;
    humidity?: number;
    rain?: number;
    windSpeed?: number;
    weatherDescription?: string;
    floodRisk?: string;
    alertLevel?: string;
  };
  liveTraffic?: {
    overallCongestion?: number;
    affectedRoads?: Array<{ name?: string; congestion?: string }>;
    affectedVehicles?: number;
  };
  emergencyServices?: {
    hospitals?: Array<{ name?: string; distance?: string; distanceText?: string }>;
    police?: Array<{ name?: string; distance?: string; distanceText?: string }>;
    fireStations?: Array<{ name?: string; distance?: string; distanceText?: string }>;
  };
  actions?: Array<{ id?: string; title?: string; priority?: number; category?: string; description?: string }>;
  simulation?: {
    routes?: Array<{ name?: string; duration?: string; durationInTraffic?: string; status?: string }>;
    alerts?: unknown[];
    tickets?: unknown[];
    logs?: Array<{ time?: string; message?: string }>;
  };
  outcome?: {
    before?: { congestionScore?: number; responseTime?: string; affectedVehicles?: number };
    after?: { congestionScore?: number; responseTime?: string; affectedVehicles?: number };
  };
};

const UI_STEPS: Array<Omit<PipelineStep, 'status' | 'statusText' | 'durationMs' | 'startedAt' | 'completedAt' | 'input' | 'output' | 'liveDataFetched' | 'summary'>> = [
  { id: 1, backendId: 1, title: 'Signal Collection', subtitle: 'Input signals summary, signal count, and types', source: 'google' },
  { id: 2, backendId: 2, title: 'Live Weather Fetch', subtitle: 'Fetching from Open-Meteo with temperature, rain, and flood risk', source: 'live_api' },
  { id: 3, backendId: 3, title: 'Live Traffic Fetch', subtitle: 'Querying Google Maps for congestion and affected roads', source: 'live_api' },
  { id: 4, backendId: 4, title: 'Gemini Crisis Detection', subtitle: 'Detecting crisis type and confidence from live signals', source: 'gemini' },
  { id: 5, backendId: 5, title: 'Gemini Deep Analysis', subtitle: 'Streaming narrative text from Gemini in real time', source: 'gemini' },
  { id: 6, backendId: 6, title: 'Gemini Situation Synthesis', subtitle: 'Severity, impact, and explanation synthesis', source: 'gemini' },
  { id: 7, backendId: 8, title: 'Google Maps Route Planning', subtitle: 'Finding alternate routes and duration estimates', source: 'live_api' },
  { id: 8, backendId: 9, title: 'Emergency Services Locator', subtitle: 'Nearest hospitals, police, and fire stations', source: 'live_api' },
  { id: 9, backendId: 7, title: 'Action Plan Generation', subtitle: 'AI-generated actions sorted by priority', source: 'gemini' },
  { id: 10, backendId: 10, title: 'Simulation Execution', subtitle: 'Simulating with real routes and live service locations', source: 'live_api' },
];

const BACKEND_TO_UI_STEP: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 9,
  8: 7,
  9: 8,
  10: 10,
};

const SOURCE_BADGE: Record<StepSourceType, { label: string; color: string }> = {
  google: { label: 'GOOGLE', color: '#60A5FA' },
  gemini: { label: 'GEMINI', color: COLORS.success },
  live_api: { label: 'LIVE API', color: '#A855F7' },
};

function createInitialSteps(): PipelineStep[] {
  return UI_STEPS.map((step) => ({ ...step, status: 'pending', statusText: 'Waiting in queue' }));
}

function formatDuration(durationMs?: number) {
  if (!durationMs && durationMs !== 0) return '';
  if (durationMs < 1000) return `${durationMs}ms`;
  return `${(durationMs / 1000).toFixed(durationMs >= 10000 ? 0 : 1)}s`;
}

function safeJson(value: unknown) {
  if (value == null) return 'No data available.';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function summarizeSignalTypes(signals: Array<{ type?: string }>) {
  const counts = signals.reduce<Record<string, number>>((acc, signal) => {
    const key = signal.type || 'unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([type, count]) => `${type} x${count}`)
    .join(' · ');
}

export default function AnalysisScreen() {
  const router = useRouter();
  const {
    currentSession,
    currentSignals,
    currentLocation,
    isAnalyzing,
    analysisStep,
    demoMode,
    error,
    startAnalysis,
    setDemoMode,
    clearError,
    setAnalysisComplete,
  } = useAppStore();

  const [collapsedNarrative, setCollapsedNarrative] = useState(true);
  const [expandedStepId, setExpandedStepId] = useState<number | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(() => createInitialSteps());
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [geminiStreamText, setGeminiStreamText] = useState('');
  const [resultsVisible, setResultsVisible] = useState(false);
  const [resultsOpacity] = useState(() => new Animated.Value(0));
  const [resultsTranslateY] = useState(() => new Animated.Value(18));

  const scrollRef = useRef<ScrollView>(null);
  const runningRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const entranceAnims = useRef(UI_STEPS.map(() => new Animated.Value(0))).current;

  const apiBase = useMemo(() => {
    const trimmed = (Config.apiBaseUrl || '').replace(/\/$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }, []);

  const activeSession = (pipelineResult || currentSession) as any | null;
  const progressCount = useMemo(() => pipelineSteps.filter((step) => step.status === 'completed').length, [pipelineSteps]);
  const progressLabel = `${progressCount}/10 steps complete`;

  const getSignalSummary = useMemo(() => {
    const signalList = currentSignals.map((signal) => ({ type: signal.type, text: signal.text }));
    return {
      count: signalList.length,
      types: summarizeSignalTypes(signalList),
      preview: signalList.slice(0, 3).map((signal) => signal.text || signal.type).filter(Boolean).join(' · '),
    };
  }, [currentSignals]);

  const updateStep = useCallback((uiStepId: number, patch: Partial<PipelineStep>) => {
    setPipelineSteps((prev) => prev.map((step) => (step.id === uiStepId ? { ...step, ...patch } : step)));
  }, []);

  const resetLivePipeline = useCallback(() => {
    setPipelineSteps(createInitialSteps());
    setPipelineResult(null);
    setGeminiStreamText('');
    setResultsVisible(false);
    setExpandedStepId(null);
    resultsOpacity.setValue(0);
    resultsTranslateY.setValue(18);
    entranceAnims.forEach((anim) => anim.setValue(0));
  }, [entranceAnims, resultsOpacity, resultsTranslateY]);

  const animateStepEntrance = useCallback(() => {
    const animations = entranceAnims.map((value) =>
      Animated.spring(value, {
        toValue: 1,
        tension: 55,
        friction: 9,
        useNativeDriver: true,
      })
    );
    Animated.stagger(80, animations).start();
  }, [entranceAnims]);

  const animateResultsIn = useCallback(() => {
    Animated.parallel([
      Animated.spring(resultsOpacity, { toValue: 1, tension: 55, friction: 10, useNativeDriver: true }),
      Animated.spring(resultsTranslateY, { toValue: 0, tension: 55, friction: 10, useNativeDriver: true }),
    ]).start();
  }, [resultsOpacity, resultsTranslateY]);

  const handleRetry = () => {
    clearError();
    resetLivePipeline();
    startAnalysis();
  };

  const handleTryDemo = () => {
    setDemoMode(true);
    clearError();
    resetLivePipeline();
    startAnalysis();
  };

  const handleViewActionPlan = () => router.push('/actions');
  const handleViewLiveMap = () => router.push('/simulation');

  const getStepVisual = (step: PipelineStep) => {
    const source = SOURCE_BADGE[step.source];
    const color = source.color;
    const progressWidth = step.status === 'completed' ? '100%' : step.status === 'running' ? '72%' : '0%';
    return { source, color, progressWidth };
  };

  const markBackendEvent = useCallback(
    (event: { type?: string; data?: any }) => {
      if (!event?.type) return;

      if (event.type === 'step_start') {
        const backendStepId = Number(event.data?.stepId);
        const uiStepId = BACKEND_TO_UI_STEP[backendStepId];
        if (!uiStepId) return;

        updateStep(uiStepId, {
          status: 'running',
          startedAt: event.data?.startTime,
          statusText: event.data?.stepName || 'Running',
        });

        if (uiStepId === 5) {
          setExpandedStepId(5);
        }
      }

      if (event.type === 'step_complete') {
        const backendStepId = Number(event.data?.stepId);
        const uiStepId = BACKEND_TO_UI_STEP[backendStepId];
        if (!uiStepId) return;

        updateStep(uiStepId, {
          status: 'completed',
          statusText: event.data?.stepName || 'Completed',
          startedAt: event.data?.startTime,
          completedAt: event.data?.endTime,
          durationMs: event.data?.duration,
          input: event.data?.input,
          output: event.data?.output,
          liveDataFetched: event.data?.liveDataFetched,
          summary:
            uiStepId === 1
              ? `${currentSignals.length} signals · ${getSignalSummary.types}`
              : uiStepId === 2
                ? `${event.data?.output?.temperature ?? 'n/a'}°C · rain ${event.data?.output?.rain ?? 0}mm · flood risk ${event.data?.output?.floodRisk || 'unknown'}`
                : uiStepId === 3
                  ? `Congestion ${event.data?.output?.traffic?.overallCongestion ?? 'n/a'}/10 · ${event.data?.output?.traffic?.affectedRoads?.length || 0} affected roads`
                  : uiStepId === 4
                    ? `${event.data?.output?.crisisType || 'CRISIS'} · ${Math.round((event.data?.output?.confidence || 0) * 100)}% confidence`
                    : uiStepId === 5
                      ? event.data?.output?.situationNarrative || 'Gemini narrative ready'
                      : uiStepId === 6
                        ? `${event.data?.output?.severity || 'MEDIUM'} severity · ${event.data?.output?.explanation || ''}`
                        : uiStepId === 7
                          ? `${event.data?.output?.optimizedRoutes?.length || 0} routes found`
                          : uiStepId === 8
                            ? `${event.data?.output?.hospitals?.length || 0} hospitals · ${event.data?.output?.police?.length || 0} police · ${event.data?.output?.fireStations?.length || 0} fire stations`
                            : uiStepId === 9
                              ? `${event.data?.output?.actions?.length || 0} actions generated`
                              : uiStepId === 10
                                ? 'Simulation completed with live route and service data'
                                : '',
        });

        if (uiStepId === 5) {
          const geminiText = [
            event.data?.output?.situationNarrative,
            event.data?.output?.weatherAnalysis,
            event.data?.output?.trafficImpactAnalysis,
            event.data?.output?.escalationForecast
              ? `30 min: ${event.data.output.escalationForecast['30min']}\n60 min: ${event.data.output.escalationForecast['60min']}\n120 min: ${event.data.output.escalationForecast['120min']}`
              : '',
            event.data?.output?.criticalInsights?.length ? `Insights: ${event.data.output.criticalInsights.join(' · ')}` : '',
            event.data?.output?.geminiReasoning,
          ]
            .filter(Boolean)
            .join('\n\n');

          setGeminiStreamText('');
          if (geminiText) {
            let index = 0;
            const chunkSize = Math.max(1, Math.ceil(geminiText.length / 120));
            const timer = setInterval(() => {
              index = Math.min(geminiText.length, index + chunkSize);
              setGeminiStreamText(geminiText.slice(0, index));
              if (index >= geminiText.length) {
                clearInterval(timer);
              }
            }, 18);
          }
        }
      }

      if (event.type === 'pipeline_done') {
        const result = event.data as PipelineResult;
        setPipelineResult(result);
        setAnalysisComplete(result as any);
        setResultsVisible(true);
        setTimeout(() => animateResultsIn(), 30);
        useAppStore.setState({ isAnalyzing: false, analysisStep: 0, currentSignals: [] });
      }
    },
    [animateResultsIn, currentSignals.length, getSignalSummary.types, setAnalysisComplete, updateStep]
  );

  const runLiveStream = useCallback(async () => {
    const signals = currentSignals.map(({ type, text, data }) => ({ type, text, data }));
    const location = currentLocation || (currentSession as any)?.location || 'G-10, Islamabad';

    if (!signals.length || !location.trim()) {
      useAppStore.setState({
        isAnalyzing: false,
        analysisStep: 0,
        error: 'Please ingest at least one signal before running analysis.',
      });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    resetLivePipeline();
    animateStepEntrance();

    try {
      const response = await fetch(`${apiBase}/orchestrate/live/stream`, {
        method: 'POST',
        headers: {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ signals, location }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Stream request failed with status ${response.status}`);
      }

      if (!response.body || typeof response.body.getReader !== 'function') {
        throw new Error('ReadableStream is unavailable in this runtime.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const payload = trimmed.slice(5).trim();
          if (!payload) continue;

          try {
            const parsed = JSON.parse(payload);
            markBackendEvent(parsed);

            if (parsed.type === 'pipeline_done') {
              await reader.cancel();
              return;
            }
          } catch {
            // Ignore malformed SSE payloads and keep reading the stream.
          }
        }
      }
    } catch (streamError: any) {
      if (controller.signal.aborted) return;
      const isNetworkError = !streamError?.response;
      useAppStore.setState({
        error: isNetworkError ? 'NO_INTERNET' : 'TIMEOUT_ERROR',
        isAnalyzing: false,
        analysisStep: 0,
      });
    }
  }, [apiBase, animateStepEntrance, currentLocation, currentSession, currentSignals, markBackendEvent, resetLivePipeline]);

  useEffect(() => {
    if (!isAnalyzing) {
      runningRef.current = false;
      abortRef.current?.abort();
      return;
    }

    if (demoMode) return;
    if (runningRef.current) return;

    runningRef.current = true;
    runLiveStream();

    return () => {
      abortRef.current?.abort();
    };
  }, [demoMode, isAnalyzing, runLiveStream]);

  useEffect(() => {
    if (resultsVisible) {
      animateResultsIn();
    }
  }, [animateResultsIn, resultsVisible]);

  useEffect(() => {
    if (scrollRef.current && isAnalyzing && !demoMode) {
      const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
      return () => clearTimeout(timer);
    }
  }, [demoMode, isAnalyzing, pipelineSteps]);

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.errorContainer}>
          {error === 'NO_INTERNET' ? (
            <NetworkErrorCard onRetry={handleRetry} />
          ) : (
            <ApiErrorCard
              message="The live SSE pipeline could not be reached. Try again or switch to offline demo mode."
              onRetry={handleRetry}
              onTryDemo={handleTryDemo}
            />
          )}
        </View>
      </SafeAreaView>
    );
  }

  if (isAnalyzing && demoMode) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AnalysisPipeline activeStep={analysisStep} />
      </SafeAreaView>
    );
  }

  if (isAnalyzing && !demoMode) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.headerCard}>
            <View style={styles.headerTopRow}>
              <View>
                <Text style={styles.headerTitle}>Live Crisis Pipeline</Text>
                <Text style={styles.headerSubtitle}>
                  SSE stream from /api/orchestrate/live/stream with live weather, traffic, Gemini, and Google updates.
                </Text>
              </View>
              <StatusDot status="warning" size={12} />
            </View>

            <View style={styles.progressHeaderRow}>
              <Text style={styles.progressLabel}>{progressLabel}</Text>
              <Badge label={progressLabel} variant="info" />
            </View>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(6, progressCount * 10)}%` }]} />
            </View>
          </View>

          <View style={styles.pipelineList}>
            {pipelineSteps.map((step, index) => {
              const visual = getStepVisual(step);
              const expanded = expandedStepId === step.id;
              const animatedStyle = {
                opacity: entranceAnims[index],
                transform: [
                  {
                    translateY: entranceAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                  {
                    scale: entranceAnims[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.97, 1],
                    }),
                  },
                ],
              } as const;

              const liveSummary = step.id === 1 ? `${getSignalSummary.count} signals · ${getSignalSummary.types}` : step.summary;

              return (
                <Animated.View key={step.id} style={animatedStyle}>
                  <TouchableOpacity activeOpacity={0.9} onPress={() => setExpandedStepId(expanded ? null : step.id)}>
                    <Card
                      variant="neutral"
                      style={[
                        styles.stepCard,
                        step.status === 'running' && styles.runningStepCard,
                        step.status === 'completed' && styles.completedStepCard,
                      ]}
                    >
                      <View style={styles.stepRow}>
                        <View style={[styles.stepNumberCircle, { backgroundColor: `${visual.color}20`, borderColor: visual.color }]}>
                          <Text style={[styles.stepNumberText, { color: visual.color }]}>{step.id}</Text>
                        </View>

                        <View style={styles.stepCenter}>
                          <View style={styles.stepTitleRow}>
                            <Text style={styles.stepTitle}>{step.title}</Text>
                            <Badge
                              label={visual.source.label}
                              variant={step.source === 'gemini' ? 'success' : step.source === 'google' ? 'info' : 'warning'}
                            />
                          </View>
                          <Text style={styles.stepStatusText}>{step.statusText}</Text>
                          {liveSummary ? <Text style={styles.stepSummary}>{liveSummary}</Text> : null}
                        </View>

                        <View style={styles.stepRight}>
                          {step.status === 'running' ? <ActivityIndicator size="small" color={visual.color} /> : null}
                          {step.status === 'completed' ? (
                            <Badge label={formatDuration(step.durationMs) || 'DONE'} variant={step.source === 'gemini' ? 'success' : step.source === 'google' ? 'info' : 'warning'} />
                          ) : null}
                          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.textSecondary} style={{ marginTop: 8 }} />
                        </View>
                      </View>

                      {step.status === 'running' ? (
                        <View style={styles.stepProgressTrack}>
                          <View style={[styles.stepProgressFill, { width: visual.progressWidth, backgroundColor: visual.color }]} />
                        </View>
                      ) : null}

                      {expanded ? (
                        <View style={styles.expandedBlock}>
                          <View style={styles.detailGroup}>
                            <Text style={styles.detailLabel}>Input</Text>
                            <Text style={styles.detailCode}>{safeJson(step.input)}</Text>
                          </View>

                          <View style={styles.detailGroup}>
                            <Text style={styles.detailLabel}>Output</Text>
                            {step.id === 5 && geminiStreamText ? (
                              <Text style={styles.geminiStreamText}>{geminiStreamText}</Text>
                            ) : (
                              <Text style={styles.detailCode}>{safeJson(step.output)}</Text>
                            )}
                          </View>

                          {step.liveDataFetched ? (
                            <View style={styles.detailGroup}>
                              <Text style={styles.detailLabel}>Live Data Source</Text>
                              <Text style={styles.detailCode}>{safeJson(step.liveDataFetched)}</Text>
                            </View>
                          ) : null}
                        </View>
                      ) : null}
                    </Card>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!activeSession) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.emptyContainer}>
          <Ionicons name="analytics-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>Crisis Analyst Hub</Text>
          <Text style={styles.emptySubtitle}>
            No active crisis telemetry detected. Enter signals or load a preset scenario to start the live pipeline.
          </Text>
          <Button title="Go to Signal Input" onPress={() => router.push('/input')} style={styles.emptyBtn} />
        </View>
      </SafeAreaView>
    );
  }

  const session = activeSession as PipelineResult;
  const severity = (session.severity || 'HIGH').toUpperCase();
  const crisisType = session.detectedCrisis?.type || session.crisisType || 'METROPOLITAN_ALERT';
  const confidence = Math.round((session.detectedCrisis?.confidence || 0.94) * 100);
  const weather = session.liveWeather || {};
  const traffic = session.liveTraffic || {};
  const weatherLabel = `${weather.temperature ?? 'n/a'}°C · ${weather.rain ?? 0}mm rain · flood risk ${weather.floodRisk || 'unknown'}`;
  const trafficLabel = `${traffic.overallCongestion ?? 'n/a'}/10 congestion · ${traffic.affectedRoads?.length || 0} affected roads`;
  const liveRoutes = session.simulation?.routes || [];
  const emergencyServices = session.emergencyServices || {};
  const serviceCount =
    (emergencyServices.hospitals?.length || 0) + (emergencyServices.police?.length || 0) + (emergencyServices.fireStations?.length || 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.resultsWrap, { opacity: resultsOpacity, transform: [{ translateY: resultsTranslateY }] }]}>
          <View style={styles.resultsHeader}>
            <View style={styles.headerTopRow}>
              <View>
                <Text style={styles.headerTitle}>Live Analysis Complete</Text>
                <Text style={styles.headerSubtitle}>{session.location || currentLocation || 'Live session complete'}</Text>
              </View>
              <Badge label={severity} variant={severity === 'CRITICAL' || severity === 'HIGH' ? 'danger' : 'warning'} />
            </View>

            <View style={styles.resultsMetaRow}>
              <View style={[styles.crisisPill, { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}18` }]}>
                <Text style={[styles.crisisPillText, { color: COLORS.primary }]}>{crisisType}</Text>
              </View>
              <Badge label={`${confidence}% confidence`} variant="success" />
            </View>
          </View>

          <Card variant="neutral" style={styles.resultsCard}>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setCollapsedNarrative(!collapsedNarrative)}>
              <View style={styles.cardHeadingRow}>
                <Text style={styles.cardHeading}>Gemini Narrative</Text>
                <Ionicons name={collapsedNarrative ? 'chevron-down' : 'chevron-up'} size={18} color={COLORS.textSecondary} />
              </View>
            </TouchableOpacity>
            {!collapsedNarrative ? (
              <Text style={styles.narrativeText}>{session.explanation || 'Gemini analysis is available here.'}</Text>
            ) : (
              <Text style={styles.previewText}>{(session.explanation || '').slice(0, 220) || 'Tap to expand the full Gemini narrative.'}</Text>
            )}
          </Card>

          <SectionHeader title="Live Conditions" />
          <View style={styles.grid}>
            <Card variant="neutral" style={styles.miniCard}>
              <View style={styles.miniCardHeader}>
                <Ionicons name="cloud-outline" size={18} color={COLORS.warning} />
                <Text style={styles.miniCardTitle}>Weather</Text>
              </View>
              <Text style={styles.miniCardValue}>{weatherLabel}</Text>
            </Card>

            <Card variant="neutral" style={styles.miniCard}>
              <View style={styles.miniCardHeader}>
                <Ionicons name="car-outline" size={18} color={COLORS.danger} />
                <Text style={styles.miniCardTitle}>Traffic</Text>
              </View>
              <Text style={styles.miniCardValue}>{trafficLabel}</Text>
            </Card>
          </View>

          <Card variant="neutral" style={styles.resultsCard}>
            <View style={styles.cardHeadingRow}>
              <Text style={styles.cardHeading}>Detected Crisis</Text>
              <Badge label={confidence >= 90 ? 'High confidence' : 'Moderate confidence'} variant={confidence >= 90 ? 'success' : 'warning'} />
            </View>
            <Text style={styles.resultLine}>Type: {crisisType}</Text>
            <Text style={styles.resultLine}>Reasoning: {session.detectedCrisis?.reasoning || session.explanation || 'Live risk synthesis complete.'}</Text>
          </Card>

          <SectionHeader title="Impact Summary" />
          <Card variant="neutral" style={styles.resultsCard}>
            <Text style={styles.resultLine}>Severity: {severity}</Text>
            <Text style={styles.resultLine}>Traffic impact: {trafficLabel}</Text>
            <Text style={styles.resultLine}>Live routes found: {liveRoutes.length}</Text>
            <Text style={styles.resultLine}>Emergency locations found: {serviceCount}</Text>
          </Card>

          <View style={styles.actionRow}>
            <Button title="View Live Map →" onPress={handleViewLiveMap} style={styles.actionBtn} />
            <Button title="View Action Plan →" onPress={handleViewActionPlan} variant="ghost" style={styles.actionBtn} />
          </View>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: COLORS.background,
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
  headerCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  progressHeaderRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  progressLabel: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  progressTrack: {
    marginTop: 10,
    height: 6,
    borderRadius: 999,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  pipelineList: {
    gap: 12,
  },
  stepCard: {
    padding: 14,
  },
  runningStepCard: {
    borderColor: COLORS.primary,
    backgroundColor: `${COLORS.primary}10`,
  },
  completedStepCard: {
    borderColor: `${COLORS.success}50`,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stepNumberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '900',
  },
  stepCenter: {
    flex: 1,
    gap: 4,
  },
  stepTitleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  stepStatusText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
  },
  stepSummary: {
    fontSize: 12,
    color: COLORS.textPrimary,
    lineHeight: 17,
  },
  stepRight: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    minWidth: 52,
  },
  stepProgressTrack: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 12,
  },
  stepProgressFill: {
    height: '100%',
    borderRadius: 999,
  },
  expandedBlock: {
    marginTop: 12,
    gap: 10,
  },
  detailGroup: {
    gap: 6,
  },
  detailLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  detailCode: {
    color: COLORS.textPrimary,
    fontSize: 12,
    lineHeight: 18,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 12,
  },
  geminiStreamText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    lineHeight: 19,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.success,
    padding: 12,
  },
  resultsWrap: {
    gap: 14,
  },
  resultsHeader: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  resultsMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  crisisPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  crisisPillText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  resultsCard: {
    gap: 12,
  },
  cardHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  narrativeText: {
    marginTop: 10,
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 20,
  },
  previewText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  miniCard: {
    flex: 1,
    gap: 8,
  },
  miniCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniCardTitle: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '800',
  },
  miniCardValue: {
    color: COLORS.textPrimary,
    fontSize: 12,
    lineHeight: 18,
  },
  resultLine: {
    color: COLORS.textPrimary,
    fontSize: 13,
    lineHeight: 19,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
  },
});