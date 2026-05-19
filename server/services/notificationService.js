/**
 * Notification Service for CIRO Crisis Alert System
 * Manages Firebase Cloud Messaging (FCM) registrations, multicast notifications,
 * topic broadcasts, and deep-link alert updates.
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

let isFirebaseInitialized = false;

// Graceful initialization of Firebase Admin SDK
try {
  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  
  if (saPath) {
    const resolvedPath = path.resolve(saPath);
    if (fs.existsSync(resolvedPath)) {
      const serviceAccount = require(resolvedPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      });
      isFirebaseInitialized = true;
      console.log('[NotificationService] Firebase Admin SDK initialized successfully.');
    } else {
      console.warn(`[NotificationService] Service account file not found at: ${resolvedPath}. Running in offline mock telemetry mode.`);
    }
  } else {
    console.warn('[NotificationService] FIREBASE_SERVICE_ACCOUNT_PATH is not set in environment variables. Running in offline mock telemetry mode.');
  }
} catch (error) {
  console.error('[NotificationService] Failed to initialize Firebase Admin SDK. Fallback active:', error);
}

// In-Memory registered device token store (simulates simple local database)
const registeredTokensStore = new Map();

/**
 * Registers a new device token with its telemetry sector location
 */
function registerDeviceToken(token, location) {
  if (!token) return false;
  const normalizedLoc = location ? location.toLowerCase().trim() : 'general';
  registeredTokensStore.set(token, {
    token,
    location: normalizedLoc,
    timestamp: new Date().toISOString()
  });
  console.log(`[NotificationService] Registered device token for sector: ${normalizedLoc} (Total tokens: ${registeredTokensStore.size})`);
  return true;
}

/**
 * Returns registered tokens matching a target location/sector.
 * If no location is provided or is 'general', returns all active tokens.
 */
function getTargetTokens(locationName) {
  const allTokens = Array.from(registeredTokensStore.values());
  if (!locationName || locationName.toLowerCase() === 'general') {
    return allTokens.map(t => t.token);
  }
  
  const normalized = locationName.toLowerCase().trim();
  return allTokens
    .filter(t => t.location.includes(normalized) || normalized.includes(t.location))
    .map(t => t.token);
}

/**
 * Multicasts a critical crisis alert notification to devices
 */
