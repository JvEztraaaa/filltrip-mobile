import { useRouter } from 'expo-router';
import React, { useRef } from 'react';
import { Animated, Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface BottomNavBarProps {
  activeTab?: string;
}

export default function BottomNavBar({ activeTab = 'home' }: BottomNavBarProps) {
  const router = useRouter();

  const handlePress = (route: string) => {
    router.push(route as any);
  };

  const NavItem = ({
    icon,
    label,
    isActive,
    onPress,
  }: {
    icon: any;
    label: string;
    isActive?: boolean;
    onPress: () => void;
  }) => {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.85,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }).start();
    };

    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.itemWrap}
      >
        <Animated.View style={[styles.itemContent, { transform: [{ scale: scaleAnim }] }]}>
          <Image
            source={icon}
            style={[
              styles.icon,
              { tintColor: isActive ? '#14B8A6' : '#64748B' },
            ]}
            resizeMode="contain"
          />
          {isActive && <Text style={styles.activeLabel}>{label}</Text>}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const CenterButton = () => {
    const isActive = activeTab === 'map';
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }).start();
    };

    return (
      <TouchableOpacity
        onPress={() => handlePress('/main/map')}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.centerWrap}
      >
        <Animated.View style={[styles.centerButton, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.centerGlow} />
          <View style={[styles.centerCircle, isActive && styles.centerCircleActive]}>
            <Image
              source={require('../../assets/map.png')}
              style={styles.centerIcon}
              resizeMode="contain"
            />
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View pointerEvents="box-none" style={styles.container}>
      <View style={styles.navContainer}>
        <View style={styles.notchContainer}>
          {/* Left Side */}
          <View style={styles.leftSide}>
            <NavItem
              icon={require('../../assets/calculator.png')}
              label="Calculator"
              isActive={activeTab === 'calculator'}
              onPress={() => handlePress('/calculator')}
            />
            <NavItem
              icon={require('../../assets/trips.png')}
              label="Trips"
              isActive={activeTab === 'trips'}
              onPress={() => handlePress('/trips')}
            />
          </View>

          <View style={styles.centerSpace} />

          {/* Right Side */}
          <View style={styles.rightSide}>
            <NavItem
              icon={require('../../assets/logs.png')}
              label="Logs"
              isActive={activeTab === 'logs'}
              onPress={() => handlePress('/logs')}
            />
            <NavItem
              icon={require('../../assets/profile.png')}
              label="Profile"
              isActive={activeTab === 'profile'}
              onPress={() => handlePress('/profile')}
            />
          </View>
        </View>
      </View>

      {/* Floating Center Button */}
      <CenterButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: Platform.OS === 'ios' ? 34 : 0,
    alignItems: 'center',
  },
  navContainer: {
    width: '100%',
    height: 64,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: '#1E293B',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
  },
  notchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  leftSide: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingLeft: 24,
    paddingRight: 12,
  },
  rightSide: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 24,
  },
  centerSpace: {
    width: 80,
    height: 64,
  },
  itemWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 48,
    minHeight: 48,
    borderRadius: 24,
  },
  itemContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 24,
    height: 24,
  },
  activeLabel: {
    marginTop: 2,
    fontSize: 11,
    color: '#14B8A6',
    fontWeight: Platform.OS === 'ios' ? '600' : 'bold',
  },
  centerWrap: {
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerGlow: {
    position: 'absolute',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#14B8A6',
    opacity: 0.2,
    ...(Platform.OS === 'web' && {
      filter: 'blur(8px)',
    }),
  },
  centerCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D9488',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 3,
    borderColor: '#1E293B',
  },
  centerCircleActive: {
    backgroundColor: '#14B8A6',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
  },
  centerIcon: {
    width: 30,
    height: 30,
    tintColor: '#FFFFFF',
  },
});
