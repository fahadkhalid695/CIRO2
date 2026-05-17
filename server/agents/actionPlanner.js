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
    console.error("Error in Action Planner Agent:", error);
    throw new Error(`Action Planner agent failed: ${error.message}`);
  }
}

module.exports = { runActionPlanner };