async function sendCrisisAlert(tokens, crisisData) {
  if (!tokens || tokens.length === 0) {
    console.log('[NotificationService] No active registered tokens matching target sector for crisis alert.');
    return { success: true, message: 'No registered targets' };
  }

  const title = `🚨 ${crisisData.type} Detected — ${crisisData.location}`;
  const body = `Severity: ${crisisData.severity} | ${crisisData.impactSummary ? crisisData.impactSummary.substring(0, 100) : 'Crisis incident alert live'}`;
  
  const message = {
    notification: { title, body },
    data: {
      crisisType: String(crisisData.type || ''),
      location: String(crisisData.location || ''),
      severity: String(crisisData.severity || ''),
      sessionId: String(crisisData.sessionId || ''),
      deepLink: `ciro://analysis/${crisisData.sessionId || ''}`
    },
    android: {
      priority: 'high',
      notification: {
        color: '#EF4444',
        sound: 'crisis_alert',
        channelId: 'crisis_alerts'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'crisis_alert.caf',
          badge: 1
        }
      }
    },
    tokens: tokens
  };

  if (!isFirebaseInitialized) {
    console.log('\n--- [Offline Telemetry Mock Notification Broadcast] ---');
    console.log(`Title: ${title}`);
    console.log(`Body: ${body}`);
    console.log('Payload Data:', message.data);
    console.log(`Targeting ${tokens.length} devices...`);
    console.log('-------------------------------------------------------\n');
    return { success: true, offline: true, responses: tokens.map(() => ({ success: true })) };
  }

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[NotificationService] Multicast crisis alert dispatched. Success: ${response.successCount}, Failures: ${response.failureCount}`);
    return response;
  } catch (error) {
    console.error('[NotificationService] Multicast sendCrisisAlert failure:', error);
    throw error;
  }
}

/**
 * Multicasts traffic rerouting updates to localized sector devices
 */
async function sendRouteUpdateAlert(tokens, routeData) {
  if (!tokens || tokens.length === 0) {
    console.log('[NotificationService] No targets matching route telemetry sector.');
    return { success: true, message: 'No targets' };
  }

  const title = `🚗 Traffic Reroute Active — ${routeData.location}`;
  const body = `Alert: ${routeData.alertReason || 'Alternate paths mapped to bypass gridlocks.'}`;
  
  const message = {
    notification: { title, body },
    data: {
      location: String(routeData.location || ''),
      reason: String(routeData.alertReason || ''),
      routeId: String(routeData.routeId || ''),
      deepLink: `ciro://simulation`
    },
    android: {
      priority: 'high',
      notification: {
        color: '#3B82F6',
        sound: 'default',
        channelId: 'route_updates'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1
        }
      }
    },
    tokens: tokens
  };

  if (!isFirebaseInitialized) {
    console.log('\n--- [Offline Telemetry Mock Notification Route Update] ---');
    console.log(`Title: ${title}`);
    console.log(`Body: ${body}`);
    console.log('Payload Data:', message.data);
    console.log(`Targeting ${tokens.length} devices...`);
    console.log('----------------------------------------------------------\n');
    return { success: true, offline: true, responses: tokens.map(() => ({ success: true })) };
  }

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[NotificationService] Route alert dispatched. Success: ${response.successCount}, Failures: ${response.failureCount}`);
    return response;
  } catch (error) {
    console.error('[NotificationService] Multicast sendRouteUpdateAlert failure:', error);
    throw error;
  }
}

/**
 * Multicasts incident resolution notification to devices
 */
async function sendResolutionAlert(tokens, sessionId) {
  if (!tokens || tokens.length === 0) {
    console.log('[NotificationService] No targets matching resolution alert context.');
    return { success: true, message: 'No targets' };
  }

  const title = `✅ Crisis Incident Resolved`;
  const body = `Telemetry sectors report normal capacity and restored mobility flow.`;

  const message = {
    notification: { title, body },
    data: {
      sessionId: String(sessionId || ''),
      status: 'RESOLVED',
      deepLink: `ciro://history`
    },
    android: {
      priority: 'high',
      notification: {
        color: '#10B981',
        sound: 'default',
        channelId: 'crisis_alerts'
      }
    },
    apns: {
      payload: {
        aps: {
          sound: 'default'
        }
      }
    },
    tokens: tokens
  };

  if (!isFirebaseInitialized) {
    console.log('\n--- [Offline Telemetry Mock Notification Incident Resolved] ---');
    console.log(`Title: ${title}`);
    console.log(`Body: ${body}`);
    console.log('Payload Data:', message.data);
    console.log(`Targeting ${tokens.length} devices...`);
    console.log('----------------------------------------------------------------\n');
    return { success: true, offline: true, responses: tokens.map(() => ({ success: true })) };
  }

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(`[NotificationService] Resolution alert dispatched. Success: ${response.successCount}, Failures: ${response.failureCount}`);
    return response;
  } catch (error) {
    console.error('[NotificationService] Multicast sendResolutionAlert failure:', error);
    throw error;
  }
}

/**
 * Broadcasts an general messaging notification to a specific Firebase Topic
 */
async function broadcastToTopic(topic, messagePayload) {
  const title = messagePayload.title || 'CIRO Public Advisory';
  const body = messagePayload.body || 'Public broadcast update live.';

  const message = {
    notification: { title, body },
    data: {
      topic: String(topic),
      ...messagePayload.data
    },
    topic: topic
  };

  if (!isFirebaseInitialized) {
    console.log('\n--- [Offline Telemetry Mock Notification Topic Broadcast] ---');
    console.log(`Topic: ${topic}`);
    console.log(`Title: ${title}`);
    console.log(`Body: ${body}`);
    console.log('-------------------------------------------------------------\n');
    return { success: true, offline: true, messageId: `mock-topic-${Date.now()}` };
  }

  try {
    const response = await admin.messaging().send(message);
    console.log(`[NotificationService] Topic broadcast successfully sent to: ${topic}. MessageID: ${response}`);
    return { success: true, messageId: response };
  } catch (error) {
    console.error(`[NotificationService] Topic broadcast error for topic ${topic}:`, error);
    throw error;
  }
}

module.exports = {
  registerDeviceToken,
  getTargetTokens,
  sendCrisisAlert,
  sendRouteUpdateAlert,
  sendResolutionAlert,
  broadcastToTopic,
  registeredTokensStore
};
