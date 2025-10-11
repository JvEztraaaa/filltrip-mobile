import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function resolveApiBase(): string {
  const envBase = (process.env.EXPO_PUBLIC_API_BASE
    || (Constants?.expoConfig as any)?.extra?.API_BASE
    || (Constants as any)?.manifest?.extra?.API_BASE
    || (Constants as any)?.manifest2?.extra?.API_BASE) as string | undefined;
  if (envBase) return envBase.replace(/\/?$/, '');

  // Try to derive LAN IP from Expo dev server for physical devices
  const hostUri: string | undefined = (Constants as any)?.expoConfig?.hostUri || (Constants as any)?.manifest?.hostUri;
  if (hostUri) {
    // hostUri examples: 192.168.1.10:8081, 192.168.1.10:19000
    const host = hostUri.split(':')[0];
    if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
      return `http://${host}/filltrip-db`;
    }
  }

  // Fallbacks
  if (Platform.OS === 'android') return 'http://10.0.2.2/filltrip-db'; // Android emulator to host
  if (Platform.OS === 'web') return 'http://localhost/filltrip-db';
  // iOS simulator or default
  return 'http://127.0.0.1/filltrip-db';
}

export const API_BASE = resolveApiBase();
