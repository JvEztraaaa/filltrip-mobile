import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const onboardingData = [
  {
    title: 'Welcome to FillTrip',
    description: 'Enter your start and end locations, let FillTrip calculate the distance, factor in your vehicle’s fuel efficiency, and get an accurate fuel cost estimate with real-time prices.',
    image: require('../../assets/logo.svg'),
  },
  {
    title: 'Mission',
    description: 'Making travel smarter and more sustainable through intelligent fuel management.',
    image: require('../../assets/logo.svg'),
  },
  {
    title: 'Vision',
    description: 'Every trip planned efficiently, saving money and protecting the environment.',
    image: require('../../assets/logo.svg'),
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      scrollViewRef.current?.scrollTo({ x: nextIndex * width, animated: true });
    } else {
      router.replace('/landing/login');
    }
  };

  const handleSkip = () => {
    router.replace('/landing/login');
  };

  const onScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    
    // If user swipes past the last slide, navigate to login
    if (index >= onboardingData.length) {
      router.replace('/landing/login');
      return;
    }
    
    setCurrentIndex(index);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <View className="flex-1">
        {/* Background with grid pattern */}
        <View 
          className="absolute inset-0 bg-gray-900"
          style={{
            backgroundImage: Platform.OS === 'web' ? 
              'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)' : undefined,
            backgroundSize: Platform.OS === 'web' ? '20px 20px' : undefined,
          }}
        />

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {onboardingData.map((item, index) => (
            <View key={index} style={{ width }} className="flex-1 px-8">
              <View className="flex-1 items-center" style={{ paddingTop: 180 }}>
                <Image 
                  source={item.image}
                  style={{ width: 120, height: 120, marginBottom: 120 }}
                  resizeMode="contain"
                />
                <Text className="text-white text-3xl font-bold text-center mb-8">
                  {item.title}
                </Text>
                <Text className="text-gray-300 text-lg text-center leading-7 max-w-sm px-4">
                  {item.description}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View className="flex-row justify-center mb-12">
          {onboardingData.map((_, index) => (
            <View
              key={index}
              className={`w-2 h-2 rounded-full mx-1 ${
                index === currentIndex ? 'bg-teal-500' : 'bg-gray-600'
              }`}
            />
          ))}
        </View>

        <View className="flex-row justify-between items-center px-8 pb-12">
          <TouchableOpacity
            onPress={handleSkip}
            className="py-4 px-6"
          >
            <Text className="text-gray-400 text-lg">Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            className={`${currentIndex === onboardingData.length - 1 ? 'bg-teal-500 px-6 py-3 rounded-xl' : 'bg-teal-500 w-12 h-12 rounded-full'} items-center justify-center`}
          >
            {currentIndex === onboardingData.length - 1 ? (
              <Text className="text-white text-lg font-semibold">Let&apos;s Go</Text>
            ) : (
              <View className="absolute inset-0 items-center justify-center">
                <Text className="text-white text-lg font-bold" style={{ marginTop: -2 }}>{'>'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}