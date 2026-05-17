import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, DimensionValue } from 'react-native';
import { COLORS } from '../../constants/colors';

interface SkeletonCardProps {
  height?: number;
  width?: DimensionValue;
  borderRadius?: number;
}

export function SkeletonCard({ height = 110, width = '100%', borderRadius = 12 }: SkeletonCardProps) {
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.75,
          duration: 850,
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 850,
          useNativeDriver: true
        })
      ])
    ).start();
  }, []);

  return (
    <Animated.View 
      style={[
        styles.skeleton, 
        { 
          height, 
          width, 
          borderRadius, 
          opacity: pulseAnim 
        }
      ]} 
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#1E293B',
    borderWidth: 1.5,
    borderColor: '#334155',
    marginBottom: 12,
  }
});
