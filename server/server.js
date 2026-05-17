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
  res.json({
    location: req.query.location || 'Unknown',
    data: {
      temperature: 28,
      rainfall: 'heavy',
      windSpeed: 45,
      alert: true,
      description: 'Severe thunderstorm warning'
    }
  });
});

// GET /api/mock/traffic → Returns simulated traffic data
app.get('/api/mock/traffic', (req, res) => {
  res.json({
    location: req.query.location || 'Unknown',
    data: {
      congestionLevel: 9,
      blockedRoutes: ['Kashmir Highway', 'G-10 Markaz Road'],
      averageSpeed: 5,
      description: 'Major gridlock due to water logging'
    }
  });
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

// POST /api/analyze → Full pipeline: takes signals, runs all agents, returns complete result
app.post('/api/analyze', async (req, res) => {
  try {
    const { signals, location } = req.body;
    if (!signals || !Array.isArray(signals)) {
      return res.status(400).json({ error: 'signals is required and must be an array' });
    }

    const sessionId = uuidv4();
    const agentTrace = [];

    // Step 1: Normalization
    agentTrace.push({ agent: "Signal Collector", status: "running", timestamp: new Date().toISOString() });
    const normalData = await runSignalCollector(signals);
    agentTrace[0].status = "completed";
    agentTrace[0].completedAt = new Date().toISOString();

    // Step 2: Detection
    agentTrace.push({ agent: "Crisis Detector", status: "running", timestamp: new Date().toISOString() });
    const detectedCrisis = await runCrisisDetector(normalData.normalizedSignals);
    agentTrace[1].status = "completed";
    agentTrace[1].completedAt = new Date().toISOString();

    // Step 3: Situation Analysis
    agentTrace.push({ agent: "Situation Analyst", status: "running", timestamp: new Date().toISOString() });
    const analysis = await runSituationAnalyst(detectedCrisis);
    agentTrace[2].status = "completed";
    agentTrace[2].completedAt = new Date().toISOString();

    // Step 4: Action Planner
    agentTrace.push({ agent: "Action Planner", status: "running", timestamp: new Date().toISOString() });
    const plan = await runActionPlanner(analysis);
    agentTrace[3].status = "completed";
    agentTrace[3].completedAt = new Date().toISOString();

    // Step 5: Simulation Executor
    agentTrace.push({ agent: "Simulation Executor", status: "running", timestamp: new Date().toISOString() });
    const simulation = await runSimulationExecutor(plan.actions);
    agentTrace[4].status = "completed";
    agentTrace[4].completedAt = new Date().toISOString();

    // Composite Response Shape matching user's requested specification:
    const responseData = {
      sessionId,
      agentTrace,
      detectedCrisis: {
        type: detectedCrisis.crisisType || "NO_CRISIS",
        location: detectedCrisis.location || location || "Unknown",
        confidence: detectedCrisis.confidence || 0.0
      },
      severity: analysis.severity || "LOW",
      explanation: analysis.explanation || "No active crisis could be confirmed.",
      actions: plan.actions || [],
      simulation: {
        routes: simulation.simulatedRoutes ? simulation.simulatedRoutes.map(r => `${r.name} (${r.status} - Congestion: ${r.congestionScore}/10)`) : [],
        alerts: simulation.sentAlerts ? simulation.sentAlerts.map(a => `[${a.channel}] ${a.message} (Target: ${a.audienceSize} people)`) : [],
        tickets: simulation.emergencyTickets ? simulation.emergencyTickets.map(t => `${t.ticketId}: ${t.subject} [${t.status}]`) : [],
        logs: simulation.systemLogs ? simulation.systemLogs.map(l => ({ time: l.time, message: `[${l.level}] ${l.message}` })) : []
      },
      outcome: simulation.outcome || {
        before: { congestionScore: 0, responseTime: "0 mins", affectedVehicles: 0 },
        after: { congestionScore: 0, responseTime: "0 mins", affectedVehicles: 0 }
      }
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error in Full Pipeline:', error);
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
