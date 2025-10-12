import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function MapComponent() {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.text}>
        Map preview — only functional on mobile. Use custom Dev Build to test Mapbox.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { color: '#555', fontSize: 16, textAlign: 'center', padding: 20 },
});