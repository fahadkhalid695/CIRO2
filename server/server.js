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
