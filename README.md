# CIRO — Crisis Intelligence & Response Orchestrator

## Overview
**CIRO (Crisis Intelligence & Response Orchestrator)** is a state-of-the-art multi-agent emergency mitigation and command dashboard tailored for Pakistani metropolitan hubs (such as Islamabad and Rawalpindi). The platform ingests unstructured public data feeds, weather sensors, and traffic APIs, and runs them through five highly coordinated artificial intelligence agents. By parsing local dialects (including Roman Urdu and regional English terminology), CIRO detects active metropolitan crises, calculates threatened boundaries, and generates structured mitigation plans instantly.

At its core, CIRO provides urban emergency managers and first responders with a unified telemetry dashboard. Driven by the **Google Agent Development Kit (ADK / Antigravity Framework)** and advanced **Gemini** models, it enables interactive action plan coordination, high-fidelity traffic congestion simulation, and real-time dispatch ticketing. Designed with a premium dark-mode aesthetic, fluid micro-animations, and live route mapping, CIRO showcases how modern agentic AI can automate disaster management and save civic lives.

---

## System Architecture

Below is the conceptual architecture showing the end-to-end data flow from the mobile app down to the AI agents and high-fidelity simulation engine:

```mermaid
graph TD
    subgraph Mobile Client (Expo / React Native)
        A[Home Telemetry Screen] -->|Load Scenario / Inject Feed| B[Input Signal Panel]
        B -->|Trigger Analysis Pipeline| C[Analysis Progress Screen]
        E[Simulation Sandbox Map] <--|Simulate Response Actions| A
    end

    subgraph Backend Server (Node.js / Express)
        D[REST API Endpoints] -->|POST /api/analyze| F[ADK Orchestrator: CIROOrchestrator]
    end

    subgraph Google ADK Orchestration Layer
        F -->|Cascade Signals| G[1. Signal Normalizer Tool]
        G -->|Normalized JSON| H[2. Crisis Detector Tool]
        H -->|Classification & Confidence| I[3. Situation Analyst Tool]
        I -->|Severity & STRANDED count| J[4. Action Planner Tool]
        J -->|Mitigation Instructions| K[5. Simulation Tool]
    end

    subgraph Generative AI Agents (Gemini 1.5 Pro)
        G -.->|Normalizer Prompt| L((Gemini API))
        H -.->|Detector Prompt| L
        I -.->|Analyst Prompt| L
        J -.->|Planner Prompt| L
        K -.->|Simulator Prompt| L
    end

    subgraph Output Telemetry Data
        K -->|Traffic, SMS & Dispatch Logs| M[High-Fidelity Offline Simulator fallback]
        M -->|Interactive Payload| E
    end

    Mobile Client --->|Fetch telemetry & preset scenarois| D
```

---

## Agent Pipeline

The CIRO orchestrator sequentially executes **5 specialized agents** to process raw data and simulate emergency response outcomes:

| Agent Tool | Role & Purpose | Input | Output | System Instruction Summary |
| :--- | :--- | :--- | :--- | :--- |
| **1. Signal Normalizer** | Ingests, parses, and cleans chaotic telemetry or social feeds, converting local Roman Urdu dialects into standard structured English telemetry. | Unstructured signal strings (social text, raw weather APIs, traffic speeds). | Structured normalized JSON array containing sources, extracted locations, urgency ranks, and event descriptions. | *Clean inputs, parse Roman Urdu idioms (e.g., "bohat paani hai"), extract locations, standardise timestamps, and output strictly formatted JSON.* |
| **2. Crisis Detector** | Aggregates normalized streams to determine if a severe urban emergency cluster is active. | Array of structured normalized signals. | Classification type, confidence rating (0.0 to 1.0), and core disaster explanation. | *Compare signal clusters to standard disaster categories (Flooding, Accidents, Gridlock, Heatwaves), calculate hazard confidence, and explain reasons.* |
| **3. Situation Analyst** | Estimates localized citizen threat boundaries, population risk sectors, and impact severity. | Detected crisis classification and location parameters. | Severity index (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), population threat description, and estimated stranded vehicle counts. | *Assess civic infrastructure limits, rank population danger indices, and output a concise situational awareness brief.* |
| **4. Action Planner** | Synthesizes the situation report to construct structured, prioritized deployment checklists. | Structured situation report from the analyst. | List of actions with categories (`TRAFFIC`, `EMERGENCY`, `ALERT`, `RESOURCE`), priority vectors (1-5), and estimated impacts. | *Formulate high-priority rescue actions, assign categories, and generate impact scores for each deployment.* |
| **5. Simulation Tool** | Models mock bypass routes and computes outcome score improvements after checks. | List of checked action plan mitigation items. | Alternative routing labels, dispatch tickets, dispatched SMS alerts, and before/after congestion comparison scores. | *Simulate bypass traffic channels, dispatch emergency team tasking, and predict overall percentage decreases in gridlock.* |

---

## Google Antigravity & ADK Integration

