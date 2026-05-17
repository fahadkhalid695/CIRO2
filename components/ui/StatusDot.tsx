import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';
import { COLORS } from '../../constants/colors';

interface StatusDotProps {
  status?: 'ok' | 'warning' | 'critical';
  size?: number;
}

export function StatusDot({ status = 'ok', size = 10 }: StatusDotProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.4, { duration: 800 })
      ),
      -1, // infinite
      true // reverse
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const getColor = () => {
    switch (status) {
      case 'critical': return COLORS.danger;
      case 'warning': return COLORS.warning;
      case 'ok': return COLORS.success;
      default: return COLORS.success;
    }
  };

  const color = getColor();

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.pulse,
          animatedStyle,
          { backgroundColor: color, borderRadius: size / 2 }
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
  }
});
