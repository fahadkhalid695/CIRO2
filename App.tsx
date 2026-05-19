import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { registerForPushNotifications, setupNotificationHandlers } from './lib/notifications';

export default function App() {
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
    <View style={styles.container}>
      <Text>Open up App.tsx to start working on your app!</Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
