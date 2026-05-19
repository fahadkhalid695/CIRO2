module.exports = {
  anthropic: { apiKey: process.env.ANTHROPIC_API_KEY, model: 'claude-opus-4-5' },
  gemini: { apiKey: process.env.GEMINI_API_KEY, model: 'gemini-2.0-flash' },
  googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY },
  openMeteo: { baseUrl: process.env.OPEN_METEO_BASE_URL },
  firebase: { serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH }
}
