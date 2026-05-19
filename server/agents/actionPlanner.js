const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || 'DUMMY_KEY');

const systemPrompt = `You are an emergency response action planner for Pakistani metropolitan areas (like Islamabad, Karachi, Lahore). 
Given a confirmed crisis, generate a coordinated response plan with specific, realistic actions for: traffic management (e.g. diverting via alternate routes like F-10 or G-9), emergency services dispatch (Rescue 1122, fire brigade), public alerts (SMS broadcast), resource allocation (boats, medical camps).

Return exactly this JSON:
{
  "actions": [
    {
      "id": "action_uuid_or_short_string",
      "category": "TRAFFIC" | "EMERGENCY" | "ALERT" | "RESOURCE",
      "priority": number (1 to 5, where 5 is highest),
      "title": "short title of action",
      "description": "detailed actionable description",
      "estimatedImpact": "expected result of executing this action"
    }
  ]
}`;

async function runActionPlanner(analysis) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return {
        actions: [
          { id: "act-01", category: "EMERGENCY", priority: 5, title: "Rescue 1122 Boat Deployment", description: "Deploy 3 inflatable motorized boats to low-lying residential sectors of G-10.", estimatedImpact: "Rescues stranded civilians in deep-water logging zones." },
          { id: "act-02", category: "TRAFFIC", priority: 4, title: "Traffic Diversion F-10 Corridor", description: "Divert all traffic heading to G-10 Markaz via F-10 Double Road.", estimatedImpact: "Alleviates vehicular congestion and prevents further trap zones." },
          { id: "act-03", category: "ALERT", priority: 5, title: "SMS Broadcast Alert", description: "Trigger localized cellular broadcast emergency alerts to all G-10 devices.", estimatedImpact: "Instructs residents to seek high-ground and avoid travel." }
        ]
      };
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: { responseMimeType: 'application/json' },
      systemInstruction: systemPrompt
    });

    const prompt = `Plan action response for this analysis context: ${JSON.stringify(analysis)}`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    return JSON.parse(responseText);
  } catch (error) {
    console.warn("Action Planner Agent API error, using high-fidelity fallback:", error.message);
    const text = JSON.stringify(analysis).toLowerCase();

    if (text.includes("accident") || text.includes("faizabad")) {
      return {
        actions: [
          { id: "act-01", category: "EMERGENCY", priority: 5, title: "Rescue 1122 spill containment", description: "Deploy chemical spill mitigation crews to Faizabad cloverleaf northbound lanes.", estimatedImpact: "Prevents volatile fuel ignition risk." },
          { id: "act-02", category: "TRAFFIC", priority: 5, title: "IJP Road Bypass diversion", description: "Islamabad Traffic Police (ITP) hard blockades redirecting incoming traffic via IJP road corridor.", estimatedImpact: "Alleviates 4km congestion backup on the Expressway." },
          { id: "act-03", category: "ALERT", priority: 4, title: "Radio/Cellular advisories", description: "Broadcast live traffic diversions on FM 93 and localized mobile nodes.", estimatedImpact: "Informs twin-city commuters before exit points." }
        ]
      };
    } else if (text.includes("heat") || text.includes("temp")) {
      return {
        actions: [
          { id: "act-01", category: "RESOURCE", priority: 5, title: "Hydration center deployment", description: "Establish shade and hydration shelter camps near Saddar commercial avenues.", estimatedImpact: "Treats active heat exhaustion symptoms." },
          { id: "act-02", category: "EMERGENCY", priority: 5, title: "IESCO power prioritization", description: "Establish hard grid line supply to critical hospitals, avoiding manual loads.", estimatedImpact: "Maintains hospital cooling systems operational." },
          { id: "act-03", category: "ALERT", priority: 4, title: "Heat safety alerts", description: "Send SMS alerts advising citizens to stay indoors and hydrated.", estimatedImpact: "Reduces outdoor exposure numbers." }
        ]
      };
    }

    return {
      actions: [
        { id: "act-01", category: "EMERGENCY", priority: 5, title: "Rescue 1122 Boat Deployment", description: "Deploy 3 inflatable motorized boats to low-lying residential sectors of G-10.", estimatedImpact: "Rescues stranded civilians in deep-water logging zones." },
        { id: "act-02", category: "TRAFFIC", priority: 4, title: "Traffic Diversion F-10 Corridor", description: "Divert all traffic heading to G-10 Markaz via F-10 Double Road.", estimatedImpact: "Alleviates vehicular congestion and prevents further trap zones." },
        { id: "act-03", category: "ALERT", priority: 5, title: "SMS Broadcast Alert", description: "Trigger localized cellular broadcast emergency alerts to all G-10 devices.", estimatedImpact: "Instructs residents to seek high-ground and avoid travel." }
      ]
    };
  }
}

module.exports = { runActionPlanner };
