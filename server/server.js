require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Anthropic client (will use process.env.ANTHROPIC_API_KEY)
const anthropic = new Anthropic();

// Request payload shape for /api/analyze:
// {
//   "signals": [
//     { "type": "social", "text": "Flash flood in G-10, cars stuck", "timestamp": "..." }, ...
//   ],
//   "location": "G-10, Islamabad"
// }

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
    
    // In a real scenario, you'd prompt Claude with the signals to extract crisis info
    // For now, we simulate the output
    const detectedCrisis = {
      type: "Flash Flood",
      location: "G-10, Islamabad",
      confidence: 0.92,
      severity: "HIGH",
      summary: "Multiple reports of heavy flooding and stranded vehicles."
    };
    
    res.json({ success: true, detectedCrisis });
  } catch (error) {
    console.error('Error in Crisis Detector:', error);
    res.status(500).json({ error: 'Failed to run Crisis Detector agent' });
  }
});

// POST /api/agent/analyze → Run only Agent 3 (Situation Analyst)
app.post('/api/agent/analyze', async (req, res) => {
  try {
    const { crisisContext } = req.body;
    
    const analysis = {
      impactedSectors: ['Residential', 'Transport'],
      populationAtRisk: 2500,
      resourceRequirements: ['Water Rescue Teams', 'Ambulances'],
      explanation: "Given the topography of G-10 and current precipitation, water levels will continue to rise."
    };
    
    res.json({ success: true, analysis });
  } catch (error) {
    console.error('Error in Situation Analyst:', error);
    res.status(500).json({ error: 'Failed to run Situation Analyst agent' });
  }
});

// POST /api/agent/plan → Run only Agent 4 (Action Planner)
app.post('/api/agent/plan', async (req, res) => {
  try {
    const { analysisContext } = req.body;
    
    const actions = [
      { id: 1, type: "DISPATCH", resource: "Water Rescue Unit 3", target: "G-10/4", priority: "CRITICAL" },
      { id: 2, type: "ALERT", resource: "Public Broadcast System", target: "G-10 Residents", priority: "HIGH" },
      { id: 3, type: "DIVERT_TRAFFIC", resource: "Traffic Police", target: "Kashmir Highway Exit", priority: "HIGH" }
    ];
    
    res.json({ success: true, actions });
  } catch (error) {
    console.error('Error in Action Planner:', error);
    res.status(500).json({ error: 'Failed to run Action Planner agent' });
  }
});

// POST /api/agent/simulate → Run only Agent 5 (Executor)
app.post('/api/agent/simulate', async (req, res) => {
  try {
    const { actions } = req.body;
    
    const simulation = {
      routes: ['Safe evacuation path via F-10', 'Emergency corridor on G-9 border'],
      alerts: ['Evacuation alert sent to 4500 devices', 'Traffic diverted successfully'],
      tickets: ['TKT-1029: Rescue Boat Deployed', 'TKT-1030: Medical Camp Setup'],
      logs: [
        { time: new Date().toISOString(), message: "Simulation started" },
        { time: new Date().toISOString(), message: "Resources projected to arrive in 12 mins" }
      ]
    };
    
    res.json({ success: true, simulation });
  } catch (error) {
    console.error('Error in Executor:', error);
    res.status(500).json({ error: 'Failed to run Executor agent' });
  }
});

// POST /api/analyze → Full pipeline: takes signals, runs all agents, returns complete result
app.post('/api/analyze', async (req, res) => {
  try {
    const { signals, location } = req.body;
    const sessionId = uuidv4();
    
    // In a complete implementation, you would:
    // 1. Gather all data (mock or real)
    // 2. Pass sequentially to Anthropic Claude via the SDK
    // Example:
    /*
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: "You are the Crisis Orchestrator...",
      messages: [{ role: "user", content: JSON.stringify({ signals, location }) }]
    });
    */

    // For demonstration, we'll return a composite of the mocked agents above
    const responseData = {
      sessionId,
      agentTrace: [
        { agent: "Data Gatherer", status: "completed", timestamp: new Date().toISOString() },
        { agent: "Crisis Detector", status: "completed", timestamp: new Date().toISOString() },
        { agent: "Situation Analyst", status: "completed", timestamp: new Date().toISOString() },
        { agent: "Action Planner", status: "completed", timestamp: new Date().toISOString() },
        { agent: "Executor", status: "completed", timestamp: new Date().toISOString() }
      ],
      detectedCrisis: { 
        type: "Flash Flood & Gridlock", 
        location: location || "G-10, Islamabad", 
        confidence: 0.92 
      },
      severity: "HIGH",
      explanation: "Signals indicate severe flooding coupled with heavy traffic. Social media sentiment reflects rising panic, matching weather alerts for the sector.",
      actions: [
        { id: 1, type: "DISPATCH", resource: "Water Rescue Unit 3", target: "G-10/4", priority: "CRITICAL" },
        { id: 2, type: "ALERT", resource: "Public Broadcast System", target: "G-10 Residents", priority: "HIGH" },
        { id: 3, type: "DIVERT_TRAFFIC", resource: "Traffic Police", target: "Kashmir Highway Exit", priority: "HIGH" }
      ],
      simulation: {
        routes: ['Safe evacuation path via F-10', 'Emergency corridor on G-9 border'],
        alerts: ['Evacuation alert sent to 4500 devices', 'Traffic diverted successfully'],
        tickets: ['TKT-1029: Rescue Boat Deployed', 'TKT-1030: Medical Camp Setup'],
        logs: [
          { time: new Date().toISOString(), message: "Simulation started" },
          { time: new Date().toISOString(), message: "Resources projected to arrive in 12 mins" }
        ]
      },
      outcome: { 
        before: { casualties: "Unknown", trapped: 45, areaSubmerged: "30%" }, 
        after: { casualties: 0, trapped: 0, areaSubmerged: "30%" } 
      }
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error in Full Pipeline:', error);
    res.status(500).json({ error: 'Failed to execute full analysis pipeline' });
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
