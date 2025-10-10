import { StyleSheet } from 'react-native';

// Color palette
const colors = {
  gray: {
    900: '#111827',
    800: '#1F2937',
    700: '#374151',
    600: '#4B5563',
    400: '#9CA3AF',
    300: '#D1D5DB',
  },
  blue: {
    500: '#3B82F6',
    400: '#60A5FA',
  },
  red: {
    500: '#EF4444',
  },
  white: '#FFFFFF',
  transparent: 'transparent',
};

// Base styles that match Tailwind classes
export const tw = StyleSheet.create({
  // Layout
  'flex-1': { flex: 1 },
  'items-center': { alignItems: 'center' },
  'justify-center': { justifyContent: 'center' },
  'justify-between': { justifyContent: 'space-between' },
  'flex-row': { flexDirection: 'row' },
  
  // Background colors
  'bg-gray-900': { backgroundColor: colors.gray[900] },
  'bg-gray-800': { backgroundColor: colors.gray[800] },
  'bg-gray-700': { backgroundColor: colors.gray[700] },
  'bg-gray-600': { backgroundColor: colors.gray[600] },
  'bg-blue-500': { backgroundColor: colors.blue[500] },
  'bg-blue-400': { backgroundColor: colors.blue[400] },
  'bg-transparent': { backgroundColor: colors.transparent },
  
  // Text colors
  'text-white': { color: colors.white },
  'text-gray-400': { color: colors.gray[400] },
  'text-gray-300': { color: colors.gray[300] },
  'text-blue-400': { color: colors.blue[400] },
  'text-blue-500': { color: colors.blue[500] },
  'text-red-500': { color: colors.red[500] },
  
  // Text sizes
  'text-xs': { fontSize: 12 },
  'text-base': { fontSize: 16 },
  'text-lg': { fontSize: 18 },
  'text-xl': { fontSize: 20 },
  'text-2xl': { fontSize: 24 },
  
  // Font weights
  'font-medium': { fontWeight: '500' },
  'font-semibold': { fontWeight: '600' },
  'font-bold': { fontWeight: 'bold' },
  
  // Padding
  'px-4': { paddingHorizontal: 16 },
  'px-6': { paddingHorizontal: 24 },
  'py-3': { paddingVertical: 12 },
  'py-4': { paddingVertical: 16 },
  'py-8': { paddingVertical: 32 },
  'p-1': { padding: 4 },
  
  // Margin
  'mb-2': { marginBottom: 8 },
  'mb-3': { marginBottom: 12 },
  'mb-4': { marginBottom: 16 },
  'mb-6': { marginBottom: 24 },
  'mb-8': { marginBottom: 32 },
  'mt-4': { marginTop: 16 },
  'mt-12': { marginTop: 48 },
  'mr-2': { marginRight: 8 },
  'mr-3': { marginRight: 12 },
  'mx-4': { marginHorizontal: 16 },
  'my-6': { marginVertical: 24 },
  
  // Border
  'border': { borderWidth: 1 },
  'border-2': { borderWidth: 2 },
  'border-gray-700': { borderColor: colors.gray[700] },
  'border-gray-600': { borderColor: colors.gray[600] },
  'border-blue-500': { borderColor: colors.blue[500] },
  'rounded-lg': { borderRadius: 8 },
  'rounded-md': { borderRadius: 6 },
  
  // Sizing
  'w-5': { width: 20 },
  'h-5': { height: 20 },
  'w-12': { width: 48 },
  'h-12': { height: 48 },
  'h-px': { height: 1 },
  
  // Text alignment
  'text-center': { textAlign: 'center' },
  
  // Gap (approximated with margin)
  'gap-4': { gap: 16 },
});

// Function to combine multiple styles
export const combineStyles = (...styles: any[]) => {
  return styles.filter(Boolean);
};