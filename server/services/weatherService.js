/**
 * Weather Service for CIRO Live Platform
 * Integrates with Open-Meteo API (free, no API key required) to provide live coordinates-based
 * weather telemetries and flood risk thresholds for major Pakistani metropolitan sectors.
 */

// 1. Pakistani city coordinates mapping
const CITY_COORDS = {
  'islamabad': { lat: 33.6844, lng: 73.0479 },
  'rawalpindi': { lat: 33.5651, lng: 73.0169 },
  'lahore': { lat: 31.5204, lng: 74.3587 },
  'karachi': { lat: 24.8607, lng: 67.0011 },
  'peshawar': { lat: 34.0151, lng: 71.5249 },
  'g-10': { lat: 33.6938, lng: 73.0100 },
  'f-7': { lat: 33.7215, lng: 73.0596 },
  'g-9': { lat: 33.7001, lng: 73.0412 },
};

/**
 * Normalizes and finds coordinates for a given location name.
 * Defaults to Islamabad coordinates if unmatched.
 */
function findCoordinates(locationName) {
  if (!locationName) return { name: 'islamabad', coords: CITY_COORDS['islamabad'] };
  
  const normalized = locationName.toLowerCase().trim();
  
  // First look for exact match in keys
  if (CITY_COORDS[normalized]) {
    return { name: normalized, coords: CITY_COORDS[normalized] };
  }
  
  // Check if any key is a substring or vice versa
  for (const [key, value] of Object.entries(CITY_COORDS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return { name: key, coords: value };
    }
  }
  
  // Default to Islamabad coordinates
  return { name: 'islamabad (fallback)', coords: CITY_COORDS['islamabad'] };
}

/**
 * WMO Weather Codes Interpreter
 * Maps WMO weather codes 0-99 to human-readable weather descriptions.
 */
function interpretWeatherCode(code) {
  const codes = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Fog",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Dense freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow fall",
    73: "Moderate snow fall",
    75: "Heavy snow fall",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm: Slight or moderate",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail"
  };
  return codes[code] || `Unknown weather conditions (Code ${code})`;
}

/**
 * Calculates flood risk level from precipitation, humidity, and rain.
 * High flood risk: precipitation > 10mm OR rain > 5mm
 * Critical flood risk: precipitation > 20mm OR rain > 15mm
 */
function calculateFloodRisk(precipitation = 0, humidity = 0, rain = 0) {
  const p = Number(precipitation) || 0;
  const h = Number(humidity) || 0;
  const r = Number(rain) || 0;

  if (p > 20 || r > 15) {
    return 'critical';
  }
  if (p > 10 || r > 5) {
    return 'high';
  }
  if (p > 2 || r > 1 || (p > 0 && h > 85)) {
    return 'medium';
  }
  return 'low';
}

/**
 * Determines rain intensity level based on mm rate
 */
function calculateRainIntensity(rain = 0) {
  const r = Number(rain) || 0;
  if (r === 0) return 'none';
  if (r < 2) return 'light';
  if (r < 10) return 'moderate';
  if (r < 50) return 'heavy';
  return 'extreme';
}

/**
 * Fetches current weather from Open-Meteo API and normalizes it.
 */
