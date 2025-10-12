import React from 'react';
import { StyleSheet, View } from 'react-native';
import AnimatedPageContainer from '../components/AnimatedPageContainer';
import BottomNavBar from '../components/BottomNavBar';
import MapComponent from '../components/MapComponent';

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <AnimatedPageContainer>
        <MapComponent />
      </AnimatedPageContainer>
      <BottomNavBar activeTab="maps" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
