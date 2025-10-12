import React, { forwardRef, useEffect, useRef, useImperativeHandle } from 'react';
import { View, StyleSheet } from 'react-native';
import MapboxGL from '@rnmapbox/maps';

// Set Mapbox access token
MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '');

interface Coordinates {
  longitude: number;
  latitude: number;
}

interface MapComponentProps {
  isDarkMode?: boolean;
  startLocation?: { coordinates: Coordinates; name: string } | null;
  endLocation?: { coordinates: Coordinates; name: string } | null;
  routeCoordinates?: number[][];
  onMapPress?: (coordinates: Coordinates) => void;
}

interface MapRef {
  flyTo: (coordinates: Coordinates, zoom?: number) => void;
  fitBounds: (coordinates: Coordinates[], padding?: number) => void;
}

const MapComponent = forwardRef<MapRef, MapComponentProps>(({
  isDarkMode = false,
  startLocation,
  endLocation,
  routeCoordinates,
  onMapPress,
}, ref) => {
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  useImperativeHandle(ref, () => ({
    flyTo: (coordinates: Coordinates, zoom = 14) => {
      cameraRef.current?.setCamera({
        centerCoordinate: [coordinates.longitude, coordinates.latitude],
        zoomLevel: zoom,
        animationDuration: 1000,
      });
    },
    fitBounds: (coordinates: Coordinates[], padding = 50) => {
      if (coordinates.length === 0) return;
      
      const lngs = coordinates.map(coord => coord.longitude);
      const lats = coordinates.map(coord => coord.latitude);
      
      const northEast: [number, number] = [Math.max(...lngs), Math.max(...lats)];
      const southWest: [number, number] = [Math.min(...lngs), Math.min(...lats)];
      
      cameraRef.current?.fitBounds(northEast, southWest, [padding, padding, padding, padding], 1000);
    },
  }));

  const handleMapPress = (feature: any) => {
    if (onMapPress) {
      const coordinates = feature.geometry.coordinates;
      onMapPress({
        longitude: coordinates[0],
        latitude: coordinates[1],
      });
    }
  };

  // Fit bounds when route coordinates change
  useEffect(() => {
    if (routeCoordinates && routeCoordinates.length > 0) {
      const coords = routeCoordinates.map(coord => ({ longitude: coord[0], latitude: coord[1] }));
      setTimeout(() => {
        if (ref && 'current' in ref && ref.current) {
          ref.current.fitBounds(coords, 100);
        }
      }, 100);
    }
  }, [routeCoordinates, ref]);

  return (
    <View style={styles.container}>
      <MapboxGL.MapView
        ref={mapRef}
        style={styles.map}
        styleURL={isDarkMode ? MapboxGL.StyleURL.Dark : MapboxGL.StyleURL.Street}
        onPress={handleMapPress}
        zoomEnabled={true}
        scrollEnabled={true}
        pitchEnabled={true}
        rotateEnabled={true}
        attributionEnabled={false}
        logoEnabled={false}
      >
        <MapboxGL.Camera
          ref={cameraRef}
          zoomLevel={12}
          centerCoordinate={[120.9375, 14.3466]}
          animationMode="flyTo"
          animationDuration={1000}
        />

        {/* Route Line */}
        {routeCoordinates && routeCoordinates.length > 0 && (
          <MapboxGL.ShapeSource
            id="route-source"
            shape={{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routeCoordinates,
              },
            }}
          >
            <MapboxGL.LineLayer
              id="route-line"
              style={{
                lineColor: '#4FD1C5',
                lineWidth: 5,
                lineOpacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </MapboxGL.ShapeSource>
        )}

        {/* Start Location Marker */}
        {startLocation && (
          <MapboxGL.PointAnnotation
            id="start-marker"
            coordinate={[startLocation.coordinates.longitude, startLocation.coordinates.latitude]}
          >
            <View style={[styles.marker, styles.startMarker]}>
              <View style={styles.markerInner}>
                <View style={styles.startMarkerIcon} />
              </View>
            </View>
          </MapboxGL.PointAnnotation>
        )}

        {/* End Location Marker */}
        {endLocation && (
          <MapboxGL.PointAnnotation
            id="end-marker"
            coordinate={[endLocation.coordinates.longitude, endLocation.coordinates.latitude]}
          >
            <View style={[styles.marker, styles.endMarker]}>
              <View style={styles.markerInner}>
                <View style={styles.endMarkerIcon} />
              </View>
            </View>
          </MapboxGL.PointAnnotation>
        )}
      </MapboxGL.MapView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startMarker: {
    backgroundColor: '#10B981',
  },
  startMarkerIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
  endMarker: {
    backgroundColor: '#EF4444',
  },
  endMarkerIcon: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'white',
  },
});

export default MapComponent;