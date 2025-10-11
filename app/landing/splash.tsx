import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import {
  Animated,
  Image,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SplashScreen() {
  const router = useRouter();
  const logoScale = React.useRef(new Animated.Value(0.8)).current;
  const logoOpacity = React.useRef(new Animated.Value(0)).current;

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
      // Ensure navigation context is available
      try { router.replace('/landing/onboarding'); } catch {}
    }, 2000);

    return () => clearTimeout(timer);
  }, [router, logoOpacity, logoScale]);

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