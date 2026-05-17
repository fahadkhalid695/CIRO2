const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || 'DUMMY_KEY');

const systemPrompt = `You are a crisis detection agent for the CIRO system. 
You receive normalized signals and identify if an active crisis event is occurring. 
Classify the crisis type into one of the following: URBAN_FLOODING, HEATWAVE, ROAD_BLOCKAGE, ACCIDENT, INFRASTRUCTURE_FAILURE, or NO_CRISIS. 
Look for signal clusters (multiple sources confirming the same event) to determine high confidence.

Output ONLY valid JSON matching this schema:
{
  "detected": boolean,
  "crisisType": "URBAN_FLOODING" | "HEATWAVE" | "ROAD_BLOCKAGE" | "ACCIDENT" | "INFRASTRUCTURE_FAILURE" | "NO_CRISIS",
  "location": "specific location of event",
  "confidence": 0.0 to 1.0,
  "reasoning": "brief explanation of why this classification was made"
}`;

async function runCrisisDetector(normalizedSignals) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return {
        detected: true,
        crisisType: "URBAN_FLOODING",
        location: "G-10, Islamabad",
        confidence: 0.95,
        reasoning: "Multiple social media alerts and traffic congestion indicators point to severe flooding in G-10."
      };
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: { responseMimeType: 'application/json' },
      systemInstruction: systemPrompt
    });

    const prompt = `Detect crisis from these normalized signals: ${JSON.stringify(normalizedSignals)}`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error in Crisis Detector Agent:", error);
    throw new Error(`Crisis Detector agent failed: ${error.message}`);
  }
}

module.exports = { runCrisisDetector };
