import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { AuthProvider } from "../context/AuthContext";
import "../global.css";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="landing/splash" options={{ headerShown: false }} />
        <Stack.Screen name="landing/onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="landing/login" options={{ headerShown: false }} />
        <Stack.Screen name="landing/signup" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="light" />
    </AuthProvider>
  );
}
