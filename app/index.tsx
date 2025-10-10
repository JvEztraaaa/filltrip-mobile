import { router } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from '../context/AuthContext';

export default function IndexScreen() {
  const { currentUser, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (currentUser) {
        // User is authenticated, stay on this page for now
        // Later this will redirect to main app
      } else {
        // User is not authenticated, redirect to login
  router.replace('/login');
      }
    }
  }, [currentUser, loading]);

  if (loading) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-white mt-4 text-lg">Loading...</Text>
      </View>
    );
  }

  if (currentUser) {
    return (
      <View className="flex-1 bg-gray-900 justify-center items-center px-6">
        <Text className="text-white text-2xl font-bold mb-4 text-center">Welcome to FillTrip, {currentUser.firstName}! 🚗</Text>
        <Text className="text-gray-400 text-center text-lg">Mobile app coming soon...</Text>
      </View>
    );
  }

  return null;
}
