import { Platform } from 'react-native';

// Resolve the correct API base URL depending on runtime environment.
// - Android emulator: 10.0.2.2 maps to the host machine's localhost
// - Physical device / iOS simulator: use the LAN IP from .env
// - Web: use localhost
function resolveApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  const fallbackUrl = 'http://localhost:3000';

  // If running on Android emulator (no real LAN IP configured or explicitly localhost)
  if (Platform.OS === 'android') {
    // Detect emulator: env URL points to localhost or 127.0.0.1
    if (!envUrl || envUrl.includes('localhost') || envUrl.includes('127.0.0.1')) {
      return 'http://10.0.2.2:3000';
    }
    // Physical device with LAN IP configured — use it as-is
    return envUrl;
  }

  if (Platform.OS === 'ios') {
    return envUrl || fallbackUrl;
  }

  // Web
  return envUrl || fallbackUrl;
}

export const Config = {
  apiBaseUrl: resolveApiBaseUrl(),
  googleMapsKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY!,
  geminiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY!,
};
