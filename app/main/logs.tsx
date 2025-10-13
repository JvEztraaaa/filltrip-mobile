import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../src/config/api';
import AnimatedPageContainer from '../components/AnimatedPageContainer';
import BottomNavBar from '../components/BottomNavBar';

const { width: screenWidth } = Dimensions.get('window');

interface FuelEntry {
  id: number;
  createdAt: string;
  vehicleName: string;
  odometerKm: number;
  distanceUnit: string;
  liters: number;
  fuelUnit: string;
  pricePerLiter: number;
  totalCost: number;
  fuelType: string;
  station: string;
  currency: string;
}

interface GroupedEntries {
  key: string;
  label: string;
  items: FuelEntry[];
  totalEntries: number;
  totalCost: number;
  totalLiters: number;
}

export default function LogsScreen() {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [groupedEntries, setGroupedEntries] = useState<GroupedEntries[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [totalStats, setTotalStats] = useState({
    totalEntries: 0,
    totalCost: 0,
    totalLiters: 0,
  });

  // Form state for adding new entry
  const [formData, setFormData] = useState({
    vehicleName: '',
    odometerKm: '',
    liters: '',
    pricePerLiter: '',
    totalCost: '',
    fuelType: 'Gasoline / Unleaded (91)',
    station: '',
    currency: 'PHP',
  });

  const loadFuelEntries = useCallback(async (isRefresh = false) => {
    if (!currentUser) {
      setEntries([]);
      setGroupedEntries([]);
      setTotalStats({ totalEntries: 0, totalCost: 0, totalLiters: 0 });
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetch(`${API_BASE}/refuel_list.php`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.items)) {
        // Normalize data to ensure proper types
        const normalizedEntries = data.items.map((entry: any) => ({
          ...entry,
          id: parseInt(entry.id) || 0,
          odometerKm: parseFloat(entry.odometerKm) || 0,
          liters: parseFloat(entry.liters) || 0,
          pricePerLiter: parseFloat(entry.pricePerLiter) || 0,
          totalCost: parseFloat(entry.totalCost) || 0,
          distanceUnit: entry.distanceUnit || 'km',
          fuelUnit: entry.fuelUnit || 'liters',
          currency: entry.currency || 'PHP',
        }));
        
        setEntries(normalizedEntries);
        const grouped = groupEntriesByMonth(normalizedEntries);
        setGroupedEntries(grouped);
        
        // Calculate total stats
        const totalCost = normalizedEntries.reduce((sum: number, entry: FuelEntry) => sum + (entry.totalCost || 0), 0);
        const totalLiters = normalizedEntries.reduce((sum: number, entry: FuelEntry) => sum + (entry.liters || 0), 0);
        
        setTotalStats({
          totalEntries: normalizedEntries.length,
          totalCost: totalCost,
          totalLiters: totalLiters,
        });
      } else {
        console.error('Failed to load fuel entries:', data.error);
        setEntries([]);
        setGroupedEntries([]);
        setTotalStats({ totalEntries: 0, totalCost: 0, totalLiters: 0 });
      }
    } catch (error) {
      console.error('Error loading fuel entries:', error);
      Alert.alert('Error', 'Failed to load fuel entries. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser]);

  const groupEntriesByMonth = (entries: FuelEntry[]): GroupedEntries[] => {
    const groups: { [key: string]: FuelEntry[] } = {};
    
    for (const entry of entries) {
      if (!entry || typeof entry !== 'object' || !entry.createdAt) continue;
      
      const date = new Date(entry.createdAt);
      if (isNaN(date.getTime())) continue;
      
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(entry);
    }
    
    const ordered = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    
    return ordered.map(key => {
      const items = groups[key].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const totalCost = items.reduce((sum, entry) => sum + (entry.totalCost || 0), 0);
      const totalLiters = items.reduce((sum, entry) => sum + (entry.liters || 0), 0);
      
      return {
        key,
        label: new Date(`${key}-01T00:00:00`).toLocaleString(undefined, { 
          month: 'long', 
          year: 'numeric' 
        }),
        items,
        totalEntries: items.length,
        totalCost,
        totalLiters,
      };
    });
  };

  const handleAddEntry = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to add fuel entries');
      return;
    }

    // Validation
    if (!formData.vehicleName.trim() || !formData.odometerKm || !formData.liters || !formData.pricePerLiter) {
      Alert.alert('Validation Error', 'Please fill in all required fields');
      return;
    }

    const odometerKm = parseFloat(formData.odometerKm);
    const liters = parseFloat(formData.liters);
    const pricePerLiter = parseFloat(formData.pricePerLiter);

    if (odometerKm <= 0 || liters <= 0 || pricePerLiter <= 0) {
      Alert.alert('Validation Error', 'Odometer, liters, and price must be positive numbers');
      return;
    }

    try {
      const calculatedTotalCost = formData.totalCost ? parseFloat(formData.totalCost) : liters * pricePerLiter;

      const response = await fetch(`${API_BASE}/refuel_add.php`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vehicleName: formData.vehicleName.trim(),
          odometerKm: odometerKm,
          distanceUnit: 'km',
          liters: liters,
          fuelUnit: 'liters',
          pricePerLiter: pricePerLiter,
          totalCost: calculatedTotalCost,
          fuelType: formData.fuelType,
          station: formData.station.trim(),
          currency: formData.currency,
          createdAt: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setIsAddModalOpen(false);
        setFormData({
          vehicleName: '',
          odometerKm: '',
          liters: '',
          pricePerLiter: '',
          totalCost: '',
          fuelType: 'Gasoline / Unleaded (91)',
          station: '',
          currency: 'PHP',
        });
        await loadFuelEntries();
        Alert.alert('Success', 'Fuel entry added successfully!');
      } else {
        throw new Error(data.error || 'Failed to add fuel entry');
      }
    } catch (error) {
      console.error('Error adding fuel entry:', error);
      Alert.alert('Error', 'Failed to add fuel entry. Please try again.');
    }
  };

  const deleteFuelEntry = async (id: number) => {
    try {
      const formData = new FormData();
      formData.append('id', id.toString());

      const response = await fetch(`${API_BASE}/refuel_delete.php`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.deleted) {
        await loadFuelEntries();
        Alert.alert('Success', 'Fuel entry deleted successfully!');
      } else {
        Alert.alert('Error', 'Failed to delete fuel entry');
      }
    } catch (error) {
      console.error('Error deleting fuel entry:', error);
      Alert.alert('Error', 'Failed to delete fuel entry. Please try again.');
    }
  };

  const confirmDeleteEntry = (entry: FuelEntry) => {
    Alert.alert(
      'Delete Fuel Entry',
      `Are you sure you want to delete the fuel entry for ${entry.vehicleName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteFuelEntry(entry.id)
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: { [key: string]: string } = { PHP: '₱', USD: '$' };
    const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
    const safeCurrency = currency || 'PHP';
    return `${symbols[safeCurrency] || safeCurrency}${safeAmount.toFixed(2)}`;
  };

  const safeNumber = (value: any, defaultValue: number = 0): number => {
    const num = typeof value === 'number' ? value : parseFloat(value);
    return !isNaN(num) ? num : defaultValue;
  };

  // Auto-calculate total cost when liters or price changes
  useEffect(() => {
    const liters = parseFloat(formData.liters) || 0;
    const pricePerLiter = parseFloat(formData.pricePerLiter) || 0;
    if (liters > 0 && pricePerLiter > 0) {
      setFormData(prev => ({
        ...prev,
        totalCost: (liters * pricePerLiter).toFixed(2)
      }));
    }
  }, [formData.liters, formData.pricePerLiter]);

  useEffect(() => {
    loadFuelEntries();
  }, [loadFuelEntries]);

  const onRefresh = () => {
    loadFuelEntries(true);
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <AnimatedPageContainer>
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateIcon}>🔐</Text>
            <Text style={styles.emptyStateTitle}>Sign In Required</Text>
            <Text style={styles.emptyStateText}>
              Please sign in to track your fuel history and monitor your vehicle's consumption patterns.
            </Text>
          </View>
        </AnimatedPageContainer>
        <BottomNavBar activeTab="logs" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedPageContainer>
        {/* Header with Add Button */}
        <View style={styles.headerContainer}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Fuel History</Text>
            <Text style={styles.subtitle}>
              Keep track of every fuel-up to monitor your vehicle's consumption patterns and fuel costs over time
            </Text>
          </View>
          
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => setIsAddModalOpen(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>+ Add Entry</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        {totalStats.totalEntries > 0 && (
          <Animated.View 
            entering={FadeInDown.duration(300)}
            style={styles.statsContainer}
          >
            <Text style={styles.statsTitle}>TOTAL ENTRIES</Text>
            <Text style={styles.statsCount}>{totalStats.totalEntries}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{safeNumber(totalStats.totalLiters).toFixed(1)} L</Text>
                <Text style={styles.statLabel}>TOTAL FUEL</Text>
              </View>
              <View style={styles.statSeparator} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatCurrency(totalStats.totalCost, 'PHP')}</Text>
                <Text style={styles.statLabel}>TOTAL COST</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Fuel Entries List */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#4FD1C5"
              colors={['#4FD1C5']}
            />
          }
        >
          {isLoading && entries.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading fuel entries...</Text>
            </View>
          ) : groupedEntries.length === 0 ? (
            <Animated.View 
              entering={FadeInDown.duration(500)}
              style={styles.emptyStateContainer}
            >
              <Text style={styles.emptyStateIcon}>⛽</Text>
              <Text style={styles.emptyStateTitle}>No Fuel Entries Yet</Text>
              <Text style={styles.emptyStateText}>
                Start tracking your fuel consumption by adding your first fill-up entry!
              </Text>
            </Animated.View>
          ) : (
            groupedEntries.filter(group => group && group.items && Array.isArray(group.items)).map((group, groupIndex) => (
              <Animated.View
                key={group.key}
                entering={FadeInDown.duration(300).delay(groupIndex * 100)}
                style={styles.monthGroup}
              >
                {/* Month Header */}
                <View style={styles.monthHeader}>
                  <Text style={styles.monthTitle}>{group.label}</Text>
                  <View style={styles.monthStats}>
                    <Text style={styles.monthStatsText}>
                      {group.totalEntries} entr{group.totalEntries !== 1 ? 'ies' : 'y'} • {safeNumber(group.totalLiters).toFixed(1)} L • {formatCurrency(group.totalCost, 'PHP')}
                    </Text>
                  </View>
                </View>

                {/* Entry Items */}
                {(group.items || []).filter(entry => entry && typeof entry === 'object').map((entry, entryIndex) => (
                  <Animated.View
                    key={entry.id}
                    entering={FadeInDown.duration(200).delay((groupIndex * 100) + (entryIndex * 50))}
                    exiting={FadeOutUp.duration(200)}
                    style={styles.entryCard}
                  >
                    {entryIndex === 0 && (
                      <View style={styles.latestEntryBadge}>
                        <Text style={styles.latestEntryText}>Latest</Text>
                      </View>
                    )}
                    
                    {/* Vehicle Info */}
                    <View style={styles.vehicleInfo}>
                      <Text style={styles.vehicleName}>{entry.vehicleName}</Text>
                      <Text style={styles.entryDate}>{formatDate(entry.createdAt)}</Text>
                    </View>

                    {/* Entry Details */}
                    <View style={styles.entryDetails}>
                      <Text style={styles.entryOdometer}>📍 {safeNumber(entry.odometerKm).toFixed(0)} {entry.distanceUnit}</Text>
                      <Text style={styles.entryFuelType}>⛽ {entry.fuelType}</Text>
                      {entry.station && (
                        <Text style={styles.entryStation}>🏪 {entry.station}</Text>
                      )}
                    </View>

                    {/* Entry Metrics */}
                    <View style={styles.entryMetrics}>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Fuel</Text>
                        <Text style={styles.metricValue}>{safeNumber(entry.liters).toFixed(1)} L</Text>
                      </View>
                      
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Price/L</Text>
                        <Text style={styles.metricValue}>{formatCurrency(entry.pricePerLiter, entry.currency)}</Text>
                      </View>
                      
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Total</Text>
                        <Text style={styles.metricValue}>{formatCurrency(entry.totalCost, entry.currency)}</Text>
                      </View>
                    </View>

                    {/* Delete Button */}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => confirmDeleteEntry(entry)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.deleteButtonText}>🗑️</Text>
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </Animated.View>
            ))
          )}
        </ScrollView>
      </AnimatedPageContainer>
      <BottomNavBar activeTab="logs" />

      {/* Add Entry Modal */}
      <Modal
        visible={isAddModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsAddModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            entering={FadeInDown.duration(300)}
            exiting={FadeOutUp.duration(200)}
            style={styles.modalContainer}
          >
            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Add Fuel Entry</Text>
              
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Vehicle Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Toyota Vios 2020"
                  placeholderTextColor="#94A3B8"
                  value={formData.vehicleName}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, vehicleName: text }))}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Odometer (km) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="25000"
                    placeholderTextColor="#94A3B8"
                    value={formData.odometerKm}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, odometerKm: text }))}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.formLabel}>Fuel (L) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="45.5"
                    placeholderTextColor="#94A3B8"
                    value={formData.liters}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, liters: text }))}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.formLabel}>Price/L *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="57.50"
                    placeholderTextColor="#94A3B8"
                    value={formData.pricePerLiter}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, pricePerLiter: text }))}
                    keyboardType="numeric"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.formLabel}>Total Cost</Text>
                  <TextInput
                    style={[styles.formInput, styles.calculatedInput]}
                    placeholder="0.00"
                    placeholderTextColor="#94A3B8"
                    value={formData.totalCost}
                    onChangeText={(text) => setFormData(prev => ({ ...prev, totalCost: text }))}
                    keyboardType="numeric"
                    editable={false}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Fuel Type</Text>
                <TouchableOpacity style={styles.formInput}>
                  <Text style={styles.formInputText}>{formData.fuelType}</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Gas Station</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Shell, Petron, Caltex"
                  placeholderTextColor="#94A3B8"
                  value={formData.station}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, station: text }))}
                />
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setIsAddModalOpen(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleAddEntry}
                >
                  <Text style={styles.saveButtonText}>Add Entry</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  // Header Section
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    backgroundColor: '#0F172A',
  },
  headerText: {
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#4FD1C5',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 14,
    shadowColor: '#4FD1C5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    alignSelf: 'center',
  },
  addButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  // Stats Overview
  statsContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  statsCount: {
    fontSize: 48,
    fontWeight: '900',
    color: '#4FD1C5',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statSeparator: {
    width: 2,
    height: 40,
    backgroundColor: 'rgba(79, 209, 197, 0.3)',
    borderRadius: 1,
  },
  // List Section
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
  },
  loadingText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '500',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    fontSize: 80,
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 16,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 280,
  },
  // Month Groups
  monthGroup: {
    marginBottom: 32,
  },
  monthHeader: {
    marginBottom: 16,
  },
  monthTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  monthStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthStatsText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '500',
  },
  // Entry Cards
  entryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#334155',
    position: 'relative',
    overflow: 'hidden',
  },
  latestEntryBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#4FD1C5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    shadowColor: '#4FD1C5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  latestEntryText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  vehicleInfo: {
    marginBottom: 16,
    paddingRight: 60,
  },
  vehicleName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 6,
  },
  entryDate: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  entryDetails: {
    marginBottom: 20,
  },
  entryOdometer: {
    fontSize: 15,
    color: '#94A3B8',
    marginBottom: 4,
    fontWeight: '500',
  },
  entryFuelType: {
    fontSize: 15,
    color: '#94A3B8',
    marginBottom: 4,
    fontWeight: '500',
  },
  entryStation: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
  },
  entryMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    padding: 16,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4FD1C5',
  },
  deleteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  deleteButtonText: {
    fontSize: 18,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(79, 209, 197, 0.2)',
  },
  modalContent: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 32,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4FD1C5',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  formInput: {
    borderWidth: 2,
    borderColor: 'rgba(79, 209, 197, 0.3)',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F1F5F9',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    fontWeight: '500',
  },
  calculatedInput: {
    backgroundColor: 'rgba(79, 209, 197, 0.1)',
    borderColor: 'rgba(79, 209, 197, 0.5)',
    color: '#4FD1C5',
  },
  formInputText: {
    fontSize: 16,
    color: '#F1F5F9',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 24,
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(79, 209, 197, 0.2)',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'rgba(71, 85, 105, 0.5)',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(71, 85, 105, 0.8)',
  },
  saveButton: {
    backgroundColor: '#4FD1C5',
    marginLeft: 12,
    shadowColor: '#4FD1C5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#94A3B8',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
});
