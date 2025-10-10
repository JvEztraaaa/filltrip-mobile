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

export default function SignupScreen() {
  const [activeTab, setActiveTab] = useState('signup');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

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

  const handleSignup = async () => {
    if (!firstName.trim() || !lastName.trim() || !username.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const result = await signup({ 
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        username: username.trim(),
        email: email.trim(), 
        password 
      });
      if (result.success) {
        router.replace('/');
      } else {
        const errorMsg = typeof result.error === 'object' 
          ? result.error.message 
          : result.error || 'Signup failed';
        Alert.alert('Signup Failed', errorMsg);
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
            {/* Single Radial Shine Effect - Top Right */}
            {Platform.OS === 'web' ? (
              <View 
                className="absolute top-0 right-0"
                style={{
                  width: 500,
                  height: 500,
                  background: 'radial-gradient(ellipse at top right, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.12) 20%, rgba(255, 255, 255, 0.08) 35%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.03) 65%, rgba(255, 255, 255, 0.015) 75%, rgba(255, 255, 255, 0.008) 85%, rgba(255, 255, 255, 0.003) 92%, transparent 100%)',
                  transform: [{ translateX: 200 }, { translateY: -200 }],
                } as any}
              />
            ) : (
              <View 
                className="absolute top-0 right-0"
                style={{
                  width: 300,
                  height: 300,
                  backgroundColor: 'rgba(255, 255, 255, 0.08)',
                  borderRadius: 150,
                  transform: [{ translateX: 100 }, { translateY: -100 }],
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
              <Text className="text-white text-2xl font-bold mb-2">Create your account</Text>
              <Text className="text-gray-400 text-sm leading-5 max-w-sm">
                Already have an account? <Text onPress={() => router.push('/landing/login')} className="text-teal-400">Log in</Text>
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
                  onPress={() => {
                    setActiveTab('login');
                    router.push('/landing/login');
                  }}
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
                  onPress={() => setActiveTab('signup')}
                >
                  <Text className={`font-semibold text-sm ${
                    activeTab === 'signup' ? 'text-white' : 'text-gray-500'
                  }`}>
                    Sign Up
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Signup Form */}
            <View className="px-6 space-y-3">
              {/* First Name and Last Name */}
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-gray-700 mb-2 font-medium text-sm">First Name</Text>
                  <TextInput
                    className="bg-gray-50 text-gray-900 px-4 py-3 rounded-xl border border-gray-200 text-sm"
                    placeholder="John"
                    placeholderTextColor="#9CA3AF"
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-700 mb-2 font-medium text-sm">Last Name</Text>
                  <TextInput
                    className="bg-gray-50 text-gray-900 px-4 py-3 rounded-xl border border-gray-200 text-sm"
                    placeholder="Doe"
                    placeholderTextColor="#9CA3AF"
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Username */}
              <View>
                <Text className="text-gray-700 mb-2 font-medium text-sm">Username</Text>
                <TextInput
                  className="bg-gray-50 text-gray-900 px-4 py-3 rounded-xl border border-gray-200 text-sm"
                  placeholder="johndoe"
                  placeholderTextColor="#9CA3AF"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* Email */}
              <View>
                <Text className="text-gray-700 mb-2 font-medium text-sm">Email address</Text>
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
                <Text className="text-gray-700 mb-2 font-medium text-sm">Password</Text>
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

              {/* Spacer */}
              <View style={{ height: 4 }} />

              {/* Sign Up Button */}
              <TouchableOpacity
                className={`py-3.5 rounded-xl items-center ${
                  loading ? 'bg-teal-400' : 'bg-teal-500'
                }`}
                onPress={handleSignup}
                disabled={loading}
              >
                <Text className="text-white text-base font-semibold">
                  {loading ? 'Creating Account...' : 'Sign up'}
                </Text>
              </TouchableOpacity>

              {/* Divider */}
              <View className="flex-row items-center my-5">
                <View className="flex-1 h-px bg-gray-200" />
                <Text className="mx-4 text-gray-400 text-sm">Or</Text>
                <View className="flex-1 h-px bg-gray-200" />
              </View>

              {/* Social Login Buttons */}
              <View className="flex-row gap-3 mb-8">
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
  