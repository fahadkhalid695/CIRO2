export interface PresetScenario {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  iconName: string;
  signals: Array<{
    id: string;
    type: 'social' | 'weather' | 'traffic';
    text?: string;
    data?: any;
    timestamp: string;
  }>;
  precomputedSession: {
    sessionId: string;
    timestamp: string;
    location: string;
    crisisType: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    explanation: string;
    actions: Array<{
      id: string;
      category: 'TRAFFIC' | 'EMERGENCY' | 'ALERT' | 'RESOURCE';
      priority: number;
      title: string;
      description: string;
      estimatedImpact: string;
      simulated: boolean;
    }>;
    simulation: {
      simulatedRoutes: string[];
      emergencyTickets: string[];
      sentAlerts: string[];
      systemLogs: Array<{ time: string; message: string; level?: string }>;
      outcome: {
        before: { congestionScore: number; responseTime: string; affectedVehicles: number };
        after: { congestionScore: number; responseTime: string; affectedVehicles: number };
      };
    };
    outcome: {
      before: { congestionScore: number; responseTime: string; affectedVehicles: number };
      after: { congestionScore: number; responseTime: string; affectedVehicles: number };
    };
    agentTrace: Array<{
      agent: string;
      status: 'pending' | 'running' | 'completed' | 'error';
      timestamp: string;
      completedAt?: string;
      durationMs?: number;
      metadata?: {
        adkTool: string;
        adkInput: any;
        adkOutput: any;
      };
    }>;
  };
}

