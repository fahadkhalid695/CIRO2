import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import { Card } from './Card';

interface ScenarioCardProps {
  title: string;
  subtitle: string;
  location: string;
  iconName: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  index: number;
}

export function ScenarioCard({ title, subtitle, location, iconName, onPress, index }: ScenarioCardProps) {
  const translateY = useRef(new Animated.Value(20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getAccentColor = (): string => {
    if (title.includes('Flooding')) return COLORS.primary;
    if (title.includes('Accident')) return COLORS.danger;
    if (title.includes('Heatwave')) return COLORS.warning;
    return '#F59E0B';
  };

  const accentColor = getAccentColor();

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        <Card variant="neutral" style={styles.cardContainer}>
          <View style={styles.cardContent}>
            <View style={[styles.iconWrapper, { backgroundColor: `${accentColor}15`, borderColor: `${accentColor}30` }]}>
              <Ionicons name={iconName} size={22} color={accentColor} />
            </View>

            <View style={styles.infoWrapper}>
              <Text style={styles.titleText}>{title}</Text>
              <Text style={styles.subText} numberOfLines={1}>{subtitle}</Text>
              <View style={styles.locRow}>
                <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.locText}>{location}</Text>
              </View>
            </View>

            <View style={styles.actionWrapper}>
              <Text style={[styles.actionText, { color: accentColor }]}>Analyze</Text>
              <Ionicons name="arrow-forward" size={14} color={accentColor} />
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginBottom: 10,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoWrapper: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFF',
    marginBottom: 2,
  },
  subText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  actionWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingLeft: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
