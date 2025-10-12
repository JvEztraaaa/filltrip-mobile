import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';

interface AnimatedPageContainerProps {
  children: React.ReactNode;
  isActive?: boolean;
}

export default function AnimatedPageContainer({ children, isActive = true }: AnimatedPageContainerProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(0.95);

  useEffect(() => {
    if (isActive) {
      // Smooth entry animation
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withTiming(0, { duration: 350 });
      scale.value = withTiming(1, { duration: 350 });
    } else {
      // Quick exit animation
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(-10, { duration: 200 });
      scale.value = withTiming(0.98, { duration: 200 });
    }
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});