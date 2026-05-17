import { create } from 'zustand';

export interface SessionResult {
  sessionId: string;
  timestamp: string;
  location: string;
  crisisType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  explanation: string;
  actions: Array<{
    id: string;
    category: string;
    priority: number;
    title: string;
    description: string;
    estimatedImpact: string;
  }>;
  simulation: {
    routes: string[];
    alerts: string[];
    tickets: string[];
    logs: Array<{ time: string; message: string }>;
  };
  outcome: {
    before: { congestionScore: number; responseTime: string; affectedVehicles: number };
    after: { congestionScore: number; responseTime: string; affectedVehicles: number };
  };
}

interface AppState {
  activeScenario: {
    id: string;
    title: string;
    location: string;
    crisisType: string;
    signals: any[];
  } | null;
  recentSessions: SessionResult[];
  setActiveScenario: (scenario: any) => void;
  clearActiveScenario: () => void;
  addSession: (session: SessionResult) => void;
  clearSessions: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeScenario: null,
  recentSessions: [],
  setActiveScenario: (scenario) => set({ activeScenario: scenario }),
  clearActiveScenario: () => set({ activeScenario: null }),
  addSession: (session) => set((state) => ({ 
    recentSessions: [session, ...state.recentSessions] 
  })),
  clearSessions: () => set({ recentSessions: [] }),
}));
