import React, { useRef } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

let RNMapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  try {
    const MapModule = require('react-native-maps');
    RNMapView = MapModule.default;
    Marker = MapModule.Marker;
    PROVIDER_GOOGLE = MapModule.PROVIDER_GOOGLE;
  } catch (e) {
    console.warn('[MapView] react-native-maps unavailable:', e);
  }
}

interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  title?: string;
  description?: string;
}

interface MapViewProps {
  latitude?: number;
  longitude?: number;
  latitudeDelta?: number;
  longitudeDelta?: number;
  markers?: MapMarker[];
  style?: object;
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0A0E1A' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8b96a8' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#111827' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1F2937' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#0F1626' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#374151' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#111E35' }] },
];

export function MapView({
  latitude = 33.6844,
  longitude = 73.0479,
  latitudeDelta = 0.05,
  longitudeDelta = 0.05,
  markers = [],
  style,
}: MapViewProps) {
  const mapRef = useRef<any>(null);

  if (!RNMapView || Platform.OS === 'web') {
    return <View style={[styles.placeholder, style]} />;
  }

  return (
    <View style={[styles.container, style]}>
      <RNMapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{ latitude, longitude, latitudeDelta, longitudeDelta }}
        customMapStyle={darkMapStyle}
        showsTraffic={false}
        showsUserLocation={false}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={{ latitude: marker.latitude, longitude: marker.longitude }}
            title={marker.title}
            description={marker.description}
          />
        ))}
      </RNMapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  placeholder: {
    height: 200,
    borderRadius: 12,
    backgroundColor: '#0A0E1A',
  },
});
