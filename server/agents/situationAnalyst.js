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
      model: 'gemini-1.5-pro',
      generationConfig: { responseMimeType: 'application/json' },
      systemInstruction: systemPrompt
    });

    const prompt = `Analyze this crisis: ${JSON.stringify(detectedCrisis)}`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error in Situation Analyst Agent:", error);
    throw new Error(`Situation Analyst agent failed: ${error.message}`);
  }
}

module.exports = { runSituationAnalyst };
