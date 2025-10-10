import { router } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Animated,
  Image,
  SafeAreaView,
  View
} from 'react-native';

export default function SplashScreen() {
  const logoScale = new Animated.Value(0.8);
  const logoOpacity = new Animated.Value(0);

  useEffect(() => {
    // Logo entrance animation
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to onboarding after 2 seconds
    const timer = setTimeout(() => {
      router.replace('/landing/onboarding');
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="flex-1 justify-center items-center">
        <Animated.View
          style={{
            transform: [{ scale: logoScale }],
            opacity: logoOpacity,
          }}
        >
          <Image 
            source={require('../../assets/logo.svg')} 
            style={{ 
              width: 120, 
              height: 120 
            }}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}