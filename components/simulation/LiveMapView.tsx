import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform, 
  Animated,
  Easing,
  ScrollView,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import polyline from '@mapbox/polyline';
import { COLORS } from '../../constants/colors';

// Conditional imports to maintain 100% web compilation compatibility
let MapView: any = null;
let Marker: any = null;
let Polyline: any = null;
let Callout: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    const MapModule = require('react-native-maps');
    MapView = MapModule.default;
    Marker = MapModule.Marker;
    Polyline = MapModule.Polyline;
    Callout = MapModule.Callout;
    PROVIDER_GOOGLE = MapModule.PROVIDER_GOOGLE;
  } catch (e) {
    console.warn("Failed to load react-native-maps in LiveMapView.", e);
  }
}

export interface Route {
  routeId: string;
  polylineEncoded: string;
  summary: string;
  duration: string;
  durationInTraffic: string;
  distance: string;
  recommended: boolean;
}

export interface EmergencyUnit {
  id: string;
  name: string;
  type: 'ambulance' | 'police' | 'fire_station' | 'hospital' | string;
  location: {
    lat: number;
    lng: number;
  };
}

interface LiveMapViewProps {
  crisisLocation: { lat: number; lng: number; address: string };
  alternateRoutes: Route[];
  blockedRoute: Route | null;
  emergencyUnits: EmergencyUnit[];
  trafficEnabled: boolean;
  onRouteSelect: (routeId: string) => void;
}

