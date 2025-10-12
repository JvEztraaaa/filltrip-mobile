import AsyncStorage from '@react-native-async-storage/async-storage';
import { Redirect } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from '../context/AuthContext';

export default function IndexScreen() {
  const { currentUser, loading } = useAuth();
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  // Use declarative redirects to avoid navigation context timing issues
  if (!loading && isFirstLaunch === true) {
    return <Redirect href="/landing/splash" />;
  }
  if (!loading && isFirstLaunch === false && !currentUser) {
    return <Redirect href="/landing/login" />;
  }

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
    return <Redirect href="/main/map" />;
  }

  return null;
}
