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
      model: 'gemini-1.5-pro',
      generationConfig: { responseMimeType: 'application/json' },
      systemInstruction: systemPrompt
    });

    const prompt = `Simulate outcomes for these response actions: ${JSON.stringify(actions)}`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error in Simulation Executor Agent:", error);
    throw new Error(`Simulation Executor agent failed: ${error.message}`);
  }
}

module.exports = { runSimulationExecutor };
