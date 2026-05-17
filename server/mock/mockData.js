/**
 * Mock Data Generators for Pakistani Cities (Islamabad/Rawalpindi)
 * Provides realistic weather, traffic, social signals and pre-configured scenarios.
 */

// 1. generateWeatherData(location)
function generateWeatherData(location = "G-10, Islamabad") {
  const loc = location.toLowerCase();
  
  if (loc.includes("rawalpindi") || loc.includes("pindi")) {
    // Let's mock a severe heatwave scenario
    return {
      location,
      temperature: 44,
      humidity: 15,
      rainfall: "none",
      rainfallMM: 0,
      alert: true,
      alertType: "HEATWAVE_WARNING",
      windSpeed: 8,
      visibility: "excellent"
    };
  } else if (loc.includes("f-7") || loc.includes("f7")) {
    // Normal clear weather
    return {
      location,
      temperature: 30,
      humidity: 45,
      rainfall: "none",
      rainfallMM: 0,
      alert: false,
      alertType: "NONE",
      windSpeed: 12,
      visibility: "good"
    };
  } else if (loc.includes("faizabad")) {
    // Light rain
    return {
      location,
      temperature: 25,
      humidity: 80,
      rainfall: "light",
      rainfallMM: 5,
      alert: false,
      alertType: "NONE",
      windSpeed: 15,
      visibility: "good"
    };
  } else {
    // G-10 / default: heavy rain scenario
    return {
      location,
      temperature: 24,
      humidity: 92,
      rainfall: "heavy",
      rainfallMM: 68,
      alert: true,
      alertType: "FLASH_FLOOD_WARNING",
      windSpeed: 32,
      visibility: "poor"
    };
  }
}

// 2. generateTrafficData(location)
function generateTrafficData(location = "G-10") {
  const loc = location.toLowerCase();

  if (loc.includes("faizabad")) {
    return {
      location,
      congestionScore: 10,
      avgSpeed: 2,
      incidents: [
        "Major multi-vehicle collision near Faizabad Interchange ramp",
        "Rawalpindi-Islamabad corridor completely gridlocked"
      ],
      alternateRoutes: ["Via IJP Road", "Via Stadium Road"],
      affectedVehicles: 850
    };
  } else if (loc.includes("f-7")) {
    return {
      location,
      congestionScore: 3,
      avgSpeed: 45,
      incidents: ["Minor traffic slow down near Safa Gold Mall"],
      alternateRoutes: ["Via Margalla Road"],
      affectedVehicles: 45
    };
  } else if (loc.includes("rawalpindi")) {
    return {
      location,
      congestionScore: 8,
      avgSpeed: 8,
      incidents: ["Heavy heat-induced engine breakdowns blocking Saddar Road"],
      alternateRoutes: ["Via Murree Road bypass"],
      affectedVehicles: 410
    };
  } else {
    // G-10 / default
    return {
      location,
      congestionScore: 9,
      avgSpeed: 4,
      incidents: [
        "Water logging blocking G-10 Markaz main avenue",
        "Stranded vehicles under G-10 underpass"
      ],
      alternateRoutes: ["Via Service Road West G-10", "Via Kashmir Highway Exit"],
      affectedVehicles: 340
    };
  }
}

