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
  demoMode: boolean;

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
  setDemoMode: (val: boolean) => void;

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
  demoMode: true,

  // Compatibility State
  recentSessions: [],
  activeScenario: null,

  // Actions
  setDemoMode: (val) => set({ demoMode: val }),

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
    const { currentSignals, currentLocation, demoMode, activeScenario } = get();
    
    // Validation edge case: Empty signals/location
    if (!currentLocation.trim()) {
      set({ error: 'Location is required before running analysis.' });
      return;
    }
    if (currentSignals.length === 0) {
      set({ error: 'Please ingest at least one signal before running analysis.' });
      return;
    }

    set({ isAnalyzing: true, analysisStep: 1, error: null });

    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    // High fidelity simulated session matching current signals if no activeScenario scenario is present
    const genericSimulatedSession: AnalysisSession = {
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
          { time: new Date().toISOString(), message: "[INFO] Signal collector completed. Normalized Roman Urdu text." },
          { time: new Date().toISOString(), message: "[INFO] Crisis detected with 96% confidence score." },
          { time: new Date().toISOString(), message: "[INFO] Action planner built 3 responsive intervention routes." }
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

    // 1. OFFLINE DEMO MODE FLOW
    if (demoMode) {
      try {
        // Run staggered loading steps for judges visual presentation
        await delay(1200); set({ analysisStep: 2 });
        await delay(1200); set({ analysisStep: 3 });
        await delay(1200); set({ analysisStep: 4 });
        await delay(1200); set({ analysisStep: 5 });
        await delay(1200);

        // Pre-computed Scenario Session Fallback
        const demoSession = activeScenario && activeScenario.precomputedSession 
          ? activeScenario.precomputedSession 
          : genericSimulatedSession;

        set((state) => ({
          currentSession: demoSession as any,
          sessions: [demoSession, ...state.sessions] as any,
          recentSessions: [demoSession, ...state.recentSessions] as any,
          isAnalyzing: false,
          analysisStep: 0,
          currentSignals: []
        }));
      } catch (err) {
        set({ isAnalyzing: false, analysisStep: 0, error: 'Demo simulation failure.' });
      }
      return;
    }

    // 2. LIVE MODE IS NOW STREAM-DRIVEN FROM THE ANALYSIS SCREEN
    // The analysis tab opens the SSE stream so the UI can show step-by-step updates.
    set({ isAnalyzing: true, analysisStep: 1, error: null });
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