export const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'scen-flooding',
    title: 'Urban Flooding',
    subtitle: 'Flash flood blocking main sectors',
    location: 'G-10, Islamabad',
    iconName: 'water-outline',
    signals: [
      {
        id: 'sig-f1',
        type: 'social',
        text: 'G-10 double road poora pani se bhar gya hai, gaariyan phansi hui hain aur engine band ho rha hai sabka. Alert emergency rescue needed!',
        timestamp: new Date().toISOString()
      },
      {
        id: 'sig-f2',
        type: 'social',
        text: 'Massive water log near G-10 Markaz. Cars floating, local drainage completely choked. Avoid this route!',
        timestamp: new Date().toISOString()
      },
      {
        id: 'sig-f3',
        type: 'weather',
        data: { rainfall: 'extreme', temp: 24, humidity: 95, alert: 'Red Alert Heavy Monsoon Blast' },
        timestamp: new Date().toISOString()
      }
    ],
    precomputedSession: {
      sessionId: 'session-flood-demo',
      timestamp: new Date().toISOString(),
      location: 'G-10, Islamabad',
      crisisType: 'URBAN_FLOODING',
      severity: 'HIGH',
      explanation: 'Continuous extreme cloudburst (rainfall exceeding 85mm/hr) has choked the critical storm-water drains of G-10 Sector, Islamabad. The main double avenue is completely submerged under 3.5 feet of water, stalling over 340 commuter vehicles. The local civilian response units (Rescue 1122) must deploy immediately via specialized high-clearance bypass channels to secure stranded individuals and pump out accumulated flash pools.',
      actions: [
        {
          id: 'flood-act-1',
          category: 'EMERGENCY',
          priority: 1,
          title: 'Rescue 1122 Specialized Boat Dispatch',
          description: 'Deploy 4 inflatable rescue hulls to G-10 Markaz corridor to secure stranded school vans and fainted commuters.',
          estimatedImpact: 'Rescues 15+ families within 15 mins.',
          simulated: false
        },
        {
          id: 'flood-act-2',
          category: 'TRAFFIC',
          priority: 2,
          title: 'Srinagar Highway Alternate Diversion',
          description: 'Re-route all inbound traffic from Peshawar Mor towards G-11 Kashmir Highway bypass to clear access channels.',
          estimatedImpact: 'Reduces G-10 choke density by 75%.',
          simulated: false
        },
        {
          id: 'flood-act-3',
          category: 'ALERT',
          priority: 3,
          title: 'SMS Warning Sector Cell Blast',
          description: 'Broadcast urgent SMS warning alerts to all active IMSI SIM logs registered to cellular towers near Sector G-10.',
          estimatedImpact: 'Prevents 100+ commuter entries into active water zones.',
          simulated: false
        },
        {
          id: 'flood-act-4',
          category: 'RESOURCE',
          priority: 4,
          title: 'CDA Drainage De-watering Pumps Deployment',
          description: 'Deploy 3 diesel-powered heavy water extraction pumps to lower pool heights on G-10 Markaz intersections.',
          estimatedImpact: 'Drains flood waters 3x faster, restoring asphalt lanes.',
          simulated: false
        }
      ],
      simulation: {
        simulatedRoutes: [
          'G-10 Main Avenue (BLOCKED - 3.5ft water pools)',
          'Srinagar Highway Bypass (CLEAR - Congestion score 2/10)',
          'Sector G-11 Outer Ring road (ALERT - Minor congestion 4/10)'
        ],
        emergencyTickets: [
          'R1122-1089: 4 Rescue Boat Units [DISPATCHED] to G-10 Markaz',
          'CDA-9020: 3 Heavy Dewatering Pumps [ACTIVE] on main double avenue'
        ],
        sentAlerts: [
          '[CIRO ALERT] Flash flooding in Sector G-10, Islamabad. Avoid G-10 Markaz road. श्रीनगर हाईवे, कश्मीर हाईवे alternates clear.'
        ],
        systemLogs: [
          { time: new Date().toISOString(), message: 'Signal Normalizer cleanup completed. Urdu mix parsed into unified signals block.', level: 'INFO' },
          { time: new Date().toISOString(), message: 'Crisis Detector flagged confidence 0.94 score for category URBAN_FLOODING.', level: 'WARNING' },
          { time: new Date().toISOString(), message: 'Situation Analyst mapped 340 vehicles inside critical boundary of G-10 sector.', level: 'CRITICAL' },
          { time: new Date().toISOString(), message: 'Action Planner compiled 4 responsive coordination blocks.', level: 'INFO' },
          { time: new Date().toISOString(), message: 'Simulation Executor verified Srinagar Highway bypass corridor congestion reduction.', level: 'INFO' }
        ],
        outcome: {
          before: { congestionScore: 9, responseTime: '18 min', affectedVehicles: 340 },
          after: { congestionScore: 4, responseTime: '7 min', affectedVehicles: 95 }
        }
      },
      outcome: {
        before: { congestionScore: 9, responseTime: '18 min', affectedVehicles: 340 },
        after: { congestionScore: 4, responseTime: '7 min', affectedVehicles: 95 }
      },
      agentTrace: [
        {
          agent: 'Signal Collector',
          status: 'completed',
          timestamp: new Date().toISOString(),
          durationMs: 145,
          metadata: {
            adkTool: 'signalNormalizationTool',
            adkInput: 'Raw user reports: "G-10 double road poora pani se bhar gya hai..."',
            adkOutput: { normalizedSignals: [{ type: 'social', severity: 'HIGH', area: 'G-10, Islamabad' }] }
          }
        },
        {
          agent: 'Crisis Detector',
          status: 'completed',
          timestamp: new Date().toISOString(),
          durationMs: 312,
          metadata: {
            adkTool: 'crisisDetectionTool',
            adkInput: 'Normalized signals array',
            adkOutput: { crisisType: 'URBAN_FLOODING', location: 'G-10, Islamabad', confidence: 0.94 }
          }
        },
        {
          agent: 'Situation Analyst',
          status: 'completed',
          timestamp: new Date().toISOString(),
          durationMs: 220,
          metadata: {
            adkTool: 'situationAnalysisTool',
            adkInput: 'Crisis type: URBAN_FLOODING, location G-10',
            adkOutput: { severity: 'HIGH', explanation: 'Cloudburst choked drains, submerging roads and halting 340 cars.' }
          }
        },
        {
          agent: 'Action Planner',
          status: 'completed',
          timestamp: new Date().toISOString(),
          durationMs: 410,
          metadata: {
            adkTool: 'actionPlanningTool',
            adkInput: 'Severity HIGH, G-10 Situation Brief',
            adkOutput: { actionsCount: 4, priorities: ['P1', 'P2', 'P3', 'P4'] }
          }
        },
        {
          agent: 'Simulation Executor',
          status: 'completed',
          timestamp: new Date().toISOString(),
          durationMs: 290,
          metadata: {
            adkTool: 'simulationTool',
            adkInput: '4 Structured response actions',
            adkOutput: { beforeScore: 9, afterScore: 4, speedupPercent: 67 }
          }
        }
      ]
    }
  },
  {
    id: 'scen-accident',
    title: 'Road Accident',
    subtitle: 'Multi-vehicle collision on junction',
    location: 'Faizabad Interchange',
    iconName: 'car-outline',
    signals: [
      {
        id: 'sig-a1',
        type: 'social',
        text: 'Major crash at Faizabad interchange! Truck collapsed over 2 passenger sedans. Srinagar link road fully blocked, long queues forming.',
        timestamp: new Date().toISOString()
      },
      {
        id: 'sig-a2',
        type: 'traffic',
        data: { congestion: 8, avgSpeed: 8, vehiclesAffected: 210 },
        timestamp: new Date().toISOString()
      }
    ],
    precomputedSession: {
      sessionId: 'session-accident-demo',
      timestamp: new Date().toISOString(),
      location: 'Faizabad Interchange',
      crisisType: 'ACCIDENT',
      severity: 'HIGH',
      explanation: 'A freight truck collision on the main Srinagar Highway ramp towards Murree Road at Faizabad Interchange has completely blocked the double lane. Two passenger sedans are pinned. Traffic tailback has reached Srinagar highway expressway with over 210 stranded vehicles, crippling the twin-city transit corridor.',
      actions: [
        {
          id: 'acc-act-1',
          category: 'EMERGENCY',
          priority: 1,
          title: 'Heavy Wrecker Crane Dispatch',
          description: 'Deploy Islamabad Traffic Police heavy wreckers to Faizabad flyover to safely lift and clear the collapsed truck carrier.',
          estimatedImpact: 'Clears blocked lanes in under 18 mins.',
          simulated: false
        },
        {
          id: 'acc-act-2',
          category: 'RESOURCE',
          priority: 1,
          title: 'Emergency Medical Trauma Ambulance Dispatch',
          description: 'Deploy 2 Rescue 1122 and 1 PIMS hospital ambulance teams with trauma stabilization modules to secure the pinned vehicle passengers.',
          estimatedImpact: 'Secures critical injuries transit inside golden hour.',
          simulated: false
        },
        {
          id: 'acc-act-3',
          category: 'TRAFFIC',
          priority: 2,
          title: 'IJP Road Corridor Bypass Divert',
          description: 'Redirect incoming Pindi traffic at Faizabad loop to alternative IJP Road avenues to avoid Murree Road bridge congestion.',
          estimatedImpact: 'Re-routes 140+ vehicles away from junction point.',
          simulated: false
        }
      ],
      simulation: {
        simulatedRoutes: [
          'Faizabad Main Ramp (BLOCKED - Collapsed cargo truck)',
          'IJP Road Alternate corridor (CLEAR - Smooth flow 3/10)',
          'Murree Road Loop bypass (CONGESTED - Slow queues 6/10)'
        ],
        emergencyTickets: [
          'ITP-2018: Heavy Wrecker Crane [DISPATCHED] to Faizabad Interchange',
          'R1122-8092: 3 Ambulance Trauma units [ARRIVED] on junction scene'
        ],
        sentAlerts: [
          '[TRAFFIC ALERT] Major multi-vehicle accident at Faizabad Interchange Murree Road ramp. Srinagar highway traffic redirected via IJP road.'
        ],
        systemLogs: [
          { time: new Date().toISOString(), message: 'Social complaints parsed: Faizabad interchange crash confirmed.', level: 'INFO' },
          { time: new Date().toISOString(), message: 'Crisis Detector isolated major ACCIDENT and ROAD_BLOCKAGE cluster.', level: 'WARNING' },
          { time: new Date().toISOString(), message: 'Situation Analyst mapped Faizabad corridor, marking high risk level.', level: 'CRITICAL' },
          { time: new Date().toISOString(), message: 'Action Planner compiled 3 emergency response actions.', level: 'INFO' },
          { time: new Date().toISOString(), message: 'Simulation Executor verified bypass alternate loops cleared traffic blocks.', level: 'INFO' }
        ],
        outcome: {
          before: { congestionScore: 8, responseTime: '22 min', affectedVehicles: 210 },
          after: { congestionScore: 3, responseTime: '6 min', affectedVehicles: 45 }
        }
      },
      outcome: {
        before: { congestionScore: 8, responseTime: '22 min', affectedVehicles: 210 },
        after: { congestionScore: 3, responseTime: '6 min', affectedVehicles: 45 }
      },
      agentTrace: [
        {
          agent: 'Signal Collector',
          status: 'completed',
          timestamp: new Date().toISOString(),
          durationMs: 112,
          metadata: {
            adkTool: 'signalNormalizationTool',
            adkInput: 'Raw crash posts at Faizabad Interchange',
            adkOutput: { normalizedSignals: [{ type: 'social', location: 'Faizabad Interchange' }] }
          }
        },
        {
          agent: 'Crisis Detector',
          status: 'completed',
          timestamp: new Date().toISOString(),
          durationMs: 218,
          metadata: {
            adkTool: 'crisisDetectionTool',
            adkInput: 'Faizabad normalized signals',
            adkOutput: { crisisType: 'ACCIDENT', location: 'Faizabad Interchange', confidence: 0.89 }
          }
        },
        {
          agent: 'Situation Analyst',
          status: 'completed',
          timestamp: new Date().toISOString(),
          durationMs: 185,
          metadata: {
            adkTool: 'situationAnalysisTool',
            adkInput: 'Crisis details Faizabad accident',
            adkOutput: { severity: 'HIGH', explanation: 'Freight truck collapse has choked Murree Road ramp, blocking 210 cars.' }
          }
        },
        {
          agent: 'Action Planner',
          status: 'completed',
          timestamp: new Date().toISOString(),
          durationMs: 382,
          metadata: {
            adkTool: 'actionPlanningTool',
            adkInput: 'Faizabad crisis state',
            adkOutput: { actionsCount: 3, priorities: ['P1', 'P1', 'P2'] }
          }
        },
        {
          agent: 'Simulation Executor',
          status: 'completed',
          timestamp: new Date().toISOString(),
          durationMs: 250,
          metadata: {
            adkTool: 'simulationTool',
            adkInput: '3 accident clear tasks',
            adkOutput: { beforeScore: 8, afterScore: 3, speedupPercent: 72 }
          }
        }
      ]
    }
  },
  {
    id: 'scen-heatwave',
    title: 'Extreme Heatwave',
    subtitle: 'Critical heat index spikes',
    location: 'Saddar, Rawalpindi',
    iconName: 'sunny-outline',
    signals: [
      {
        id: 'sig-h1',
        type: 'social',
        text: 'Bohot extreme garmi hai Saddar Bazar me, 2-3 log behosh ho gaye hain dhoop me khare khare. Safe zones needed ASAP.',
        timestamp: new Date().toISOString()
      },
      {
        id: 'sig-h2',
        type: 'weather',
        data: { temp: 48, humidity: 30, alert: 'Red Heatwave Extreme Index Alert' },
        timestamp: new Date().toISOString()
      }
    ],
    precomputedSession: {
      sessionId: 'session-heatwave-demo',
      timestamp: new Date().toISOString(),
      location: 'Saddar, Rawalpindi',
      crisisType: 'HEATWAVE',
      severity: 'CRITICAL',
      explanation: 'Saddar Rawalpindi is facing extreme thermal hazards with direct dry winds elevating temperatures to 48°C (real-feel index exceeding 52°C). High public congestion in outdoor markets has resulted in multiple cases of heat exhaustion, dehydration, and fainting. Immediate deployment of cold hydration centers and public alerts are required.',
      actions: [
        {
          id: 'heat-act-1',
          category: 'EMERGENCY',
          priority: 1,
          title: 'Hydration & Cooling Safe-Zone Setup',
          description: 'Erect 4 air-conditioned dome cooling shelters in main bazaar parking sectors with ice water, ORS hydration packs, and first-aid kits.',
          estimatedImpact: 'Mitigates heat exhaustion for 500+ bazaar visitors.',
          simulated: false
        },
        {
          id: 'heat-act-2',
          category: 'ALERT',
          priority: 1,
          title: 'Public Thermal Warning SMS blast',
          description: 'Dispatch localized alerts advising residents to avoid direct sunlight between 11 AM - 4 PM and maintain hydration.',
          estimatedImpact: 'Reduces outdoor market attendance by 45%.',
          simulated: false
        },
        {
          id: 'heat-act-3',
          category: 'RESOURCE',
          priority: 2,
          title: 'Mobile Cooling Van Patrol',
          description: 'Deploy 2 air-cooled paramedic patrol vans equipped with cooling sheets and emergency saline drips around commercial avenues.',
          estimatedImpact: 'Reduces ambulance transit time for heat casualties to 3 mins.',
          simulated: false
        }
      ],
      simulation: {
        simulatedRoutes: [
          'Saddar Bazar (OPEN - Moderate traffic score 4/10)',
          'Main cooling shelter pathways (CLEAR - Emergency access designated)'
        ],
        emergencyTickets: [
          'R1122-4091: 4 Cooling Safe Domes [ESTABLISHED] in Saddar Pindi',
          'DHQ-3029: 2 Thermal Emergency vans [ACTIVE] on bazaar loops'
        ],
        sentAlerts: [
          '[Urgnet Heatwave Alert] Rawalpindi temperature peaked 48°C. Cooling safe shelters established in main Saddar Markaz. Maintain ORS hydration.'
        ],
        systemLogs: [
          { time: new Date().toISOString(), message: 'Urdu posts parsed: Heat exhaustion confirmed Saddar.', level: 'INFO' },
          { time: new Date().toISOString(), message: 'Crisis Detector detected extreme HEATWAVE, score 0.91.', level: 'WARNING' },
          { time: new Date().toISOString(), message: 'Situation Analyst flagged CRITICAL rank based on 48C thermal sensor index.', level: 'CRITICAL' },
          { time: new Date().toISOString(), message: 'Action Planner drafted 3 quick relief cooling coordinates.', level: 'INFO' },
          { time: new Date().toISOString(), message: 'Simulation Executor verified hydration points lower heat sickness index.', level: 'INFO' }
        ],
        outcome: {
          before: { congestionScore: 3, responseTime: '15 min', affectedVehicles: 80 },
          after: { congestionScore: 1, responseTime: '3 min', affectedVehicles: 5 }
        }
      },
      outcome: {
        before: { congestionScore: 3, responseTime: '15 min', affectedVehicles: 80 },
        after: { congestionScore: 1, responseTime: '3 min', affectedVehicles: 5 }
      },
      agentTrace: [
        {
          agent: 'Signal Collector',
          status: 'completed',
          timestamp: new Date().toISOString(),
          durationMs: 98,
          metadata: {
            adkTool: 'signalNormalizationTool',
            adkInput: 'Raw heat complaints',
            adkOutput: { normalizedSignals: [{ type: 'weather', temp: 48 }] }
          }
        },
        {
          agent: 'Crisis Detector',
          status: 'completed',
          timestamp: new Date().toISOString(),
          durationMs: 194,
          metadata: {
            adkTool: 'crisisDetectionTool',
            adkInput: 'Normalized thermal inputs',
            adkOutput: { crisisType: 'HEATWAVE', location: 'Saddar, Rawalpindi', confidence: 0.91 }
          }
        },
        {
          agent: 'Situation Analyst',
          status: 'completed',
          timestamp: new Date().toISOString(),
          durationMs: 140,
          metadata: {
            adkTool: 'situationAnalysisTool',
            adkInput: 'Rawalpindi heatwave active',
            adkOutput: { severity: 'CRITICAL', explanation: 'Temperatures reached 48C, causing fainting cases in public markets.' }
          }
        },
        {
          agent: 'Action Planner',
          status: 'completed',
          timestamp: new Date().toISOString(),
          durationMs: 310,
          metadata: {
            adkTool: 'actionPlanningTool',
            adkInput: 'CRITICAL heat situation',
            adkOutput: { actionsCount: 3, priorities: ['P1', 'P1', 'P2'] }
          }
        },
        {
          agent: 'Simulation Executor',
          status: 'completed',
          timestamp: new Date().toISOString(),
          durationMs: 180,
          metadata: {
            adkTool: 'simulationTool',
            adkInput: '3 cooling coordination plans',
            adkOutput: { beforeScore: 3, afterScore: 1, speedupPercent: 80 }
          }
        }
      ]
    }
  },
  {
    id: 'scen-powergrid',
    title: 'Power Grid Failure',
    subtitle: 'Substation explosion & blackouts',
    location: 'F-7, Islamabad',
    iconName: 'flash-outline',
    signals: [
      {
        id: 'sig-p1',
        type: 'social',
        text: 'Huge blast at F-7 substation transformer! Pura sector black ho gaya hai, traffic signals also shut down. Extreme darkness.',
        timestamp: new Date().toISOString()
      },
      {
        id: 'sig-p2',
        type: 'social',
        text: 'Complete electricity blackout in F-7 Markaz. Security concerns rising as commercial corridors go blind.',
        timestamp: new Date().toISOString()
      }
    ],
    precomputedSession: {
      sessionId: 'session-power-demo',
      timestamp: new Date().toISOString(),
      location: 'F-7, Islamabad',
      crisisType: 'INFRASTRUCTURE_FAILURE',
      severity: 'MEDIUM',
      explanation: 'A major voltage transformer explosion at the F-7 Sector distribution substation has caused a complete electricity blackout across Sector F-7, Islamabad. Commercial avenues, traffic indicators, and public security camera networks are offline, posing elevated vehicle accident and residential safety risks.',
      actions: [
        {
          id: 'power-act-1',
          category: 'EMERGENCY',
          priority: 2,
          title: 'IESCO Engineering Repair Crew Dispatch',
          description: 'Deploy Islamabad Electric Supply Company (IESCO) critical repair units to F-7 substation to isolate the failed transformer and activate backup grid links.',
          estimatedImpact: 'Restores power supply to 60% of sector within 45 mins.',
          simulated: false
        },
        {
          id: 'power-act-2',
          category: 'TRAFFIC',
          priority: 3,
          title: 'Traffic Warden Intersection Deployment',
          description: 'Deploy 4 traffic wardens with luminous safety vests and torches to F-7 Markaz intersections to coordinate vehicles manually.',
          estimatedImpact: 'Prevents collision risks at dark junctions.',
          simulated: false
        },
        {
          id: 'power-act-3',
          category: 'ALERT',
          priority: 3,
          title: 'Security Advisory Alert broadcast',
          description: 'Broadcast security and safety advisories to residential complexes, urging activation of backup generator supplies.',
          estimatedImpact: 'Secures perimeter security for commercial hubs.',
          simulated: false
        }
      ],
      simulation: {
        simulatedRoutes: [
          'F-7 Markaz Intersections (ALERT - Traffic lights offline, manual warden active)',
          'F-7 Outer double avenues (CLEAR - Low congestion 2/10)'
        ],
        emergencyTickets: [
          'IESCO-8029: Repair crew [ARRIVED] on F-7 Substation grid',
          'ITP-4011: 4 Traffic Wardens [DEPLOYED] to F-7 Markaz intersections'
        ],
        sentAlerts: [
          '[SECURITY NOTICE] Power outage confirmed in F-7, Islamabad due to grid failure. Backups recommended. Traffic wardens manual coordinate active.'
        ],
        systemLogs: [
          { time: new Date().toISOString(), message: 'Transformer blast complaints parsed: F-7 grid offline.', level: 'INFO' },
          { time: new Date().toISOString(), message: 'Crisis Detector flagged INFRASTRUCTURE_FAILURE with confidence 0.87.', level: 'WARNING' },
          { time: new Date().toISOString(), message: 'Situation Analyst set MEDIUM hazard index based on utility blackout.', level: 'INFO' },
          { time: new Date().toISOString(), message: 'Action Planner drafted IESCO and Warden manual response sheets.', level: 'INFO' },
          { time: new Date().toISOString(), message: 'Simulation Executor verified wardens manual coordination prevented collision indexes.', level: 'INFO' }
        ],
        outcome: {
          before: { congestionScore: 5, responseTime: '30 min', affectedVehicles: 90 },
          after: { congestionScore: 2, responseTime: '8 min', affectedVehicles: 10 }
        }
      },
      outcome: {
        before: { congestionScore: 5, responseTime: '30 min', affectedVehicles: 90 },
        after: { congestionScore: 2, responseTime: '8 min', affectedVehicles: 10 }
      },
      agentTrace: [
        {
          agent: 'Signal Collector',
          status: 'completed',
          timestamp: new Date().toISOString(),
          durationMs: 105,
          metadata: {
            adkTool: 'signalNormalizationTool',
            adkInput: 'Raw outage reports in F-7 Sector',
            adkOutput: { normalizedSignals: [{ type: 'social', text: 'Blackout F-7 Markaz' }] }
          }
        },
        {
          agent: 'Crisis Detector',
          status: 'completed',
          timestamp: new Date().toISOString(),
          durationMs: 232,
          metadata: {
            adkTool: 'crisisDetectionTool',
            adkInput: 'F-7 normalized posts',
            adkOutput: { crisisType: 'INFRASTRUCTURE_FAILURE', location: 'F-7, Islamabad', confidence: 0.87 }
          }
        },
        {
          agent: 'Situation Analyst',
          status: 'completed',
          timestamp: new Date().toISOString(),
          durationMs: 160,
          metadata: {
            adkTool: 'situationAnalysisTool',
            adkInput: 'Grid outage F-7 sector details',
            adkOutput: { severity: 'MEDIUM', explanation: 'Distribution substation blast blacked out F-7, shutting lights & cameras.' }
          }
        },
        {
          agent: 'Action Planner',
          status: 'completed',
          timestamp: new Date().toISOString(),
          durationMs: 345,
          metadata: {
            adkTool: 'actionPlanningTool',
            adkInput: 'BLACKOUT crisis plan',
            adkOutput: { actionsCount: 3, priorities: ['P2', 'P3', 'P3'] }
          }
        },
        {
          agent: 'Simulation Executor',
          status: 'completed',
          timestamp: new Date().toISOString(),
          durationMs: 210,
          metadata: {
            adkTool: 'simulationTool',
            adkInput: '3 utility restoring actions',
            adkOutput: { beforeScore: 5, afterScore: 2, speedupPercent: 73 }
          }
        }
      ]
    }
  }
];