CIRO is fully orchestrated using the **Google Agent Development Kit (ADK / Antigravity)** design pattern. It enforces a strict declarative schema where agents are modeled as composite managers of modular, reusable tools:

* **Integrational Architecture**: The backend registers a top-level `ADKAgent` instance (`CIROOrchestrator`) inside [agentOrchestrator.js](file:///c:/Users/dell/OneDrive/Desktop/CIRO/server/orchestration/agentOrchestrator.js). Five individual `ADKTool` objects are registered to encapsulate the low-level model prompts.
* **Orchestration Execution**: When a client requests an evaluation at `/api/analyze`, the `CIROOrchestrator` runs its sequential pipeline loop. The output of each step is validated against input schemas and cascaded to downstream tools, collecting high-fidelity execution traces.
* **Where to See It in Action**:
  - **Pipeline Screen**: Tap "Run Analysis" on a scenario to watch the staggered progress bars visualising the sequential ADK pipeline executing step-by-step.
  - **Agent Trace Viewer**: After the analysis completes, tap **"View Agent Trace"** to open a full-screen developer trace modal. This displays exact token usages, execute durations (in ms), agent reasoning paths, and raw JSON payloads for all 5 ADK tools.

---

## Tech Stack

| Technology | Layer | Description / Purpose |
| :--- | :--- | :--- |
| **React Native (Expo)** | Mobile Client | Premium mobile dashboard compiled to iOS and Android. |
| **Zustand** | State Management | Centralized, synchronized application store. |
| **Reanimated** | Visuals / Motion | Premium smooth micro-animations and metric count-ups. |
| **Express (Node.js)** | Backend REST Server | High-performance API server managing the ADK pipeline. |
| **Google Generative AI** | Model Engine | Ingests complex prompts using the robust `gemini-1.5-pro` model. |
| **Google ADK** | Orchestrator Layer | Orchestrates five specialized tools into a single trace pipeline. |

---

## Setup Instructions

### Prerequisites
- Install **Node.js** (v18 or higher recommended)
- Install **Git**
- Ensure you have **Expo Go** installed on your Android/iOS mobile device (for local deployment)

### Environment Variables
Create a `.env` file in the `/server` directory:
```env
PORT=3000
GEMINI_API_KEY=your_gemini_api_key_here
```
*(If no API Key is provided, the backend automatically fails-safe to our robust offline high-fidelity mock generators so the application remains fully functional for presentation!)*

### Backend Setup
1. Open a terminal and navigate to the server folder:
   ```bash
   cd server
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Start the Express server:
   ```bash
   npm start
   ```
   *The console will print: `CIRO Backend Server running on http://localhost:3000`*

### Mobile Setup
1. Open a new terminal in the root project folder.
2. Install the Expo dependencies:
   ```bash
   npm install
   ```
3. Start the mobile packager:
   ```bash
   npx expo start
   ```
4. Scan the QR code using your **Expo Go** application (Android) or the native iOS Camera app to launch the high-fidelity UI!

---

## Presentation / Demo Guide

Follow these steps to deliver a high-impact demo for the judges:

1. **Active Live Telemetry**: Show the initial Home screen. Highlight the live statistics cards showing "Active Alerts", "Response Latency (ms)", and "Agents Online (5/5)".
2. **Scenario Selection**: Navigate to the **Scenarios** panel. Load **Scenario 1 (Urban Flooding — G-10 Islamabad)**. 
3. **Inspect Inputs**: Point out the Roman Urdu dialect inputs (e.g. *"Bohat paani jama hai road par, cars stranded!"*) showing how the normalizer parses colloquial text.
4. **Trigger ADK pipeline**: Tap **"Run Orchestrated Analysis"**. Walk the judges through the animated progress indicators as each of the 5 agents processes the data.
5. **Inspect Agent Trace**: Tap **"View Agent Trace"**. Point out the exact duration of each tool, token consumptions, and the reasoning chain generated by the model.
6. **Deploy Actions**: Navigate to the **Action Plan** tab. Check off the mitigation actions (e.g. *Deploy Rescue Teams, Divert Vehicles*).
7. **Simulate Sandbox**: Tap **"Simulate Actions"**. Show the map displaying animated pulse crisis markers, alternate blue bypass routes, and active dispatch vehicle targets.
8. **Show Outcomes**: View the comparison dashboard. Highlight the count-up indicators demonstrating a **67% decrease in congestion** and **73% response time improvement**!

---

## APIs & Tools Used
- **Gemini API (`gemini-1.5-pro`)**: Core reasoning engine.
- **Expo Location & Maps**: Generates interactive coordinate sandboxes.
- **Google ADK Framework**: Standardizes sequential tool cascading.

## Assumptions Made
- Assumes metropolitan sectors in Islamabad (G-10, F-10, Faizabad) behave as self-contained traffic routing cells.
- Assumes local first responders utilize SMS, FM radio, and digital dispatch tickets to coordinate.

## Known Limitations
- Offline mock fallback requires preset geographic coordinate ranges for alternate bypass polyline routes.
- Real-time map rendering requires web/mobile internet to fetch satellite tiling packages.
