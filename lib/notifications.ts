import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { Config } from './config';

// ----------------------------------------------------
// Global Notification Handler Configuration
// ----------------------------------------------------
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registers this device for FCM / Expo Push Notifications.
 * Compiles permissions, fetches token, and registers on backend.
 */
export async function registerForPushNotifications(userLocationSector?: string): Promise<string | null> {
  let token = null;

  if (Platform.OS === 'web') {
    console.log('[PushNotifications] Notifications are not supported in web environments.');
    return null;
  }

  // 1. Verify physical hardware vs simulator constraints
  if (!Device.isDevice) {
    console.log('[PushNotifications] Running on virtual simulator. Native FCM push token acquisition skipped.');
    // Fallback: register a mock token for localized testing/judging simulations
    const mockToken = `MOCK-FCM-TOKEN-${Platform.OS.toUpperCase()}-${Math.random().toString(36).substring(7)}`;
    await registerTokenOnBackend(mockToken, userLocationSector || 'Islamabad');
    return mockToken;
  }

  try {
    // 2. Validate current authorization status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[PushNotifications] Failed to acquire push permissions from user.');
      return null;
    }

    // 3. Acquire unique Expo Push Token (which handles FCM transparently in background)
    // Extra EAS project config fallback
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: projectId || undefined,
    });
    token = tokenData.data;
    console.log('[PushNotifications] Successfully acquired device token:', token);

    // 4. Register token with backend services
    await registerTokenOnBackend(token, userLocationSector || 'Islamabad');
  } catch (error) {
    console.error('[PushNotifications] Error during device registration sequence:', error);
  }

  // 5. Initialize Android notification channels
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('crisis_alerts', {
      name: 'Crisis Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#EF4444',
      sound: 'crisis_alert.wav',
    });

    await Notifications.setNotificationChannelAsync('route_updates', {
      name: 'Traffic Route Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3B82F6',
      sound: 'default',
    });
  }

  return token;
}

/**
 * Sends token registration payloads directly to the backend
 */
async function registerTokenOnBackend(token: string, location: string) {
  try {
    const url = `${Config.apiBaseUrl}/api/notify/register`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, location }),
    });

    if (!response.ok) {
      throw new Error(`Server returned registration error code: ${response.status}`);
    }

    const resJson = await response.json();
    console.log('[PushNotifications] Registered device token successfully on server:', resJson);
  } catch (err) {
    console.error('[PushNotifications] Failed to register token on backend:', err);
  }
}

/**
 * Configures interactive in-app notification responses and action buttons
 */
export async function setupNotificationHandlers() {
  // Define categories (interactive CTA buttons on notification drop-down)
  await Notifications.setNotificationCategoryAsync('crisis_alert', [
    {
      identifier: 'VIEW_ANALYSIS',
      buttonTitle: '🚨 View Analysis',
      options: { isDestructive: false, isAuthenticationRequired: false },
    },
    {
      identifier: 'DISMISS',
      buttonTitle: 'Dismiss',
      options: { isDestructive: true },
    },
  ]);

  await Notifications.setNotificationCategoryAsync('route_update', [
    {
      identifier: 'VIEW_MAP',
      buttonTitle: '🗺️ View Map',
      options: { isDestructive: false },
    },
    {
      identifier: 'DISMISS',
      buttonTitle: 'Dismiss',
      options: { isDestructive: true },
    },
  ]);

  // 1. In-App Received Listener
  const receivedSubscription = Notifications.addNotificationReceivedListener((notification) => {
    const { title, body } = notification.request.content;
    console.log(`[PushNotifications] In-app notification received: "${title}" - "${body}"`);
    // Custom triggers (e.g. state triggers or custom toasts can be executed here)
  });

  // 2. User Response (Interaction / Click) Listener
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const actionIdentifier = response.actionIdentifier;
    const data = response.notification.request.content.data;
    
    console.log('[PushNotifications] Notification interactive response received:', actionIdentifier, data);

    // Deep routing mapping
    if (actionIdentifier === 'DISMISS') {
      return;
    }

    const sessionId = data?.sessionId;
    
    // Check type of notification
    if (data?.crisisType || sessionId) {
      if (sessionId) {
        console.log(`[PushNotifications] Deep linking to Analysis Session ID: ${sessionId}`);
        // Route to the active dynamic analysis screen
        // Expo Router matches ciro://analysis/[id] or simple route transitions
        router.push(`/analysis`);
      } else {
        router.push('/analysis');
      }
    } else if (data?.routeId) {
      console.log(`[PushNotifications] Deep linking to live Simulation Map View...`);
      router.push('/simulation');
    } else {
      // Fallback navigation
      router.push('/');
    }
  });

  // Return clean-up unsubscribe hooks
  return () => {
    receivedSubscription.remove();
    responseSubscription.remove();
  };
}
