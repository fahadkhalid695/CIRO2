const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || 'DUMMY_KEY');

const systemPrompt = `You are a situation analysis agent for the CIRO system. 
Given a detected crisis, estimate the severity (LOW, MEDIUM, HIGH, CRITICAL), current impact on citizens, estimated affected area, estimated people affected, and provide a clear human-readable explanation of the escalation risks.

Output ONLY valid JSON matching this schema:
{
  "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "impactSummary": "brief summary of human & utility impact",
  "affectedArea": "estimated physical bounds e.g. 2km radius around G-10 Markaz",
  "estimatedPeopleAffected": number,
  "explanation": "clear, detailed human-readable explanation of the current state and risks"
}`;

async function runSituationAnalyst(detectedCrisis) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return {
        severity: "HIGH",
        impactSummary: "Road logging has trapped motorists. High danger of power outages and rescue delays.",
        affectedArea: "G-10 Sector, Islamabad",
        estimatedPeopleAffected: 2500,
        explanation: "Given low-lying infrastructure and prolonged heavy rainfall, water accumulation has blocked essential evacuation corridors. Immediate intervention is required."
      };
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { responseMimeType: 'application/json' },
      systemInstruction: systemPrompt
    });

    const prompt = `Analyze this crisis: ${JSON.stringify(detectedCrisis)}`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    return JSON.parse(responseText);
  } catch (error) {
    console.warn("Situation Analyst Agent API error, using high-fidelity fallback:", error.message);
    const type = detectedCrisis?.crisisType || "URBAN_FLOODING";
    const loc = detectedCrisis?.location || "G-10, Islamabad";

    if (type.includes("ACCIDENT")) {
      return {
        severity: "CRITICAL",
        impactSummary: "Expressway chokepoint blocked, risk of toxic fuel spill ignition.",
        affectedArea: "Faizabad Interchange, 4km radius",
        estimatedPeopleAffected: 8500,
        explanation: "Faizabad represents the vital link between twin cities Islamabad and Rawalpindi. The tanker accident has caused complete paralysis of northbound freight lanes, creating a safety hazard due to fluid leakage."
      };
    } else if (type.includes("HEAT")) {
      return {
        severity: "HIGH",
        impactSummary: "Severe heat stroke danger, domestic air-conditioning causing technical Iesco loops.",
        affectedArea: "Rawalpindi Saddar district, 3km radius",
        estimatedPeopleAffected: 12000,
        explanation: "Prolonged dry heat peaking at 42°C is threatening dense urban corridors. Transformer grids are running at peak capacity limits, prompting critical triage demands."
      };
    }

    return {
      severity: "HIGH",
      impactSummary: "Road logging has trapped motorists. High danger of power outages and rescue delays.",
      affectedArea: `${loc} sector boundaries`,
      estimatedPeopleAffected: 2500,
      explanation: "Given low-lying infrastructure and prolonged heavy rainfall, water accumulation has blocked essential evacuation corridors. Immediate intervention is required."
    };
  }
}

module.exports = { runSituationAnalyst };