async function getLiveWeather(locationName) {
  const { name: resolvedName, coords } = findCoordinates(locationName);
  
  const baseUrl = process.env.OPEN_METEO_BASE_URL || 'https://api.open-meteo.com/v1';
  const url = `${baseUrl}/forecast?latitude=${coords.lat}&longitude=${coords.lng}&current=temperature_2m,relative_humidity_2m,precipitation,rain,wind_speed_10m,wind_direction_10m,weather_code&hourly=precipitation_probability&forecast_days=1`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open-Meteo request failed with status: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const current = data.current || {};
    const temperature = current.temperature_2m ?? 0;
    const humidity = current.relative_humidity_2m ?? 0;
    const precipitation = current.precipitation ?? 0;
    const rain = current.rain ?? 0;
    const windSpeed = current.wind_speed_10m ?? 0;
    const windDirection = current.wind_direction_10m ?? 0;
    const weatherCode = current.weather_code ?? 0;
    
    const weatherDescription = interpretWeatherCode(weatherCode);
    const isRaining = rain > 0 || precipitation > 0;
    const rainIntensity = calculateRainIntensity(rain);
    const floodRisk = calculateFloodRisk(precipitation, humidity, rain);
    
    // Assign alert levels based on flood risks and severe weather triggers
    let alertLevel = 'none';
    if (floodRisk === 'critical' || [96, 99].includes(weatherCode)) {
      alertLevel = 'emergency';
    } else if (floodRisk === 'high' || [95, 65, 82].includes(weatherCode)) {
      alertLevel = 'warning';
    } else if (floodRisk === 'medium' || isRaining) {
      alertLevel = 'watch';
    }
    
    return {
      location: resolvedName.toUpperCase(),
      coordinates: coords,
      temperature,
      humidity,
      precipitation,
      rain,
      windSpeed,
      windDirection,
      weatherCode,
      weatherDescription,
      isRaining,
      rainIntensity,
      floodRisk,
      alertLevel,
      rawData: data
    };
  } catch (error) {
    console.error(`[WeatherService] Error fetching weather for ${locationName}:`, error);
    throw error;
  }
}

/**
 * Synthesizes active weather alerts for emergency orchestration boards.
 */
async function getWeatherAlerts(locationName) {
  try {
    const weather = await getLiveWeather(locationName);
    const alerts = [];
    
    if (weather.temperature >= 40) {
      alerts.push({
        type: 'HEATWAVE_WARNING',
        severity: 'extreme',
        message: `Extreme heatwave active in ${weather.location}. Current temperature is ${weather.temperature}°C. Stay hydrated and avoid outdoor labor.`,
        timestamp: new Date().toISOString()
      });
    }
    
    if (weather.floodRisk === 'critical') {
      alerts.push({
        type: 'FLASH_FLOOD_EMERGENCY',
        severity: 'extreme',
        message: `Critical urban flood emergency in ${weather.location}! Active rain is ${weather.rain}mm with a critical threat to basement structures and lower avenues.`,
        timestamp: new Date().toISOString()
      });
    } else if (weather.floodRisk === 'high') {
      alerts.push({
        type: 'FLASH_FLOOD_WARNING',
        severity: 'severe',
        message: `High risk of urban flooding in ${weather.location}. Precipitation: ${weather.precipitation}mm. Heavy surface ponding and gridlock expected.`,
        timestamp: new Date().toISOString()
      });
    } else if (weather.floodRisk === 'medium') {
      alerts.push({
        type: 'FLOOD_WATCH',
        severity: 'moderate',
        message: `Flood watch active for low-lying parts of ${weather.location}. Light/moderate rain detected.`,
        timestamp: new Date().toISOString()
      });
    }

    if ([95, 96, 99].includes(weather.weatherCode)) {
      alerts.push({
        type: 'SEVERE_THUNDERSTORM_WARNING',
        severity: 'severe',
        message: `Severe thunderstorm and potential localized lightning strikes detected in ${weather.location}.`,
        timestamp: new Date().toISOString()
      });
    }

    if (weather.windSpeed > 40) {
      alerts.push({
        type: 'HIGH_WIND_ADVISORY',
        severity: 'moderate',
        message: `High wind velocities of ${weather.windSpeed} km/h recorded in ${weather.location}.`,
        timestamp: new Date().toISOString()
      });
    }

    return alerts;
  } catch (error) {
    console.error(`[WeatherService] Failed to compile alerts for ${locationName}:`, error);
    return [];
  }
}

module.exports = {
  CITY_COORDS,
  getLiveWeather,
  interpretWeatherCode,
  calculateFloodRisk,
  getWeatherAlerts
};
