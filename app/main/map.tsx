import React from "react";
import {
    SafeAreaView,
    Text,
    View,
} from "react-native";
import BottomNavBar from "../components/BottomNavBar";

export default function MapScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Main Content Area */}
      <View className="flex-1 justify-center items-center">
        <Text className="text-gray-400 text-lg">Map View Coming Soon</Text>
      </View>

      {/* Bottom Navigation Bar */}
      <BottomNavBar activeTab="home" />
    </SafeAreaView>
  );
}
