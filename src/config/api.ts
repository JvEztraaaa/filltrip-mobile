import Constants from 'expo-constants';
import { Platform } from 'react-native';

export function resolveApiBase(): string {
  const envBase = (process.env.EXPO_PUBLIC_API_BASE
    || (Constants?.expoConfig as any)?.extra?.API_BASE
    || (Constants as any)?.manifest?.extra?.API_BASE
    || (Constants as any)?.manifest2?.extra?.API_BASE) as string | undefined;
  if (envBase) return envBase.replace(/\/?$/, '');

  if (Platform.OS === 'android') return 'http://10.0.2.2/filltrip-db';
  if (Platform.OS === 'web') return 'http://localhost/filltrip-db';
  return 'http://localhost/filltrip-db';
}

export const API_BASE = resolveApiBase();
