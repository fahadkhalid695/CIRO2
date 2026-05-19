import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { registerForPushNotifications, setupNotificationHandlers } from '../lib/notifications';

const queryClient = new QueryClient();

export default function RootLayout() {
  useEffect(() => {
    // Initialise device registration for high-priority crisis broadcasts
    registerForPushNotifications('Islamabad');

    let unsubscribe: (() => void) | undefined;
    
    setupNotificationHandlers().then((cleanupFn) => {
      unsubscribe = cleanupFn;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}
