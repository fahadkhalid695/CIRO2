# CIRO Backend Orchestration Architecture

This document provides a deep-dive architectural analysis of the **CIRO (Crisis Intelligence & Response Orchestrator)** backend orchestration layer, showcasing how the Google Agent Development Kit (ADK) design pattern is integrated with Gemini models.

---

## 🏗️ Core Architecture Components

The backend directory contains the following modular structure:

```
/server
├── server.js               # Entry-point. Exposes REST endpoints to mobile client
├── package.json            # Backend dependency manifests
├── /orchestration
│   └── agentOrchestrator.js # Main Google ADK orchestration engine
├── /agents
│   ├── signalCollector.js  # Agent 1 prompt & clean logic
│   ├── crisisDetector.js   # Agent 2 prompt & classification logic
│   ├── situationAnalyst.js # Agent 3 prompt & threat logic
│   ├── actionPlanner.js    # Agent 4 prompt & mitigation mapping
│   └── simulationExecutor.js # Agent 5 prompt & traffic route bypass simulations
└── /mock
    └── mockData.js         # Fallback data streams for offline demonstrations
```

---

## 🛠️ Google ADK Declarative Design Pattern

CIRO is built upon the declarative principles of the **Google Agent Development Kit (ADK)**, representing agents as coordinate systems of modular, schema-enforced tools. 

### 1. `ADKTool` Class
Encapsulates single-purpose utility functions with explicit inputs, outputs, and logging diagnostics:
```javascript
class ADKTool {
  constructor({ name, description, inputSchema, outputSchema, execute }) {
    this.name = name;
    this.description = description;
    this.inputSchema = inputSchema;
    this.outputSchema = outputSchema;
    this.execute = execute; // Async function mapping to backend agents
  }
}
```

### 2. `ADKAgent` Class
Manages the orchestration pipeline, triggering tools sequentially, passing telemetry downstream, and collecting duration and token metrics:
```javascript
class ADKAgent {
  constructor({ name, description, tools }) {
    this.name = name;
    this.description = description;
    this.tools = tools; // Array of ADKTool instances
  }

  async executePipeline(rawSignals, location) {
    // 1. Tool 1: Signal Normalizer (Signal Collector)
    // 2. Tool 2: Crisis Detector
    // 3. Tool 3: Situation Analyst
    // 4. Tool 4: Action Planner
    // 5. Tool 5: Simulation Tool (Simulation Executor)
    // 6. Returns standard AnalysisSession trace log
  }
}
```

---

## 🤖 Specialty Agent Specifications

Each agent in `/server/agents/` runs a dedicated session with Gemini, using specific system instructions and structured JSON response schemas:

### Agent 1: Signal Collector
- **Module**: [signalCollector.js](file:///c:/Users/dell/OneDrive/Desktop/CIRO/server/agents/signalCollector.js)
- **Role**: Normalizes informal Roman Urdu, English, and regional dialect complaints into a standardized JSON format.
- **System Prompt Pattern**:
  ```text
  You receive raw inputs from different sources (social media, weather, traffic).
  Parse, clean, and normalize all signals into a unified JSON format.
  Handle informal Urdu dialects ("bohat paani jama hai", "g-10 block hai", "road accident ho gaya").
  Extract locations, urgency ratings, and descriptions.
  ```

### Agent 2: Crisis Detector
- **Module**: [crisisDetector.js](file:///c:/Users/dell/OneDrive/Desktop/CIRO/server/agents/crisisDetector.js)
- **Role**: Analyzes the normalized signal arrays to detect if active emergency clusters are occurring.
- **System Prompt Pattern**:
  ```text
  Analyze normalized signals to identify crisis events.
  Classify into standard types: URBAN_FLOODING, ROAD_BLOCKAGE, HEATWAVE, POWER_GRID_FAILURE, or NO_CRISIS.
  Output confidence scores and detailed reasonings.
  ```

### Agent 3: Situation Analyst
- **Module**: [situationAnalyst.js](file:///c:/Users/dell/OneDrive/Desktop/CIRO/server/agents/situationAnalyst.js)
- **Role**: Evaluates the hazard boundaries of the detected crisis to calculate civic threat ranks and population impact levels.
- **System Prompt Pattern**:
  ```text
  Evaluate detected crisis context to determine severity indices.
  Output severity levels: LOW, MEDIUM, HIGH, CRITICAL.
  Calculate affected vehicles and estimate population threat details.
  ```

### Agent 4: Action Planner
- **Module**: [actionPlanner.js](file:///c:/Users/dell/OneDrive/Desktop/CIRO/server/agents/actionPlanner.js)
- **Role**: Formulates prioritized, actionable mitigation instructions categorized by category types.
- **System Prompt Pattern**:
  ```text
  Create structured response check-lists.
  Categories MUST be TRAFFIC, EMERGENCY, ALERT, or RESOURCE.
  Assign priority values (1 to 5) and estimated impact statements.
  ```

### Agent 5: Simulation Executor
- **Module**: [simulationExecutor.js](file:///c:/Users/dell/OneDrive/Desktop/CIRO/server/agents/simulationExecutor.js)
- **Role**: Simulates traffic flow improvements, bypass route mappings, and responder dispatch tickers.
- **System Prompt Pattern**:
  ```text
  Simulate routing bypasses and dispatch coordinates.
  Generate responder ticket codes (e.g. TKT-1029).
  Formulate FM/SMS broadcast alert texts.
  Calculate before/after metrics showing congestion reductions.
  ```

---

## 🌐 REST API Endpoints & State Synchronization

The backend exposes a highly streamlined REST API designed to interface with the Expo mobile application:

| Endpoint | Method | Payload | Response | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/api/health` | GET | None | `{ status: "ok", timestamp: ... }` | Diagnostics health check. |
| `/api/mock/scenarios` | GET | None | `{ success: true, scenarios: [] }` | Fetches the 4 pre-calculated high-fidelity local presentation scenarios. |
| `/api/analyze` | POST | `{ signals: [], location: "" }` | Full `AnalysisSession` JSON | Sequential ADK pipeline execution managed by the `CIROOrchestrator`. |
| `/api/orchestrate/trace` | GET | None | `{ traces: [] }` | Developer traces of all run pipelines. |

---

## ⚡ Fail-Safe Failover Mechanisms

To guarantee **100% presentation uptime**, the backend implements custom failover blocks:
1. **Gemini API Key Failover**: If `GEMINI_API_KEY` is missing or undefined in the environment, the individual agents catch the error and fall back to high-fidelity, coordinate-accurate mock telemetry generators.
2. **Network Offline Failover**: If the mobile device loses connection to the Express server, the mobile's Zustand store catches the error and loads pre-populated ADK pipeline traces natively. 

This ensures that the interactive maps, pulsing markers, bypass routes, and outcome meters continue to animate flawlessly during live judge presentations.
