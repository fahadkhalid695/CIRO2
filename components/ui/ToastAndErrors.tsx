import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { Card } from './Card';
import { Button } from './Button';

interface SuccessToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
}

export function SuccessToast({ message, visible, onDismiss }: SuccessToastProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Slide down
      Animated.spring(slideAnim, {
        toValue: Platform.OS === 'ios' ? 50 : 20,
        useNativeDriver: true,
        bounciness: 8
      }).start();

      // Dismiss timer after 4 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => clearTimeout(timer);
    } else {
      slideAnim.setValue(-100);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: -100,
      duration: 300,
      useNativeDriver: true
    }).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toastContainer, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.toastContent}>
        <Ionicons name="checkmark-circle" size={20} color="#FFF" />
        <Text style={styles.toastText}>{message}</Text>
        <TouchableOpacity onPress={handleClose} activeOpacity={0.7}>
          <Ionicons name="close" size={16} color="#FFF" style={styles.toastClose} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

interface NetworkErrorCardProps {
  onRetry: () => void;
}

export function NetworkErrorCard({ onRetry }: NetworkErrorCardProps) {
  return (
    <Card variant="neutral" style={styles.errorCard}>
      <View style={styles.errorIconCircle}>
        <Ionicons name="wifi-outline" size={26} color={COLORS.danger} />
      </View>
      <Text style={styles.errorTitle}>Network Connection Offline</Text>
      <Text style={styles.errorDesc}>
        Unable to reach CIRO Command Centers. Check your local telemetry logs or mobile internet coverage.
      </Text>
      <Button variant="primary" title="Retry Sync" onPress={onRetry} style={styles.errorBtn} />
    </Card>
  );
}

interface ApiErrorCardProps {
  message: string;
  onRetry: () => void;
  onTryDemo: () => void;
}

export function ApiErrorCard({ message, onRetry, onTryDemo }: ApiErrorCardProps) {
  return (
    <Card variant="neutral" style={styles.errorCard}>
      <View style={styles.errorIconCircle}>
        <Ionicons name="alert-circle-outline" size={26} color={COLORS.danger} />
      </View>
      <Text style={styles.errorTitle}>Orchestrator Execution Fault</Text>
      <Text style={styles.errorDesc}>{message || "An unexpected error occurred during Google ADK trace sequence."}</Text>
      
      <View style={styles.errorActionRow}>
        <View style={{ flex: 1 }}>
          <Button variant="ghost" title="Retry" onPress={onRetry} />
        </View>
        <View style={{ flex: 1.5 }}>
          <Button variant="primary" title="Load Offline Demo" onPress={onTryDemo} />
        </View>
      </View>
    </Card>
  );
}

// Platform helper for conditional imports
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    top: 30,
    left: 16,
    right: 16,
    backgroundColor: COLORS.success,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 99999,
  },
  toastContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toastText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
    marginLeft: 10,
    letterSpacing: 0.2,
  },
  toastClose: {
    marginLeft: 10,
    opacity: 0.8,
  },
  errorCard: {
    padding: 20,
    alignItems: 'center',
    textAlign: 'center',
    borderColor: `${COLORS.danger}40`,
    borderWidth: 1,
    backgroundColor: '#0F1524',
    marginVertical: 16,
  },
  errorIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: `${COLORS.danger}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  errorDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  errorBtn: {
    width: '100%',
  },
  errorActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 4,
  },
});
