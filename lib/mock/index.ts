// Frontend Mock Scenarios and Telemetry Generators

export interface MockScenario {
  id: string;
  title: string;
  location: string;
  crisisType: string;
  icon: string;
  signals: Array<{
    type: 'social' | 'weather' | 'traffic';
    text?: string;
    data?: any;
    timestamp: string;
  }>;
}

export const MOCK_SCENARIOS: MockScenario[] = [
  {
    id: "scenario-01",
    title: "Urban Flooding",
    location: "G-10, Islamabad",
    crisisType: "URBAN_FLOODING",
    icon: "water-outline",
    signals: [
      { type: "social", text: "Yaar G-10 double road poora doob chuka hai! Avoid G-10 double road entirely!", timestamp: new Date().toISOString() },
      { type: "social", text: "Widespread flooding in G-10 markaz. Basement shops flooded.", timestamp: new Date().toISOString() },
      { type: "weather", data: { temperature: 24, rainfall: "heavy", rainfallMM: 68, alert: true, alertType: "FLASH_FLOOD_WARNING" }, timestamp: new Date().toISOString() },
      { type: "traffic", data: { congestionScore: 9, avgSpeed: 4, affectedVehicles: 340 }, timestamp: new Date().toISOString() }
    ]
  },
  {
    id: "scenario-02",
    title: "Road Accident",
    location: "Faizabad Interchange",
    crisisType: "ACCIDENT",
    icon: "car-sport-outline",
    signals: [
      { type: "social", text: "Severe crash on Faizabad Interchange flyover, traffic fully choked.", timestamp: new Date().toISOString() },
      { type: "social", text: "Avoid Faizabad route right now! Massive tailbacks starting on Expressway.", timestamp: new Date().toISOString() },
      { type: "weather", data: { temperature: 25, rainfall: "light", alert: false }, timestamp: new Date().toISOString() },
      { type: "traffic", data: { congestionScore: 10, avgSpeed: 2, affectedVehicles: 850 }, timestamp: new Date().toISOString() }
    ]
  },
  {
    id: "scenario-03",
    title: "Rawalpindi Heatwave",
    location: "Saddar, Rawalpindi",
    crisisType: "HEATWAVE",
    icon: "sunny-outline",
    signals: [
      { type: "social", text: "Rawalpindi is literally boiling! 44 degrees and Saddar area has bad load shedding.", timestamp: new Date().toISOString() },
      { type: "weather", data: { temperature: 44, humidity: 15, alert: true, alertType: "HEATWAVE_WARNING" }, timestamp: new Date().toISOString() },
      { type: "traffic", data: { congestionScore: 8, avgSpeed: 8, affectedVehicles: 410 }, timestamp: new Date().toISOString() }
    ]
  },
  {
    id: "scenario-04",
    title: "Power Grid Failure",
    location: "F-7, Islamabad",
    crisisType: "INFRASTRUCTURE_FAILURE",
    icon: "flash-off-outline",
    signals: [
      { type: "social", text: "Major power outage in F-7 sector, entire residential area is pitch black.", timestamp: new Date().toISOString() },
      { type: "social", text: "IESCO power grid failure near F-7 Markaz. Grid is down.", timestamp: new Date().toISOString() },
      { type: "weather", data: { temperature: 30, rainfall: "none", alert: false }, timestamp: new Date().toISOString() },
      { type: "traffic", data: { congestionScore: 3, avgSpeed: 45, affectedVehicles: 45 }, timestamp: new Date().toISOString() }
    ]
  }
];

export const generateMockData = () => {
  return MOCK_SCENARIOS;
};