export default function LiveMapView({
  crisisLocation,
  alternateRoutes = [],
  blockedRoute = null,
  emergencyUnits = [],
  trafficEnabled = true,
  onRouteSelect
}: LiveMapViewProps) {
  
  const mapRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'hybrid'>('standard');
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(
    alternateRoutes.find(r => r.recommended)?.routeId || alternateRoutes[0]?.routeId || null
  );

  // Red pulsing animation for crisis marker
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 2.5,
            duration: 1600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: Platform.OS !== 'web'
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: Platform.OS !== 'web'
          })
        ]),
        Animated.sequence([
          Animated.timing(pulseOpacity, {
            toValue: 0,
            duration: 1600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: Platform.OS !== 'web'
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.8,
            duration: 0,
            useNativeDriver: Platform.OS !== 'web'
          })
        ])
      ])
    ).start();
  }, []);

  // Center coordinate helper
  const crisisCoord = useMemo(() => ({
    latitude: crisisLocation.lat,
    longitude: crisisLocation.lng
  }), [crisisLocation]);

  // Initial region centering on crisisLocation
  const initialRegion = useMemo(() => ({
    ...crisisCoord,
    latitudeDelta: 0.025,
    longitudeDelta: 0.025
  }), [crisisCoord]);

  // Helper to decode polylines
  const decodedBlockedRoute = useMemo(() => {
    if (!blockedRoute?.polylineEncoded) return [];
    try {
      return polyline.decode(blockedRoute.polylineEncoded).map(([lat, lng]) => ({
        latitude: lat,
        longitude: lng
      }));
    } catch (e) {
      console.error("Failed to decode blocked route polyline", e);
      return [];
    }
  }, [blockedRoute]);

  const decodedAlternates = useMemo(() => {
    return alternateRoutes.map(route => {
      try {
        const coords = polyline.decode(route.polylineEncoded).map(([lat, lng]) => ({
          latitude: lat,
          longitude: lng
        }));
        return {
          ...route,
          coordinates: coords
        };
      } catch (e) {
        console.error(`Failed to decode alternate route polyline ${route.routeId}`, e);
        return {
          ...route,
          coordinates: []
        };
      }
    });
  }, [alternateRoutes]);

  // Get midpoint coordinate of a polyline for labels/callouts
  const getPolylineMidpoint = (coords: { latitude: number; longitude: number }[]) => {
    if (!coords || coords.length === 0) return crisisCoord;
    const midIndex = Math.floor(coords.length / 2);
    return coords[midIndex];
  };

  // Re-center smoothly to crisis location
  const handleReCenter = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        ...crisisCoord,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02
      }, 500);
    }
  };

  // Animate map and select route when a card or line is pressed
  const handleRouteSelect = (routeId: string, coordinates: { latitude: number; longitude: number }[]) => {
    setSelectedRouteId(routeId);
    onRouteSelect(routeId);

    if (mapRef.current && coordinates.length > 0) {
      const midpoint = getPolylineMidpoint(coordinates);
      mapRef.current.animateToRegion({
        latitude: midpoint.latitude,
        longitude: midpoint.longitude,
        latitudeDelta: 0.018,
        longitudeDelta: 0.018
      }, 500);
    }
  };

  // Emojis mapping for responders
  const getUnitEmoji = (type: string) => {
    const normType = type.toLowerCase();
    if (normType.includes('ambulance') || normType.includes('medical')) return '🚑';
    if (normType.includes('police') || normType.includes('security')) return '🚔';
    if (normType.includes('fire')) return '🚒';
    if (normType.includes('hospital')) return '🏥';
    return '🚨';
  };

  // Map type toggler
  const toggleMapType = () => {
    setMapType(current => {
      if (current === 'standard') return 'satellite';
      if (current === 'satellite') return 'hybrid';
      return 'standard';
    });
  };

  // =========================================================================
  // WEB INTERACTIVE FALLBACK (Tactical Grid layout with SVG routes)
  // =========================================================================
  if (Platform.OS === 'web' || !MapView) {
    const activeRouteCoords = decodedAlternates.find(r => r.routeId === selectedRouteId)?.coordinates || [];

    return (
      <View style={styles.webContainer}>
        {/* Tactical Grid Visual Sandbox */}
        <View style={styles.fallbackMapFrame}>
          {/* Map Type indicator */}
          <View style={styles.webMapHeader}>
            <Text style={styles.webMapTitle}>CIRO SATELLITE COMMAND SIMULATOR</Text>
            <View style={styles.webMapBadge}>
              <View style={styles.webLiveDot} />
              <Text style={styles.webBadgeText}>LIVE TELEMETRY</Text>
            </View>
          </View>

          {/* Interactive Web Command SVG Grid Canvas */}
          <View style={styles.webCanvas}>
            {/* Draw beautiful grid lines */}
            <View style={styles.scanningGridOverlay}>
              <View style={styles.gridLineH1} />
              <View style={styles.gridLineH2} />
              <View style={styles.gridLineV1} />
              <View style={styles.gridLineV2} />
            </View>

            {/* Custom SVG Drawing routes for high visual quality */}
            <svg style={styles.svgCanvas} viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Blocked Route */}
              {decodedBlockedRoute.length > 0 && (
                <path
                  d="M 10 50 Q 50 50 90 50"
                  fill="none"
                  stroke={COLORS.danger}
                  strokeWidth="4"
                  strokeDasharray="5,3"
                />
              )}

              {/* Alternate 1 */}
              <path
                d="M 10 50 Q 30 20 90 50"
                fill="none"
                stroke={selectedRouteId === 'alt-1' ? COLORS.success : '#3B82F6'}
                strokeWidth={selectedRouteId === 'alt-1' ? '5' : '3'}
                style={{ cursor: 'pointer' }}
                onClick={() => handleRouteSelect('alt-1', [{ latitude: 33.6900, longitude: 73.0100 }])}
              />

              {/* Alternate 2 */}
              <path
                d="M 10 50 Q 50 80 90 50"
                fill="none"
                stroke={selectedRouteId === 'alt-2' ? COLORS.success : '#3B82F6'}
                strokeWidth={selectedRouteId === 'alt-2' ? '5' : '3'}
                style={{ cursor: 'pointer' }}
                onClick={() => handleRouteSelect('alt-2', [{ latitude: 33.6800, longitude: 73.0020 }])}
              />
            </svg>

            {/* Red Pulsing Crisis Center Marker */}
            <View style={[styles.crisisMarkerWeb, { left: '50%', top: '50%' }]}>
              <Animated.View style={[
                styles.pulse,
                { transform: [{ scale: pulseAnim }], opacity: pulseOpacity }
              ]} />
              <View style={styles.crisisDot} />
            </View>

            {/* Blocked callout label at midpoint */}
            {blockedRoute && (
              <View style={[styles.blockedWebCallout, { left: '42%', top: '43%' }]}>
                <Ionicons name="warning" size={10} color="#FFF" />
                <Text style={styles.blockedMidpointText}>BLOCKED: Srinagar Hwy</Text>
              </View>
            )}

            {/* Responders markers on grid */}
            {emergencyUnits.map((unit, index) => {
              const leftOffset = 20 + (index * 25);
              const topOffset = 30 + (index * 15);
              
              return (
                <View 
                  key={unit.id} 
                  style={[styles.webUnitMarker, { left: `${leftOffset}%`, top: `${topOffset}%` }]}
                >
                  <Text style={styles.webUnitEmoji}>{getUnitEmoji(unit.type)}</Text>
                  <View style={styles.webUnitBadge}>
                    <Text style={styles.webUnitText}>{unit.name || unit.id}</Text>
                  </View>
                </View>
              );
            })}

            {/* Web control buttons */}
            <View style={styles.controlsContainer}>
              <TouchableOpacity onPress={toggleMapType} style={styles.controlBtn} activeOpacity={0.7}>
                <Ionicons name="globe-outline" size={16} color="#FFF" />
                <Text style={styles.miniBtnText}>{mapType.toUpperCase()}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleRouteSelect(selectedRouteId || '', [])} style={styles.controlBtn} activeOpacity={0.7}>
                <Ionicons name="locate-outline" size={16} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Horizontal scroll cards container at bottom */}
        {renderRouteCards(decodedAlternates, selectedRouteId, handleRouteSelect)}
      </View>
    );
  }

  // =========================================================================
  // NATIVE INTERACTIVE MAPVIEW (Using react-native-maps & PROVIDER_GOOGLE)
  // =========================================================================
  return (
    <View style={styles.nativeContainer}>
      <View style={styles.mapFrame}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={initialRegion}
          showsTraffic={trafficEnabled}
          customMapStyle={darkMapStyle}
          mapType={mapType}
        >
          {/* 1. Pulsing Crisis Marker */}
          <Marker coordinate={crisisCoord} zIndex={10}>
            <View style={styles.crisisMarker}>
              <Animated.View style={[
                styles.pulse,
                { transform: [{ scale: pulseAnim }], opacity: pulseOpacity }
              ]} />
              <View style={styles.crisisDot} />
            </View>
          </Marker>

          {/* 2. Blocked Route Polyline & Label */}
          {decodedBlockedRoute.length > 0 && (
            <>
              <Polyline
                coordinates={decodedBlockedRoute}
                strokeColor={COLORS.danger}
                strokeWidth={5}
                lineDashPattern={[10, 5]}
              />
              <Marker coordinate={getPolylineMidpoint(decodedBlockedRoute)}>
                <View style={styles.blockedMidpointCallout}>
                  <Ionicons name="warning" size={11} color="#FFF" style={{ marginRight: 2 }} />
                  <Text style={styles.blockedMidpointText}>BLOCKED CORRIDOR</Text>
                </View>
              </Marker>
            </>
          )}

          {/* 3. Alternate Routes Polylines */}
          {decodedAlternates.map(route => {
            const isSelected = route.routeId === selectedRouteId;
            const strokeColor = route.recommended ? COLORS.success : (isSelected ? COLORS.primary : '#475569');
            const strokeWidth = route.recommended ? 5 : (isSelected ? 4 : 3);

            return (
              <Polyline
                key={route.routeId}
                coordinates={route.coordinates}
                strokeColor={strokeColor}
                strokeWidth={strokeWidth}
                tappable={true}
                onPress={() => handleRouteSelect(route.routeId, route.coordinates)}
              />
            );
          })}

          {/* 4. Real-time Emergency Services Markers */}
          {emergencyUnits.map(unit => (
            <Marker
              key={unit.id}
              coordinate={{ latitude: unit.location.lat, longitude: unit.location.lng }}
              title={unit.name}
              description={unit.type.toUpperCase()}
              zIndex={5}
            >
              <View style={styles.serviceMarker}>
                <Text style={styles.serviceEmoji}>{getUnitEmoji(unit.type)}</Text>
                <View style={styles.serviceMiniBadge}>
                  <Text style={styles.serviceMiniText} numberOfLines={1}>{unit.name.split(' ')[0]}</Text>
                </View>
              </View>
            </Marker>
          ))}
        </MapView>

        {/* Map Overlays Controls (Top Right Map Tools) */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity onPress={toggleMapType} style={styles.controlBtn} activeOpacity={0.7}>
            <Ionicons name="layers" size={16} color="#FFF" />
            <Text style={styles.miniBtnText}>{mapType.toUpperCase()}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleReCenter} style={styles.controlBtn} activeOpacity={0.7}>
            <Ionicons name="locate" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Horizontal scroll cards container at bottom */}
      {renderRouteCards(decodedAlternates, selectedRouteId, handleRouteSelect)}
    </View>
  );
}

