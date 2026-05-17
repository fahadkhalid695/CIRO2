export interface NormalizedSignal {
  type: 'social' | 'weather' | 'traffic';
  text?: string;
  data?: any;
  timestamp: string;
}

export interface AnalyzePayload {
  signals: NormalizedSignal[];
  location: string;
}

export interface DetectionResult {
  detected: boolean;
  crisisType: 'URBAN_FLOODING' | 'HEATWAVE' | 'ROAD_BLOCKAGE' | 'ACCIDENT' | 'INFRASTRUCTURE_FAILURE' | 'NO_CRISIS';
  location: string;
  confidence: number;
  reasoning: string;
}

export interface SituationResult {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  location: string;
  impactSummary: string;
  affectedPeopleEstimate: number;
  boundaryCoordinates: Array<{ latitude: number; longitude: number }>;
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

export interface ActionPlanResult {
  actions: Action[];
}

export interface SimulationResult {
  simulatedRoutes: Array<{ name: string; status: string; congestionScore: number }>;
  emergencyTickets: Array<{ ticketId: string; subject: string; status: string }>;
  sentAlerts: Array<{ channel: string; message: string; audienceSize: number }>;
  systemLogs: Array<{ time: string; level: 'INFO' | 'WARNING' | 'ERROR'; message: string }>;
  outcome: {
    before: { congestionScore: number; responseTime: string; affectedVehicles: number };
    after: { congestionScore: number; responseTime: string; affectedVehicles: number };
  };
}

export interface AnalysisResult {
  sessionId: string;
  timestamp: string;
  location: string;
  crisisType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  explanation: string;
  normalizedSignals: NormalizedSignal[];
  detectedCrisis: DetectionResult;
  actions: Action[];
  simulation: SimulationResult;
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

export interface WeatherData {
  location: string;
  temperature: number;
  humidity: number;
  rainfall: 'none' | 'light' | 'moderate' | 'heavy' | 'extreme';
  rainfallMM: number;
  alert: boolean;
  alertType: string;
  windSpeed: number;
  visibility: string;
}

export interface TrafficData {
  location: string;
  congestionScore: number;
  avgSpeed: number;
  incidents: string[];
  alternateRoutes: string[];
  affectedVehicles: number;
}

export interface PresetScenario {
  id: string;
  title: string;
  location: string;
  crisisType: string;
  icon: string;
  signals: NormalizedSignal[];
}
