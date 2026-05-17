const { GoogleGenerativeAI } = require('@google/generative-ai');

// Ensure API key is configured
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || 'DUMMY_KEY');

const systemPrompt = `You are a signal normalization agent for the CIRO crisis system. 
You receive raw inputs from different sources (social media text, weather API data, traffic data). 
Your job is to parse, clean, and normalize all signals into a unified JSON format. 
Handle informal Urdu, English, or Roman Urdu text (e.g. "bohat paani hai", "g-10 block hai").
Extract: location, event description, source type, urgency indicators.

Output ONLY valid JSON matching this schema:
{
  "normalizedSignals": [
    {
      "source": "social" | "weather" | "traffic",
      "location": "extracted location or null",
      "description": "cleaned description in English",
      "rawSnippet": "original raw text or data snippet",
      "urgency": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
      "timestamp": "ISO timestamp or current if not provided"
    }
  ]
}`;

async function runSignalCollector(signals) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      // Return fallback stub if API key is not configured
      return {
        normalizedSignals: signals.map((s, idx) => ({
          source: s.type || 'unknown',
          location: s.location || 'G-10, Islamabad',
          description: s.text || JSON.stringify(s.data),
          rawSnippet: JSON.stringify(s),
          urgency: 'HIGH',
          timestamp: s.timestamp || new Date().toISOString()
        }))
      };
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      generationConfig: { responseMimeType: 'application/json' },
      systemInstruction: systemPrompt
    });

    const prompt = `Normalize the following raw signals: ${JSON.stringify(signals)}`;
    
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    return JSON.parse(responseText);
  } catch (error) {
    console.error("Error in Signal Collector Agent:", error);
    throw new Error(`Signal Collector agent failed: ${error.message}`);
  }
}

module.exports = { runSignalCollector };
