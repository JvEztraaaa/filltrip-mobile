import React, { useContext, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import AnimatedPageContainer from '../components/AnimatedPageContainer';
import BottomNavBar from '../components/BottomNavBar';

type TabType = 'profile' | 'security';

export default function ProfileScreen() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('ProfileScreen must be used within an AuthProvider');
  }
  const { currentUser, logout } = context;
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: currentUser?.firstName || '',
    lastName: currentUser?.lastName || '',
    username: currentUser?.username || '',
    email: currentUser?.email || ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const showMessage = (message: string, isError = false) => {
    if (isError) {
      setError(message);
      setNotice('');
    } else {
      setNotice(message);
      setError('');
    }
    setTimeout(() => {
      setError('');
      setNotice('');
    }, 5000);
  };

  const saveProfile = async () => {
    if (!profileForm.firstName.trim() || !profileForm.email.trim()) {
      showMessage('Please fill in required fields', true);
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('firstName', profileForm.firstName);
      formData.append('lastName', profileForm.lastName);
      formData.append('username', profileForm.username);
      formData.append('email', profileForm.email);

      const response = await fetch('https://filltrip.com/filltrip-db/profile_update.php', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('Profile updated successfully!');
      } else {
        showMessage(data.message || 'Failed to update profile', true);
      }
    } catch (error) {
      showMessage('Network error occurred', true);
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      showMessage('Please fill in all password fields', true);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('New passwords do not match', true);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      showMessage('New password must be at least 6 characters', true);
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('currentPassword', passwordForm.currentPassword);
      formData.append('newPassword', passwordForm.newPassword);

      const response = await fetch('https://filltrip.com/filltrip-db/password_update.php', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();
      
      if (data.success) {
        showMessage('Password updated successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        showMessage(data.message || 'Failed to update password', true);
      }
    } catch (error) {
      showMessage('Network error occurred', true);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: logout
        }
      ]
    );
  };

  const TabButton = ({ tab, title }: { tab: TabType; title: string }) => (
    <TouchableOpacity
      style={[
        styles.tabButton,
        activeTab === tab && styles.activeTabButton
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <Text style={[
        styles.tabButtonText,
        activeTab === tab && styles.activeTabButtonText
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderProfileTab = () => (
    <View style={styles.tabContent}>
      {/* Profile Form */}
      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>First name *</Text>
          <TextInput
            style={styles.input}
            value={profileForm.firstName}
            onChangeText={(text) => setProfileForm({ ...profileForm, firstName: text })}
            placeholder="Enter first name"
            placeholderTextColor="#64748B"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Last name</Text>
          <TextInput
            style={styles.input}
            value={profileForm.lastName}
            onChangeText={(text) => setProfileForm({ ...profileForm, lastName: text })}
            placeholder="Enter last name"
            placeholderTextColor="#64748B"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            value={profileForm.username}
            onChangeText={(text) => setProfileForm({ ...profileForm, username: text })}
            placeholder="Enter username"
            placeholderTextColor="#64748B"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            value={profileForm.email}
            onChangeText={(text) => setProfileForm({ ...profileForm, email: text })}
            placeholder="Enter email address"
            placeholderTextColor="#64748B"
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          onPress={saveProfile}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Save changes</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSecurityTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.formSection}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Current password</Text>
          <TextInput
            style={styles.input}
            value={passwordForm.currentPassword}
            onChangeText={(text) => setPasswordForm({ ...passwordForm, currentPassword: text })}
            placeholder="Enter current password"
            placeholderTextColor="#64748B"
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>New password</Text>
          <TextInput
            style={styles.input}
            value={passwordForm.newPassword}
            onChangeText={(text) => setPasswordForm({ ...passwordForm, newPassword: text })}
            placeholder="Enter new password"
            placeholderTextColor="#64748B"
            secureTextEntry
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Confirm new password</Text>
          <TextInput
            style={styles.input}
            value={passwordForm.confirmPassword}
            onChangeText={(text) => setPasswordForm({ ...passwordForm, confirmPassword: text })}
            placeholder="Confirm new password"
            placeholderTextColor="#64748B"
            secureTextEntry
          />
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[
            styles.saveButton, 
            (saving || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword) && styles.disabledButton
          ]}
          onPress={savePassword}
          disabled={saving || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Update password</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedPageContainer>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Account Settings</Text>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabsContainer}>
            <TabButton tab="profile" title="Profile" />
            <TabButton tab="security" title="Security" />
          </View>

          {/* Notification Message */}
          {(notice || error) && (
            <View style={[
              styles.messageContainer,
              error ? styles.errorContainer : styles.successContainer
            ]}>
              <Text style={[
                styles.messageText,
                error ? styles.errorText : styles.successText
              ]}>
                {notice || error}
              </Text>
            </View>
          )}

          {/* Tab Content */}
          {activeTab === 'profile' ? renderProfileTab() : renderSecurityTab()}
        </ScrollView>
      </AnimatedPageContainer>
      <BottomNavBar activeTab="profile" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E293B',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#DC2626',
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  tabButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  activeTabButton: {
    backgroundColor: '#374151',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  activeTabButtonText: {
    color: '#FFFFFF',
  },
  messageContainer: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  successContainer: {
    backgroundColor: 'rgba(6, 78, 59, 0.3)',
    borderColor: 'rgba(13, 148, 136, 0.5)',
  },
  errorContainer: {
    backgroundColor: 'rgba(127, 29, 29, 0.3)',
    borderColor: 'rgba(220, 38, 38, 0.5)',
  },
  messageText: {
    fontSize: 14,
  },
  successText: {
    color: '#A7F3D0',
  },
  errorText: {
    color: '#FCA5A5',
  },
  tabContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Extra space for bottom nav
  },
  formSection: {
    gap: 16,
  },
  inputGroup: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'rgba(17, 24, 39, 0.6)',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#FFFFFF',
  },
  buttonSection: {
    marginTop: 24,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#14B8A6',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#374151',
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
