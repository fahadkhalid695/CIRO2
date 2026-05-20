import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { COLORS } from '../../constants/colors';

interface StatusDotProps {
  status?: 'ok' | 'warning' | 'critical';
  size?: number;
}

export function StatusDot({ status = 'ok', size = 10 }: StatusDotProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const getColor = () => {
    switch (status) {
      case 'critical': return COLORS.danger;
      case 'warning': return COLORS.warning;
      case 'ok':
      default: return COLORS.success;
    }
  };

  const color = getColor();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.pulse,
          { backgroundColor: color, borderRadius: size / 2, opacity },
        ]}
      />
      <View style={[styles.core, { backgroundColor: color, borderRadius: size / 2 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulse: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.5 }],
  },
  core: {
    width: '70%',
    height: '70%',
  },
});