// 3. generateSocialSignals(crisisType)
function generateSocialSignals(crisisType = "URBAN_FLOODING") {
  const type = crisisType.toUpperCase();

  switch (type) {
    case "URBAN_FLOODING":
      return [
        {
          source: "social",
          text: "Yaar G-10 double road poora doob chuka hai! Cars are literally floating near the service road. Avoid this area entirely!",
          timestamp: new Date().toISOString()
        },
        {
          source: "social",
          text: "Widespread flooding in G-10 markaz. Basement shops under 3 feet of water already. Police rescue boats kab aenge?",
          timestamp: new Date().toISOString()
        },
        {
          source: "social",
          text: "Pindi Islamabad rain is crazy today. Kashmir highway exit for G-10 block hai. Underpass is fully filled with rain water.",
          timestamp: new Date().toISOString()
        },
        {
          source: "social",
          text: "Faizabad se G-10 anay walay hazraat dhyaan dein, main roads are submerged, extreme traffic jam lag chuka hai.",
          timestamp: new Date().toISOString()
        }
      ];

    case "ACCIDENT":
      return [
        {
          source: "social",
          text: "Severe crash on Faizabad Interchange, looks like an oil tanker and 3 cars. Blockage is stretching back to Expressway.",
          timestamp: new Date().toISOString()
        },
        {
          source: "social",
          text: "Ajeeb mess hai Faizabad interchange pe. Massive crash. Ambulance and Rescue 1122 trying to reach, but traffic is choked completely.",
          timestamp: new Date().toISOString()
        },
        {
          source: "social",
          text: "Avoid Faizabad route right now! 30 mins ho gaye and my car hasn't moved an inch. Accident blocked the main exit flyover.",
          timestamp: new Date().toISOString()
        }
      ];

    case "HEATWAVE":
      return [
        {
          source: "social",
          text: "Rawalpindi is literally boiling! 45 degrees and absolute zero wind. Heat exhaust aur chakar aa rahe hain logon ko Saddar mein.",
          timestamp: new Date().toISOString()
        },
        {
          source: "social",
          text: "Water shortage in Rawalpindi combined with this extreme heat is pure torture. High alerts for heatstroke at hospitals.",
          timestamp: new Date().toISOString()
        },
        {
          source: "social",
          text: "Load shedding in Pindi is topping the heatwave. 6 hours straight no electricity. Heat index is dangerous.",
          timestamp: new Date().toISOString()
        }
      ];

    case "INFRASTRUCTURE_FAILURE":
      return [
        {
          source: "social",
          text: "Major power outage in F-7 sector. Safe Gold Mall running on huge generators, entire residential area is pitch black.",
          timestamp: new Date().toISOString()
        },
        {
          source: "social",
          text: "IESCO power grid failure near F-7. Heard a loud blast from transformer, whole sub-station is down.",
          timestamp: new Date().toISOString()
        },
        {
          source: "social",
          text: "F-7 main traffic signals also went dark. Sector internal power grid breakdown confirmed by IESCO help desk.",
          timestamp: new Date().toISOString()
        }
      ];

    default:
      return [
        {
          source: "social",
          text: "Weather is lovely today in Islamabad. Margalla Hills looking gorgeous after light breeze.",
          timestamp: new Date().toISOString()
        }
      ];
  }
}

// 4. getMockScenarios()
function getMockScenarios() {
  return [
    {
      id: "scenario-01",
      title: "Urban Flooding (G-10)",
      location: "G-10, Islamabad",
      crisisType: "URBAN_FLOODING",
      signals: [
        ...generateSocialSignals("URBAN_FLOODING"),
        {
          source: "weather",
          data: generateWeatherData("G-10, Islamabad"),
          timestamp: new Date().toISOString()
        },
        {
          source: "traffic",
          data: generateTrafficData("G-10"),
          timestamp: new Date().toISOString()
        }
      ]
    },
    {
      id: "scenario-02",
      title: "Road Accident (Faizabad Interchange)",
      location: "Faizabad Interchange, Islamabad/Rawalpindi",
      crisisType: "ACCIDENT",
      signals: [
        ...generateSocialSignals("ACCIDENT"),
        {
          source: "weather",
          data: generateWeatherData("Faizabad"),
          timestamp: new Date().toISOString()
        },
        {
          source: "traffic",
          data: generateTrafficData("Faizabad"),
          timestamp: new Date().toISOString()
        }
      ]
    },
    {
      id: "scenario-03",
      title: "Heatwave (Rawalpindi)",
      location: "Saddar, Rawalpindi",
      crisisType: "HEATWAVE",
      signals: [
        ...generateSocialSignals("HEATWAVE"),
        {
          source: "weather",
          data: generateWeatherData("Rawalpindi"),
          timestamp: new Date().toISOString()
        },
        {
          source: "traffic",
          data: generateTrafficData("Rawalpindi"),
          timestamp: new Date().toISOString()
        }
      ]
    },
    {
      id: "scenario-04",
      title: "Power Infrastructure Failure (F-7)",
      location: "F-7, Islamabad",
      crisisType: "INFRASTRUCTURE_FAILURE",
      signals: [
        ...generateSocialSignals("INFRASTRUCTURE_FAILURE"),
        {
          source: "weather",
          data: generateWeatherData("F-7, Islamabad"),
          timestamp: new Date().toISOString()
        },
        {
          source: "traffic",
          data: generateTrafficData("F-7"),
          timestamp: new Date().toISOString()
        }
      ]
    }
  ];
}

module.exports = {
  generateWeatherData,
  generateTrafficData,
  generateSocialSignals,
  getMockScenarios
};
