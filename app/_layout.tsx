import { Stack } from "expo-router";
import "react-native-reanimated";
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack initialRouteName="index">
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="landing/splash" options={{ headerShown: false }} />
        <Stack.Screen name="landing/onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="landing/login" options={{ headerShown: false }} />
        <Stack.Screen name="landing/signup" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}
