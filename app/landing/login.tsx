import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function LoginScreen() {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const GradientText = ({ children }: { children: React.ReactNode }) => {
    if (Platform.OS === 'web') {
      return (
        <Text 
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            background: 'linear-gradient(90deg, #00BFFF 0%, #1E90FF 50%, #4682B4 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          } as any}
        >
          {children}
        </Text>
      );
    }

    return (
      <Text 
        style={{
          fontSize: 20,
          fontWeight: 'bold',
          color: '#1E90FF',
        }}
      >
        {children}
      </Text>
    );
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await login({ email: email.trim(), password });
      if (result.success) {
        router.replace('/');
      } else {
        const errorMsg = typeof result.error === 'object' 
          ? result.error.message 
          : result.error || 'Login failed';
        Alert.alert('Login Failed', errorMsg);
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert('Coming Soon', `${provider} login will be available soon`);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-900">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Dark Background Section with Grid Pattern */}
          <View 
            className="bg-gray-900 pt-12 pb-8 px-6 relative"
            style={{
              backgroundImage: Platform.OS === 'web' ? 
                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.08) 1px, transparent 0)' : undefined,
              backgroundSize: Platform.OS === 'web' ? '20px 20px' : undefined,
            }}
          >
            {/* Main Radial Shine Effect - Top Right */}
            {Platform.OS === 'web' ? (
              <View 
                className="absolute top-0 right-0"
                style={{
                  width: 500,
                  height: 500,
                  background: 'radial-gradient(ellipse at top right, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.05) 25%, rgba(255, 255, 255, 0.03) 45%, rgba(255, 255, 255, 0.015) 65%, rgba(255, 255, 255, 0.008) 80%, transparent 100%)',
                  transform: [{ translateX: 180 }, { translateY: -180 }],
                } as any}
              />
            ) : (
              <View 
                className="absolute top-0 right-0"
                style={{
                  width: 350,
                  height: 350,
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  borderRadius: 175,
                  transform: [{ translateX: 120 }, { translateY: -120 }],
                }}
              />
            )}
            {/* Header - Left Aligned */}
            <View className="items-start mb-6">
              <View className="flex-row items-center mb-4">
                <Image 
                  source={require('../../assets/logo.svg')} 
                  style={{ 
                    width: 32, 
                    height: 32, 
                    marginRight: 8
                  }}
                />
                <GradientText>FillTrip</GradientText>
              </View>
              <Text className="text-white text-2xl font-bold mb-2">Get Started now</Text>
              <Text className="text-gray-400 text-sm leading-5 max-w-sm">
                Create an account or log in to explore Filltrip
              </Text>
            </View>
          </View>

          {/* White Form Section with Curved Top */}
          <View className="flex-1 bg-white" style={{ 
            borderTopLeftRadius: 24, 
            borderTopRightRadius: 24,
            marginTop: -12 
          }}>
            {/* Tab Navigation */}
            <View className="px-6 pt-6 mb-4">
              <View className="flex-row bg-gray-50 rounded-2xl p-1.5">
                <TouchableOpacity
                  className={`flex-1 py-2.5 rounded-xl items-center ${
                    activeTab === 'login' ? 'bg-teal-500 shadow-lg' : ''
                  }`}
                  onPress={() => setActiveTab('login')}
                >
                  <Text className={`font-semibold text-sm ${
                    activeTab === 'login' ? 'text-white' : 'text-gray-500'
                  }`}>
                    Log In
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-2.5 rounded-xl items-center ${
                    activeTab === 'signup' ? 'bg-teal-500 shadow-lg' : ''
                  }`}
                  onPress={() => {
                    setActiveTab('signup');
                    router.push('/landing/signup');
                  }}
                >
                  <Text className={`font-semibold text-sm ${
                    activeTab === 'signup' ? 'text-white' : 'text-gray-500'
                  }`}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Form */}
            <View className="px-6 space-y-3">
              {/* Email */}
              <View>
                <Text className="text-gray-700 mb-1.5 font-medium text-sm">Email</Text>
                <TextInput
                  className="bg-gray-50 text-gray-900 px-4 py-3 rounded-xl border border-gray-200 text-sm"
                  placeholder="john.doe@gmail.com"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Password */}
              <View>
                <Text className="text-gray-700 mb-1.5 font-medium text-sm">Password</Text>
                <View className="relative">
                  <TextInput
                    className="bg-gray-50 text-gray-900 px-4 py-3 rounded-xl border border-gray-200 text-sm pr-12"
                    placeholder="••••••••"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    className="absolute right-4 top-3"
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Image 
                      source={showPassword ? require('../../assets/hide.png') : require('../../assets/unhide.png')}
                      style={{ width: 20, height: 20 }}
                      resizeMode="contain"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Remember Me and Forgot Password */}
              <View className="flex-row justify-between items-center py-1">
                <TouchableOpacity
                  className="flex-row items-center"
                  onPress={() => setRememberMe(!rememberMe)}
                >
                  <View className={`w-4 h-4 rounded border-2 mr-2 items-center justify-center ${
                    rememberMe ? 'bg-teal-500 border-teal-500' : 'border-gray-300'
                  }`}>
                    {rememberMe && <Text className="text-white text-xs font-bold">✓</Text>}
                  </View>
                  <Text className="text-gray-600 text-sm">Remember me</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text className="text-teal-600 font-medium text-sm">Forgot Password ?</Text>
                </TouchableOpacity>
              </View>

              {/* Log In Button */}
              <TouchableOpacity
                className={`py-3.5 rounded-xl items-center mt-4 ${
                  loading ? 'bg-teal-400' : 'bg-teal-500'
                }`}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text className="text-white text-base font-semibold">
                  {loading ? 'Logging in...' : 'Log In'}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center my-4">
                <View className="flex-1 h-px bg-gray-200" />
                <Text className="mx-4 text-gray-400 text-sm">Or</Text>
                <View className="flex-1 h-px bg-gray-200" />
              </View>

              {/* Social Login Buttons */}
              <View className="flex-row gap-3 mb-6">
                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center py-3 border border-gray-200 rounded-xl bg-white"
                  onPress={() => handleSocialLogin('Google')}
                >
                  <Image 
                    source={require('../../assets/google.png')} 
                    style={{ 
                      width: 18, 
                      height: 18, 
                      marginRight: 8 
                    }}
                  />
                  <Text className="text-gray-700 font-medium text-sm">Google</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-1 flex-row items-center justify-center py-3 border border-gray-200 rounded-xl bg-white"
                  onPress={() => handleSocialLogin('Facebook')}
                >
                  <Image 
                    source={require('../../assets/facebook.png')} 
                    style={{ 
                      width: 18, 
                      height: 18, 
                      marginRight: 8 
                    }}
                  />
                  <Text className="text-gray-700 font-medium text-sm">Facebook</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}