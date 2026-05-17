import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { Platform } from 'react-native';
import {
  AnalyzePayload,
  AnalysisResult,
  NormalizedSignal,
  DetectionResult,
  SituationResult,
  ActionPlanResult,
  SimulationResult,
  WeatherData,
  TrafficData,
  PresetScenario,
  Action
} from './types';

// Custom configuration interface for tracking retry stats
interface CustomAxiosRequestConfig extends InternalAxiosRequestConfig {
  retryCount?: number;
  startTime?: number;
}

// 1. Establish base URL from environment variables, with clean fallback bounds
const DEFAULT_URL = Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_URL;

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

// 2. Request Interceptor: Ingest timestamp indicators
apiClient.interceptors.request.use(
  (config: CustomAxiosRequestConfig) => {
    config.startTime = Date.now();
    console.log(`[API REQUEST] [${config.method?.toUpperCase()}] ${config.url} - Dispatched`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor: Calculate and log total response transit delays
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    const config = response.config as CustomAxiosRequestConfig;
    if (config.startTime) {
      const latency = Date.now() - config.startTime;
      console.log(`[API RESPONSE] [${config.method?.toUpperCase()}] ${config.url} - Status ${response.status} (Latency: ${latency}ms)`);
    }
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as CustomAxiosRequestConfig;
    
    // Check if error is network/timeout related or server crash (status 5xx) to warrant a retry
    const shouldRetry = error.code === 'ECONNABORTED' || !error.response || (error.response.status >= 500 && error.response.status <= 599);

    if (config && shouldRetry) {
      config.retryCount = config.retryCount ?? 0;
      
      if (config.retryCount < 2) {
        config.retryCount += 1;
        const delayMs = Math.pow(2, config.retryCount) * 1000; // Exponential Backoff: 2s, 4s
        
        console.warn(`[API RETRY] Attempt #${config.retryCount} for ${config.url} in ${delayMs}ms due to: ${error.message}`);
        
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        return apiClient(config);
      }
    }

    // 4. Transform Axios errors into highly readable, standardized message schemas
    let readableMessage = 'An unexpected network error occurred. Please check your command center link.';
    if (error.response) {
      const serverError: any = error.response.data;
      readableMessage = serverError?.message || serverError?.error || `Server responded with status: ${error.response.status}`;
    } else if (error.request) {
      readableMessage = 'Unable to establish contact with the CIRO Analysis Server. Please verify the host status.';
    } else {
      readableMessage = error.message;
    }

    console.error(`[API ERROR] ${config?.url} - Message: ${readableMessage}`);
    return Promise.reject(new Error(readableMessage));
  }
);

// ----------------------------------------------------
// Typed API Methods
// ----------------------------------------------------

/**
 * Executes full sequential multi-agent signals pipeline (Agent 1 to 5)
 */
export async function analyzeSignals(payload: AnalyzePayload): Promise<AnalysisResult> {
  const response = await apiClient.post<AnalysisResult>('/analyze', payload);
  return response.data;
}

/**
 * Triggers only Agent 2 (Crisis Detector)
 */
export async function runDetector(signals: NormalizedSignal[]): Promise<DetectionResult> {
  const response = await apiClient.post<DetectionResult>('/agent/detect', { signals });
  return response.data;
}

/**
 * Triggers only Agent 3 (Situation Analyst)
 */
export async function runAnalyst(crisis: DetectionResult): Promise<SituationResult> {
  const response = await apiClient.post<SituationResult>('/agent/analyze', { crisis });
  return response.data;
}

/**
 * Triggers only Agent 4 (Action Planner)
 */
export async function runPlanner(situation: SituationResult): Promise<ActionPlanResult> {
  const response = await apiClient.post<ActionPlanResult>('/agent/plan', { situation });
  return response.data;
}

/**
 * Triggers only Agent 5 (Simulation Executor)
 */
export async function runSimulator(actions: Action[]): Promise<SimulationResult> {
  const response = await apiClient.post<SimulationResult>('/agent/simulate', { actions });
  return response.data;
}

/**
 * Fetches simulated meteorological warning telemetries
 */
export async function getMockWeather(location: string): Promise<WeatherData> {
  const response = await apiClient.get<WeatherData>('/mock/weather', {
    params: { location }
  });
  return response.data;
}

/**
 * Fetches simulated traffic congestion maps
 */
export async function getMockTraffic(location: string): Promise<TrafficData> {
  const response = await apiClient.get<TrafficData>('/mock/traffic', {
    params: { location }
  });
  return response.data;
}

/**
 * Fetches Islamabad pre-set metropolitan crisis scenarios
 */
export async function getPresetScenarios(): Promise<PresetScenario[]> {
  const response = await apiClient.get<PresetScenario[]>('/mock/scenarios');
  return response.data;
}

export default apiClient;