// Render Route Info Cards at bottom helper
function renderRouteCards(
  routes: any[],
  selectedRouteId: string | null,
  onSelect: (routeId: string, coordinates: { latitude: number; longitude: number }[]) => void
) {
  if (!routes || routes.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.cardContainer}
      contentContainerStyle={styles.cardContent}
    >
      {routes.map(route => {
        const isSelected = route.routeId === selectedRouteId;
        const borderStyle = route.recommended 
          ? { borderColor: COLORS.success, borderWidth: 1.5 } 
          : (isSelected ? { borderColor: COLORS.primary, borderWidth: 1.5 } : {});

        return (
          <TouchableOpacity
            key={route.routeId}
            onPress={() => onSelect(route.routeId, route.coordinates)}
            style={[styles.routeCard, borderStyle]}
            activeOpacity={0.8}
          >
            {route.recommended && (
              <View style={styles.recommendedBadge}>
                <Ionicons name="star" size={10} color="#FFF" />
                <Text style={styles.badgeText}>RECOMMENDED</Text>
              </View>
            )}

            <View style={styles.cardHeader}>
              <Text style={styles.routeSummary} numberOfLines={1}>{route.summary}</Text>
              {isSelected && <View style={styles.activeRouteDot} />}
            </View>

            <View style={styles.routeDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="navigate-outline" size={12} color={COLORS.textSecondary} />
                <Text style={styles.detailValue}>{route.distance}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="time-outline" size={12} color={COLORS.textSecondary} />
                <Text style={[styles.detailValue, route.recommended ? { color: COLORS.success, fontWeight: '700' } : {}]}>
                  {route.durationInTraffic || route.duration}
                </Text>
              </View>
            </View>

            {route.durationInTraffic && (
              <Text style={styles.trafficSubtext}>
                In Traffic: {route.durationInTraffic} (Google Live)
              </Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// Dark map style schema for Google Maps
const darkMapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#0A0E1A" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#8b96a8" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#111827" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1F2937" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#0F1626" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#374151" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#111E35" }] }
];

const styles = StyleSheet.create({
  nativeContainer: {
    width: '100%',
    gap: 12,
  },
  webContainer: {
    width: '100%',
    gap: 12,
  },
  mapFrame: {
    height: 300,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    backgroundColor: '#070B14',
  },
  fallbackMapFrame: {
    height: 280,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    position: 'relative',
    backgroundColor: '#070B14',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  webCanvas: {
    ...StyleSheet.absoluteFillObject,
    position: 'relative',
  },
  svgCanvas: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  webMapHeader: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webMapTitle: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  webMapBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: COLORS.success,
    borderWidth: 0.5,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  webLiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.success,
  },
  webBadgeText: {
    fontSize: 6,
    fontWeight: '800',
    color: COLORS.success,
  },
  crisisMarker: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 46,
    height: 46,
  },
  crisisMarkerWeb: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    marginLeft: -20,
    marginTop: -20,
  },
  pulse: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${COLORS.danger}40`,
    position: 'absolute',
  },
  crisisDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.danger,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  blockedMidpointCallout: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 3,
  },
  blockedWebCallout: {
    position: 'absolute',
    backgroundColor: COLORS.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  blockedMidpointText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  serviceMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceEmoji: {
    fontSize: 22,
  },
  serviceMiniBadge: {
    backgroundColor: 'rgba(10,14,26,0.9)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    marginTop: 2,
  },
  serviceMiniText: {
    fontSize: 7,
    fontWeight: '800',
    color: COLORS.textPrimary,
    maxWidth: 40,
  },
  webUnitMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
  },
  webUnitEmoji: {
    fontSize: 18,
  },
  webUnitBadge: {
    backgroundColor: 'rgba(10, 14, 26, 0.8)',
    borderRadius: 3,
    paddingHorizontal: 3,
    paddingVertical: 0.5,
    marginTop: 1,
  },
  webUnitText: {
    color: '#FFF',
    fontSize: 6,
    fontWeight: '700',
  },
  controlsContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 6,
    zIndex: 10,
  },
  controlBtn: {
    backgroundColor: 'rgba(17, 24, 39, 0.85)',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 8,
    height: 28,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  miniBtnText: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: '900',
  },
  cardContainer: {
    width: '100%',
    marginTop: 4,
  },
  cardContent: {
    gap: 8,
    paddingRight: 16,
  },
  routeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 10,
    width: 190,
    justifyContent: 'center',
    position: 'relative',
    height: 86,
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    left: 10,
    backgroundColor: COLORS.success,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 7,
    fontWeight: '900',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeSummary: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  activeRouteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  routeDetails: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
    alignItems: 'center',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  detailValue: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  trafficSubtext: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: 0.3,
  },
  scanningGridOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },
  gridLineH1: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '33%',
    height: 1,
    backgroundColor: '#FFF',
  },
  gridLineH2: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '66%',
    height: 1,
    backgroundColor: '#FFF',
  },
  gridLineV1: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '33%',
    width: 1,
    backgroundColor: '#FFF',
  },
  gridLineV2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '66%',
    width: 1,
    backgroundColor: '#FFF',
  },
});
