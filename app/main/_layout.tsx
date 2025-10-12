import { Tabs } from 'expo-router';
import React from 'react';

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' }, // Hide default tab bar since we use custom BottomNavBar
        lazy: false, // Preload screens for smoother transitions
      }}
    >
      <Tabs.Screen 
        name="calculator" 
        options={{
          title: 'Calculator',
        }}
      />
      <Tabs.Screen 
        name="trips" 
        options={{
          title: 'Trips',
        }}
      />
      <Tabs.Screen 
        name="map" 
        options={{
          title: 'Map',
        }}
      />
      <Tabs.Screen 
        name="logs" 
        options={{
          title: 'Logs',
        }}
      />
      <Tabs.Screen 
        name="profile" 
        options={{
          title: 'Profile',
        }}
      />
    </Tabs>
  );
}