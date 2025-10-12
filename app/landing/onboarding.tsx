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
    image: require('../../assets/logo.png'),
  },
  {
    title: 'Mission',
    description: 'Making travel smarter and more sustainable through intelligent fuel management.',
    image: require('../../assets/logo.png'),
  },
  {
    title: 'Vision',
    description: 'Every trip planned efficiently, saving money and protecting the environment.',
    image: require('../../assets/logo.png'),
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
        {/* Background with dotted pattern */}
        <View 
          className="absolute inset-0 bg-gray-900 overflow-hidden"
        >
          <View 
            className="absolute inset-0"
            style={{
              opacity: 0.15,
            }}
          >
            {Platform.OS === 'web' ? (
              <View style={{
                width: '100%',
                height: '100%',
                backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.4) 1px, transparent 1px)',
                backgroundSize: '20px 20px',
              } as any} />
            ) : (
              <View style={{
                width: '100%',
                height: '100%',
                backgroundColor: 'transparent',
              }}>
                {Array.from({ length: 60 }).map((_, rowIndex) => (
                  <View key={rowIndex} style={{ flexDirection: 'row', marginBottom: 18 }}>
                    {Array.from({ length: 20 }).map((_, colIndex) => (
                      <View
                        key={colIndex}
                        style={{
                          width: 2,
                          height: 2,
                          borderRadius: 1,
                          backgroundColor: 'rgba(255, 255, 255, 0.5)',
                          marginRight: 18,
                        }}
                      />
                    ))}
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          {onboardingData.map((item, index) => (
            <View key={index} style={{ width }} className="flex-1 px-6 sm:px-8">
              <View className="flex-1 items-center justify-center" style={{ paddingVertical: 40 }}>
                <Image 
                  source={item.image}
                  style={{ width: 120, height: 120, marginBottom: 60 }}
                  resizeMode="contain"
                />
                <Text className="text-white text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 px-2">
                  {item.title}
                </Text>
                <Text className="text-gray-300 text-base sm:text-lg text-center leading-6 sm:leading-7 max-w-sm px-4">
                  {item.description}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <View className="flex-row justify-center mb-8 sm:mb-12">
          {onboardingData.map((_, index) => (
            <View
              key={index}
              className={`w-2 h-2 rounded-full mx-1 ${
                index === currentIndex ? 'bg-teal-500' : 'bg-gray-600'
              }`}
            />
          ))}
        </View>

        <View className="flex-row justify-between items-center px-6 sm:px-8 pb-8 sm:pb-12">
          <TouchableOpacity
            onPress={handleSkip}
            className="py-3 sm:py-4 px-4 sm:px-6"
          >
            <Text className="text-gray-400 text-base sm:text-lg">Skip</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleNext}
            className={`${currentIndex === onboardingData.length - 1 ? 'bg-teal-500 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl' : 'bg-teal-500 w-11 h-11 sm:w-12 sm:h-12 rounded-full'} items-center justify-center`}
          >
            {currentIndex === onboardingData.length - 1 ? (
              <Text className="text-white text-base sm:text-lg font-semibold">Let&apos;s Go</Text>
            ) : (
              <View className="absolute inset-0 items-center justify-center">
                <Text className="text-white text-lg sm:text-xl font-bold" style={{ marginTop: -2 }}>{'>'}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}