const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || 'DUMMY_KEY');

const systemPrompt = `You are a simulation executor agent for the CIRO system. 
Given the response action plan, simulate what would happen if each action was successfully executed. 
Generate highly realistic mock simulation data: updated mock routes, emergency tickets generated, sent alerts, and detailed system logs. 
Compare the overall system state parameters "before" and "after" the planned intervention.

Output ONLY valid JSON matching this schema:
{
  "simulatedRoutes": [
    {
      "name": "string e.g. F-10 Bypass Corridor",
      "status": "CLEAR" | "CONGESTED" | "BLOCKED",
      "congestionScore": number (0 to 10)
    }
  ],
  "emergencyTickets": [
    {
      "ticketId": "string e.g. TKT-2031",
      "subject": "string",
      "status": "OPEN" | "DISPATCHED" | "RESOLVED"
    }
  ],
  "sentAlerts": [
    {
      "channel": "SMS" | "RADIO" | "TV" | "APP",
      "message": "string",
      "audienceSize": number
    }
  ],
  "systemLogs": [
    {
      "time": "ISO timestamp",
      "level": "INFO" | "WARNING" | "CRITICAL",
      "message": "log description"
    }
  ],
  "outcome": {
    "before": {
      "congestionScore": number (0 to 10),
      "responseTime": "string e.g. 45 mins",
      "affectedVehicles": number
    },
    "after": {
      "congestionScore": number (0 to 10),
      "responseTime": "string e.g. 15 mins",
      "affectedVehicles": number
    }
  }
}`;

async function runSimulationExecutor(actions) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return {
        simulatedRoutes: [
          { name: "F-10 Corridor Bypass", status: "CLEAR", congestionScore: 2 },
          { name: "G-10 Inner Ring Road", status: "CONGESTED", congestionScore: 7 }
        ],
        emergencyTickets: [
          { ticketId: "TKT-1029", subject: "Deploy Rescue Boat to G-10/4", status: "DISPATCHED" },
          { ticketId: "TKT-1030", subject: "Route Diversion setup on Kashmir Highway", status: "RESOLVED" }
        ],
        sentAlerts: [
          { channel: "SMS", message: "URGENT: Flash flooding in G-10. Safe route open through F-10.", audienceSize: 4500 }
        ],
        systemLogs: [
          { time: new Date().toISOString(), level: "INFO", message: "Action simulation active." },
          { time: new Date().toISOString(), level: "INFO", message: "Traffic flow re-routing projection calculated." }
        ],
        outcome: {
          before: { congestionScore: 9, responseTime: "45 mins", affectedVehicles: 300 },
          after: { congestionScore: 4, responseTime: "12 mins", affectedVehicles: 40 }
        }
      };
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' },
      systemInstruction: systemPrompt
    });

    const prompt = `Simulate outcomes for these response actions: ${JSON.stringify(actions)}`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    return JSON.parse(responseText);
  } catch (error) {
    console.warn("Simulation Executor Agent API error, using high-fidelity fallback:", error.message);
    const actionText = JSON.stringify(actions).toLowerCase();

    if (actionText.includes("accident") || actionText.includes("spill") || actionText.includes("faizabad")) {
      return {
        simulatedRoutes: [
          { name: "IJP Bypass Road Corridor", status: "CLEAR", congestionScore: 3 },
          { name: "Expressway North Interchange", status: "BLOCKED", congestionScore: 9 }
        ],
        emergencyTickets: [
          { ticketId: "TKT-3010", subject: "Mobilize specialized chemical foam to Faizabad flyover", status: "DISPATCHED" },
          { ticketId: "TKT-3011", subject: "Construct physical dividers at Kashmir Cloverleaf", status: "RESOLVED" }
        ],
        sentAlerts: [
          { channel: "SMS", message: "TRAFFIC ADVISORY: Faizabad Interchange flyover blocked due to collision. Seek bypass via IJP road.", audienceSize: 12000 }
        ],
        systemLogs: [
          { time: new Date().toISOString(), level: "INFO", message: "Faizabad simulation active." },
          { time: new Date().toISOString(), level: "INFO", message: "Traffic diverted via IJP road, resolving Expressway backlog." }
        ],
        outcome: {
          before: { congestionScore: 9, responseTime: "38 mins", affectedVehicles: 480 },
          after: { congestionScore: 3, responseTime: "11 mins", affectedVehicles: 30 }
        }
      };
    } else if (actionText.includes("heat") || actionText.includes("hydration")) {
      return {
        simulatedRoutes: [
          { name: "Saddar Murree Highway Corridor", status: "CLEAR", congestionScore: 4 },
          { name: "Commercial Market Road", status: "CONGESTED", congestionScore: 6 }
        ],
        emergencyTickets: [
          { ticketId: "TKT-3020", subject: "Install emergency hydration camps near Saddar commercial", status: "DISPATCHED" },
          { ticketId: "TKT-3021", subject: "IESCO Hospital feeder prioritization loop lock", status: "RESOLVED" }
        ],
        sentAlerts: [
          { channel: "SMS", message: "HEAT ADVISORY: Extreme temperature active. Public hydration camps established at Saddar and Murree terminal.", audienceSize: 22000 }
        ],
        systemLogs: [
          { time: new Date().toISOString(), level: "INFO", message: "Heatwave simulation projection active." },
          { time: new Date().toISOString(), level: "INFO", message: "Hydration center deployment pre-notified, reducing medical admissions." }
        ],
        outcome: {
          before: { congestionScore: 6, responseTime: "24 mins", affectedVehicles: 150 },
          after: { congestionScore: 2, responseTime: "8 mins", affectedVehicles: 10 }
        }
      };
    }

    return {
      simulatedRoutes: [
        { name: "F-10 Corridor Bypass", status: "CLEAR", congestionScore: 2 },
        { name: "G-10 Inner Ring Road", status: "CONGESTED", congestionScore: 7 }
      ],
      emergencyTickets: [
        { ticketId: "TKT-1029", subject: "Deploy Rescue Boat to G-10/4", status: "DISPATCHED" },
        { ticketId: "TKT-1030", subject: "Route Diversion setup on Kashmir Highway", status: "RESOLVED" }
      ],
      sentAlerts: [
        { channel: "SMS", message: "URGENT: Flash flooding in G-10. Safe route open through F-10.", audienceSize: 4500 }
      ],
      systemLogs: [
        { time: new Date().toISOString(), level: "INFO", message: "Action simulation active." },
        { time: new Date().toISOString(), level: "INFO", message: "Traffic flow re-routing projection calculated." }
      ],
      outcome: {
        before: { congestionScore: 9, responseTime: "45 mins", affectedVehicles: 300 },
        after: { congestionScore: 4, responseTime: "12 mins", affectedVehicles: 40 }
      }
    };
  }
}

module.exports = { runSimulationExecutor };
