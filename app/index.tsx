import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from '../context/AuthContext';

export default function IndexScreen() {
  const { currentUser, loading } = useAuth();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const didRoute = useRef(false);
  useEffect(() => {
    if (didRoute.current) return;
    if (!loading && isFirstLaunch !== null) {
      if (isFirstLaunch) {
        didRoute.current = true;
        router.replace('/landing/splash');
      } else if (!currentUser) {
        didRoute.current = true;
        router.replace('/landing/login');
      }
    }
  }, [currentUser, loading, isFirstLaunch]);

  const checkFirstLaunch = async () => {
    try {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (hasLaunched === null) {
        setIsFirstLaunch(true);
        await AsyncStorage.setItem('hasLaunched', 'true');
      } else {
        setIsFirstLaunch(false);
      }
    } catch (error) {
      setIsFirstLaunch(false);
    }
  };

  if (loading || isFirstLaunch === null) {
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
