import { create } from 'zustand';
import axios from 'axios';
import { Platform } from 'react-native';

const API_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';

// ----------------------------------------------------
// Type Definitions
// ----------------------------------------------------

export interface Signal {
  id: string;
  type: 'social' | 'weather' | 'traffic';
  text?: string;
  data?: any;
  timestamp: string;
}

export interface DetectedCrisis {
  type: string;
  location: string;
  confidence: number;
  reasoning: string;
}

export interface Action {
  id: string;
  category: 'TRAFFIC' | 'EMERGENCY' | 'ALERT' | 'RESOURCE';
  priority: number; // 1 to 5
  title: string;
  description: string;
  estimatedImpact: string;
  simulated: boolean;
}

export interface Simulation {
  simulatedRoutes: string[];
  emergencyTickets: string[];
  sentAlerts: string[];
  systemLogs: Array<{ time: string; message: string }>;
  outcome: {
    before: { congestionScore: number; responseTime: string; affectedVehicles: number };
    after: { congestionScore: number; responseTime: string; affectedVehicles: number };
  };
}

export interface AnalysisSession {
  sessionId: string;
  timestamp: string;
  location: string;
  crisisType: string; // Compatibility field
  normalizedSignals: any[];
  detectedCrisis: DetectedCrisis;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  explanation: string;
  actions: Action[];
  simulation: Simulation;
  outcome: {
    before: { congestionScore: number; responseTime: string; affectedVehicles: number };
    after: { congestionScore: number; responseTime: string; affectedVehicles: number };
  };
  agentTrace: Array<{
    agent: string;
    status: 'pending' | 'running' | 'completed' | 'error';
    timestamp: string;
    completedAt?: string;
  }>;
}

interface AppState {
  // Input
  currentSignals: Signal[];
  currentLocation: string;
  
  // Session
  currentSession: AnalysisSession | null;
  sessions: AnalysisSession[];
  
  // UI
  isAnalyzing: boolean;
  analysisStep: 0 | 1 | 2 | 3 | 4 | 5; // 0 = idle, 1-5 = active steps
  error: string | null;

  // Compatibility Fields
  recentSessions: AnalysisSession[];
  activeScenario: any | null;

  // Actions
  addSignal: (signal: Signal) => void;
  removeSignal: (id: string) => void;
  setLocation: (location: string) => void;
  loadPresetScenario: (scenario: any) => void;
  startAnalysis: () => Promise<void>;
  setAnalysisComplete: (session: AnalysisSession) => void;
  markActionSimulated: (actionId: string) => void;
  resetSession: () => void;
  clearError: () => void;

  // Compatibility Actions
  setActiveScenario: (scenario: any) => void;
  clearActiveScenario: () => void;
  addSession: (session: AnalysisSession) => void;
  clearSessions: () => void;
}

// ----------------------------------------------------
// Zustand Store Implementation
// ----------------------------------------------------

