require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

// Import Agents
const { runSignalCollector } = require('./agents/signalCollector');
const { runCrisisDetector } = require('./agents/crisisDetector');
const { runSituationAnalyst } = require('./agents/situationAnalyst');
const { runActionPlanner } = require('./agents/actionPlanner');
const { runSimulationExecutor } = require('./agents/simulationExecutor');

// Import Google ADK Orchestrator
const { CIROOrchestrator, globalOrchestrationTraces } = require('./orchestration/agentOrchestrator');

// Import Mock Data Generators
const { generateWeatherData, generateTrafficData, getMockScenarios } = require('./mock/mockData');

// Import Live Services
const weatherService = require('./services/weatherService');
const mapsService = require('./services/mapsService');
const geminiService = require('./services/geminiService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// GET /api/health → Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// GET /api/mock/weather → Returns simulated weather data
app.get('/api/mock/weather', (req, res) => {
  const location = req.query.location || 'G-10, Islamabad';
  const data = generateWeatherData(location);
  res.json({ location, data });
});

// GET /api/weather/:location → Returns live weather data using Open-Meteo API
app.get('/api/weather/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const data = await weatherService.getLiveWeather(location);
    const alerts = await weatherService.getWeatherAlerts(location);
    res.json({ success: true, ...data, alerts });
  } catch (error) {
    console.error(`[Server] Error fetching live weather for ${req.params.location}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =========================================================================
// GOOGLE MAPS ROUTING, TRAFFIC & EMERGENCY SERVICES ENDPOINTS
// =========================================================================

// GET /api/maps/routes?from=G-10&to=Faizabad
app.get('/api/maps/routes', async (req, res) => {
  try {
    const { from, to, avoidLat, avoidLng } = req.query;
    if (!from || !to) {
      return res.status(400).json({ success: false, error: "Missing required query parameters 'from' and 'to'" });
    }
    let avoidPoint = null;
    if (avoidLat && avoidLng) {
      avoidPoint = { lat: parseFloat(avoidLat), lng: parseFloat(avoidLng) };
    }
    const routes = await mapsService.getAlternateRoutes(from, to, avoidPoint);
    res.json({ success: true, routes });
  } catch (error) {
    console.error('[Server] Directions routing error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/maps/traffic/:location
app.get('/api/maps/traffic/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const conditions = await mapsService.getTrafficConditions(location);
    res.json({ success: true, ...conditions });
  } catch (error) {
    console.error('[Server] Traffic check error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/maps/emergency-services/:type?lat=33.69&lng=73.01
app.get('/api/maps/emergency-services/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: "Missing required query parameters 'lat' and 'lng'" });
    }
    const services = await mapsService.getNearbyEmergencyServices(parseFloat(lat), parseFloat(lng), type);
    res.json({ success: true, type, services });
  } catch (error) {
    console.error('[Server] Emergency search error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/maps/geocode { location: string }
app.post('/api/maps/geocode', async (req, res) => {
  try {
    const { location } = req.body;
    if (!location) {
      return res.status(400).json({ success: false, error: "Missing required body parameter 'location'" });
    }
    const coords = await mapsService.geocodeLocation(location);
    res.json({ success: true, ...coords });
  } catch (error) {
    console.error('[Server] Geocoding error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/maps/reverse-geocode?lat=33.69&lng=73.01
app.get('/api/maps/reverse-geocode', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, error: "Missing required query parameters 'lat' and 'lng'" });
    }
    const location = await mapsService.reverseGeocode(parseFloat(lat), parseFloat(lng));
    res.json({ success: true, ...location });
  } catch (error) {
    console.error('[Server] Reverse geocoding error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// =========================================================================
// GOOGLE GEMINI 2.0 FLASH AI ENDPOINTS
// =========================================================================

// POST /api/gemini/analyze → Full situation assessment using live data
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const { crisisData, weatherData, trafficData, mapsData } = req.body;
    const analysis = await geminiService.analyzeCrisisWithLiveData(crisisData, weatherData, trafficData, mapsData);
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('[Server] Gemini Analysis Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/gemini/stream → Real-time streaming insights via Server-Sent Events (SSE)
app.get('/api/gemini/stream', async (req, res) => {
  try {
    const { location, crisisType, rain, temperature } = req.query;
    
    // Normalize data inputs from query parameters
    const crisisData = {
      location: location || 'G-10, Islamabad',
      crisisType: crisisType || 'URBAN_FLOODING'
    };
    
    const weatherData = {
      location: location || 'G-10, Islamabad',
      temperature: parseFloat(temperature) || 24,
      rain: parseFloat(rain) || 0,
      precipitation: parseFloat(rain) || 0
    };
    
    await geminiService.streamInsights(crisisData, weatherData, res);
  } catch (error) {
    console.error('[Server] Gemini SSE Streaming Error:', error);
    // Secure header status if stream hasn't been committed yet
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
});

// POST /api/gemini/action-plan → Generate emergency plan with active Pakistani helplines
app.post('/api/gemini/action-plan', async (req, res) => {
  try {
    const { situation, weatherData, nearbyServices } = req.body;
    if (!situation) {
      return res.status(400).json({ success: false, error: "Missing required parameters 'situation'" });
    }
    const plan = await geminiService.generateActionPlan(situation, weatherData, nearbyServices);
    res.json({ success: true, plan });
  } catch (error) {
    console.error('[Server] Gemini Action Plan Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/gemini/evaluate → Outcome evaluation critique
app.post('/api/gemini/evaluate', async (req, res) => {
  try {
    const { before, after, actions } = req.body;
    const evaluation = await geminiService.evaluateOutcome(before, after, actions);
    res.json({ success: true, evaluation });
  } catch (error) {
    console.error('[Server] Gemini Outcome Evaluation Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/mock/traffic → Returns simulated traffic data
app.get('/api/mock/traffic', (req, res) => {
  const location = req.query.location || 'G-10';
  const data = generateTrafficData(location);
  res.json({ location, data });
});

// GET /api/mock/scenarios → Returns preset crisis scenarios
app.get('/api/mock/scenarios', (req, res) => {
  const scenarios = getMockScenarios();
  res.json({ success: true, scenarios });
});

// POST /api/agent/detect → Run only Agent 2 (Crisis Detector)
app.post('/api/agent/detect', async (req, res) => {
  try {
    const { signals } = req.body;
    if (!signals || !Array.isArray(signals)) {
      return res.status(400).json({ error: 'signals is required and must be an array' });
    }
    
    // First normalize signals
    const normalizedData = await runSignalCollector(signals);
    // Then detect
    const detectedCrisis = await runCrisisDetector(normalizedData.normalizedSignals);
    
    res.json({ success: true, detectedCrisis });
  } catch (error) {
    console.error('Error in Crisis Detector:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/agent/analyze → Run only Agent 3 (Situation Analyst)
app.post('/api/agent/analyze', async (req, res) => {
  try {
    const { crisisContext } = req.body;
    if (!crisisContext) {
      return res.status(400).json({ error: 'crisisContext is required' });
    }
    
    const analysis = await runSituationAnalyst(crisisContext);
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Error in Situation Analyst:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/agent/plan → Run only Agent 4 (Action Planner)
app.post('/api/agent/plan', async (req, res) => {
  try {
    const { analysisContext } = req.body;
    if (!analysisContext) {
      return res.status(400).json({ error: 'analysisContext is required' });
    }
    
    const responsePlan = await runActionPlanner(analysisContext);
    res.json({ success: true, actions: responsePlan.actions });
  } catch (error) {
    console.error('Error in Action Planner:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/agent/simulate → Run only Agent 5 (Executor)
app.post('/api/agent/simulate', async (req, res) => {
  try {
    const { actions } = req.body;
    if (!actions) {
      return res.status(400).json({ error: 'actions are required' });
    }
    
    const simulation = await runSimulationExecutor(actions);
    res.json({ success: true, simulation });
  } catch (error) {
    console.error('Error in Executor:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/analyze → Full pipeline powered by Google ADK Orchestrator
app.post('/api/analyze', async (req, res) => {
  try {
    const { signals, location } = req.body;
    if (!signals || !Array.isArray(signals)) {
      return res.status(400).json({ error: 'signals is required and must be an array' });
    }

    const orchestratedData = await CIROOrchestrator.executePipeline(signals, location);
    res.json(orchestratedData);
  } catch (error) {
    console.error('Error in ADK Orchestrate Pipeline via /api/analyze:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/orchestrate/trace → Returns the full ADK agent trace log
app.get('/api/orchestrate/trace', (req, res) => {
  res.json({
    success: true,
    agentName: CIROOrchestrator.name,
    description: CIROOrchestrator.description,
    totalTraces: globalOrchestrationTraces.length,
    traces: globalOrchestrationTraces
  });
});

// POST /api/orchestrate → Google ADK Orchestrated sequential pipeline execution
app.post('/api/orchestrate', async (req, res) => {
  try {
    const { signals, location } = req.body;
    if (!signals || !Array.isArray(signals)) {
      return res.status(400).json({ error: 'signals is required and must be an array' });
    }

    const orchestratedData = await CIROOrchestrator.executePipeline(signals, location);
    res.json(orchestratedData);
  } catch (error) {
    console.error('Error in ADK Orchestrate Pipeline:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', details: err.message });
});

app.listen(PORT, () => {
  console.log(`CIRO Backend Server running on http://localhost:${PORT}`);
});
