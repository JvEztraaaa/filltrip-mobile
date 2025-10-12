import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import AnimatedPageContainer from '../components/AnimatedPageContainer';
import BottomNavBar from '../components/BottomNavBar';

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <AnimatedPageContainer>
        <View style={styles.content}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>User settings and account information</Text>
        </View>
      </AnimatedPageContainer>
      <BottomNavBar activeTab="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
});