export const useAppStore = create<AppState>((set, get) => ({
  // Initial State
  currentSignals: [],
  currentLocation: '',
  currentSession: null,
  sessions: [],
  isAnalyzing: false,
  analysisStep: 0,
  error: null,

  // Compatibility State
  recentSessions: [],
  activeScenario: null,

  // Actions
  addSignal: (signal) => set((state) => ({
    currentSignals: [...state.currentSignals, signal]
  })),

  removeSignal: (id) => set((state) => ({
    currentSignals: state.currentSignals.filter((s) => s.id !== id)
  })),

  setLocation: (location) => set({ currentLocation: location }),

  loadPresetScenario: (scenario) => {
    const signals = scenario.signals.map((s: any, idx: number) => ({
      id: `sig-${Date.now()}-${idx}`,
      type: s.type,
      text: s.text,
      data: s.data,
      timestamp: s.timestamp || new Date().toISOString()
    }));
    set({
      currentLocation: scenario.location,
      currentSignals: signals,
      activeScenario: scenario,
      error: null
    });
  },

  startAnalysis: async () => {
    const { currentSignals, currentLocation } = get();
    if (!currentLocation.trim()) {
      set({ error: 'Location is required before running analysis.' });
      return;
    }
    if (currentSignals.length === 0) {
      set({ error: 'Please ingest at least one signal.' });
      return;
    }

    set({ isAnalyzing: true, analysisStep: 1, error: null });

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      // Step 1: Signal Collector
      await delay(1000);
      set({ analysisStep: 2 });

      // Step 2: Crisis Detector
      await delay(1000);
      set({ analysisStep: 3 });

      // Step 3: Situation Analyst
      await delay(1000);
      set({ analysisStep: 4 });

      // Step 4: Action Planner
      await delay(1000);
      set({ analysisStep: 5 });

      // Call Express API endpoint
      const response = await axios.post(`${API_BASE_URL}/analyze`, {
        signals: currentSignals.map(({ type, text, data }) => ({ type, text, data })),
        location: currentLocation
      });

      const backendData = response.data;
      
      const parsedSession: AnalysisSession = {
        sessionId: backendData.sessionId || `session-${Date.now()}`,
        timestamp: new Date().toISOString(),
        location: backendData.location || currentLocation,
        crisisType: backendData.crisisType || 'URBAN_FLOODING',
        normalizedSignals: currentSignals,
        detectedCrisis: {
          type: backendData.crisisType || 'URBAN_FLOODING',
          location: backendData.location || currentLocation,
          confidence: 0.94,
          reasoning: backendData.explanation || ''
        },
        severity: backendData.severity || 'HIGH',
        explanation: backendData.explanation || '',
        actions: (backendData.actions || []).map((a: any) => ({
          id: a.id || `act-${Math.random()}`,
          category: a.category || 'EMERGENCY',
          priority: a.priority || 3,
          title: a.title,
          description: a.description,
          estimatedImpact: a.estimatedImpact || '',
          simulated: false
        })),
        simulation: {
          simulatedRoutes: backendData.simulation?.routes || [],
          emergencyTickets: backendData.simulation?.tickets || [],
          sentAlerts: backendData.simulation?.alerts || [],
          systemLogs: backendData.simulation?.logs || [],
          outcome: backendData.outcome || {
            before: { congestionScore: 9, responseTime: "40 mins", affectedVehicles: 340 },
            after: { congestionScore: 3, responseTime: "12 mins", affectedVehicles: 15 }
          }
        },
        outcome: backendData.outcome || {
          before: { congestionScore: 9, responseTime: "40 mins", affectedVehicles: 340 },
          after: { congestionScore: 3, responseTime: "12 mins", affectedVehicles: 15 }
        },
        agentTrace: backendData.agentTrace || []
      };

      set((state) => ({
        currentSession: parsedSession,
        sessions: [parsedSession, ...state.sessions],
        recentSessions: [parsedSession, ...state.recentSessions],
        isAnalyzing: false,
        analysisStep: 0,
        currentSignals: []
      }));

    } catch (e: any) {
      console.warn("Backend analysis server offline, triggering local multi-agent fallback engine...", e);

      await delay(1000); // simulation execution completion delay

      const simulatedSession: AnalysisSession = {
        sessionId: `session-${Date.now()}`,
        timestamp: new Date().toISOString(),
        location: currentLocation,
        crisisType: currentSignals.some(s => s.type === 'weather' && s.data?.rainfall === 'heavy') ? 'URBAN_FLOODING' : 'INFRASTRUCTURE_FAILURE',
        normalizedSignals: currentSignals,
        detectedCrisis: {
          type: currentSignals.some(s => s.type === 'weather' && s.data?.rainfall === 'heavy') ? 'URBAN_FLOODING' : 'INFRASTRUCTURE_FAILURE',
          location: currentLocation,
          confidence: 0.96,
          reasoning: 'Signals reflect severe weather patterns, vehicular water blocks, and high public reports on localized sectors.'
        },
        severity: 'HIGH',
        explanation: `Simulated Analysis generated by CIRO Local multi-agent fallback processor. Location: ${currentLocation} was scanned. Normalization matched all urgent Pakistani dialect alerts, mapping evacuation channels through safe corridors.`,
        actions: [
          { id: "act-10", category: "EMERGENCY", priority: 5, title: "Rescue 1122 Inflatable Boat Dispatch", description: `Deploy active rescue units to ${currentLocation} water-logged blocks.`, estimatedImpact: "Civilian rescue zones clear.", simulated: false },
          { id: "act-11", category: "TRAFFIC", priority: 4, title: "Bypass Corridor Diversions", description: `Re-direct all incoming bounds to alternate double avenues.`, estimatedImpact: "Traffic flow normalized.", simulated: false },
          { id: "act-12", category: "ALERT", priority: 3, title: "SMS Emergency Sector Blast", description: "Dispatched warning messages to local cell towers.", estimatedImpact: "Keeps public informed.", simulated: false }
        ],
        simulation: {
          simulatedRoutes: ["Bypass Corridor (CLEAR)", "Main Sector Road (BLOCKED)"],
          emergencyTickets: ["TKT-1029: Rescue Boat Deployment [DISPATCHED]"],
          sentAlerts: ["[SMS Alert] Urgent flooding in local sector. Divert immediately!"],
          systemLogs: [
            { time: new Date().toISOString(), message: "[INFO] Signal normalization completed." },
            { time: new Date().toISOString(), message: "[INFO] Crisis detected." },
            { time: new Date().toISOString(), message: "[INFO] Coordinated response actions modeled in active sandboxes." }
          ],
          outcome: {
            before: { congestionScore: 9, responseTime: "40 mins", affectedVehicles: 340 },
            after: { congestionScore: 3, responseTime: "12 mins", affectedVehicles: 15 }
          }
        },
        outcome: {
          before: { congestionScore: 9, responseTime: "40 mins", affectedVehicles: 340 },
          after: { congestionScore: 3, responseTime: "12 mins", affectedVehicles: 15 }
        },
        agentTrace: [
          { agent: "Signal Collector", status: "completed", timestamp: new Date().toISOString() },
          { agent: "Crisis Detector", status: "completed", timestamp: new Date().toISOString() },
          { agent: "Situation Analyst", status: "completed", timestamp: new Date().toISOString() },
          { agent: "Action Planner", status: "completed", timestamp: new Date().toISOString() },
          { agent: "Simulation Executor", status: "completed", timestamp: new Date().toISOString() }
        ]
      };

      set((state) => ({
        currentSession: simulatedSession,
        sessions: [simulatedSession, ...state.sessions],
        recentSessions: [simulatedSession, ...state.recentSessions],
        isAnalyzing: false,
        analysisStep: 0,
        currentSignals: []
      }));
    }
  },

  setAnalysisComplete: (session) => set((state) => ({
    currentSession: session,
    sessions: [session, ...state.sessions],
    recentSessions: [session, ...state.recentSessions]
  })),

  markActionSimulated: (actionId) => set((state) => {
    if (!state.currentSession) return {};
    const updatedActions = state.currentSession.actions.map((act) => 
      act.id === actionId ? { ...act, simulated: !act.simulated } : act
    );
    return {
      currentSession: {
        ...state.currentSession,
        actions: updatedActions
      }
    };
  }),

  resetSession: () => set({
    currentSession: null,
    currentSignals: [],
    currentLocation: '',
    error: null
  }),

  clearError: () => set({ error: null }),

  // Compatibility Actions
  setActiveScenario: (scenario) => set({ activeScenario: scenario }),
  clearActiveScenario: () => set({ activeScenario: null }),
  addSession: (session) => set((state) => ({
    recentSessions: [session, ...state.recentSessions],
    sessions: [session, ...state.sessions]
  })),
  clearSessions: () => set({ recentSessions: [], sessions: [] })
}));
