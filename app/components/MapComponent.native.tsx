import MapboxGL from '@rnmapbox/maps';
import React from 'react';
import { StyleSheet, View } from 'react-native';

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || '');

export default function MapComponent() {
  return (
    <View style={styles.container}>
      <MapboxGL.MapView style={styles.map}>
        <MapboxGL.Camera
          zoomLevel={12}
          centerCoordinate={[120.9375, 14.3466]}
        />
      </MapboxGL.MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});