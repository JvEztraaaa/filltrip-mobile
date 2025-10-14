import * as Haptics from 'expo-haptics';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../src/config/api';
import { carModelsPH, motorcycleModelsPH } from '../../src/data/fuelEfficiency';
import AnimatedPageContainer from '../components/AnimatedPageContainer';
import BottomNavBar from '../components/BottomNavBar';

const { width: screenWidth } = Dimensions.get('window');

interface Vehicle {
  id: string;
  make: string;
  model: string;
  typicalYears: string;
  kmPerLiterAvg: number;
  category: 'Car' | 'Moto';
}

export default function CalculatorScreen() {
  const params = useLocalSearchParams();
  const { currentUser } = useAuth();
  
  // Check if this calculation came from map page (has start/end locations)
  const isFromMapRoute = !!(params.distanceKm && params.startName && params.endName);
  
  // Form state
  const [distance, setDistance] = useState('');
  const [distanceUnit, setDistanceUnit] = useState('km');
  const [efficiency, setEfficiency] = useState('');
  const [efficiencyUnit, setEfficiencyUnit] = useState('km/L');
  const [fuelType, setFuelType] = useState('Gasoline / Unleaded (91)');
  const [fuelPrice, setFuelPrice] = useState('');
  const [currency, setCurrency] = useState('PHP');
  
  // Vehicle search state
  const [vehicleQuery, setVehicleQuery] = useState('');
  const [vehicleOptions, setVehicleOptions] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
  
  // Results state
  const [results, setResults] = useState<{
    litersNeeded: number;
    cost: number;
    currency: string;
  } | null>(null);
  const [tripSaved, setTripSaved] = useState(false);
  
  // Modal states
  const [showDistanceUnitModal, setShowDistanceUnitModal] = useState(false);
  const [showEfficiencyUnitModal, setShowEfficiencyUnitModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showFuelTypeModal, setShowFuelTypeModal] = useState(false);
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Constants
  const distanceUnits = ['km', 'miles'];
  const efficiencyUnits = ['km/L', 'mpg'];
  const currencies = ['PHP', 'USD'];
  const currencySymbols = { PHP: '₱', USD: '$' };
  const fuelTypes = [
    'Gasoline / Unleaded (91)',
    'Gasoline / Unleaded (95)',
    'Diesel',
    'Premium Gasoline (98)'
  ];
  
  // Load distance from route params if available
  useEffect(() => {
    if (params.distanceKm) {
      setDistance(String(params.distanceKm));
      setDistanceUnit('km');
    }
  }, [params.distanceKm]);
  
  // Close vehicle dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setShowVehicleDropdown(false);
    };
    
    if (showVehicleDropdown) {
      // Add a small delay to prevent immediate closing
      const timer = setTimeout(() => {
        // This is a simple approach - in a real app you might want more sophisticated outside click detection
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showVehicleDropdown]);
  
  // Vehicle search functionality
  useEffect(() => {
    const query = vehicleQuery.trim().toLowerCase();
    if (query.length < 2) {
      setVehicleOptions([]);
      return;
    }
    
    const tokens = query.split(/\s+/).filter(Boolean);
    const pool: Vehicle[] = [
      ...carModelsPH.map(c => ({ ...c, category: 'Car' as const })),
      ...motorcycleModelsPH.map(m => ({ ...m, category: 'Moto' as const }))
    ];
    
    const matches = pool
      .map(item => {
        const searchText = `${item.make} ${item.model}`.toLowerCase();
        if (!tokens.every(token => searchText.includes(token))) return null;
        
        let score = 0;
        tokens.forEach(token => {
          if (searchText.startsWith(token)) score += 15;
          if (searchText.includes(token)) score += 8;
        });
        
        return { ...item, score };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.score || 0) - (a?.score || 0))
      .slice(0, 10)
      .map(item => ({
        id: item!.id,
        make: item!.make,
        model: item!.model,
        typicalYears: item!.typicalYears,
        kmPerLiterAvg: item!.kmPerLiterAvg,
        category: item!.category
      }));
    
    setVehicleOptions(matches);
  }, [vehicleQuery]);
  
  // Helper functions
  const milesToKm = (miles: number) => miles * 1.60934;
  const toLitersPer100km = (value: number, unit: string) => {
    if (!value || value <= 0) return 0;
    switch (unit) {
      case 'km/L': return 100 / value;
      case 'mpg': return 235.214583 / value;
      default: return 0;
    }
  };
  
  const canCalculate = useMemo(() => {
    return distance && efficiency && fuelPrice && parseFloat(distance) > 0 && parseFloat(efficiency) > 0 && parseFloat(fuelPrice) > 0;
  }, [distance, efficiency, fuelPrice]);
  
  const handleVehicleSelect = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setVehicleQuery(`${vehicle.typicalYears.split('-')[0]} ${vehicle.make} ${vehicle.model}`);
    setEfficiency(vehicle.kmPerLiterAvg.toFixed(2));
    setEfficiencyUnit('km/L');
    setShowVehicleDropdown(false);
  };
  
  const performCalculation = async () => {
    if (!canCalculate) {
      Alert.alert('Error', 'Please fill all required fields with valid values.');
      return;
    }
    
    const distanceValue = parseFloat(distance);
    const efficiencyValue = parseFloat(efficiency);
    const priceValue = parseFloat(fuelPrice);
    
    let distanceKm = distanceUnit === 'km' ? distanceValue : milesToKm(distanceValue);
    const l100 = toLitersPer100km(efficiencyValue, efficiencyUnit);
    const litersNeeded = (distanceKm / 100) * l100;
    const cost = litersNeeded * priceValue;
    
    setResults({
      litersNeeded,
      cost,
      currency
    });
    
    // Save trip if this calculation came from map route and user is logged in
    if (isFromMapRoute && currentUser) {
      await saveTrip({
        startLocationName: String(params.startName),
        endLocationName: String(params.endName),
        distanceKm: distanceKm,
        efficiencyKmPerL: efficiencyValue,
        litersNeeded: litersNeeded,
        pricePerLiter: priceValue,
        fuelCost: cost,
        currency: currency,
        fuelType: fuelType,
        vehicleLabel: selectedVehicle ? 
          `${selectedVehicle.typicalYears.split('-')[0]} ${selectedVehicle.make} ${selectedVehicle.model}` : 
          ''
      });
    }
    
    // Animate results
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.back(1.1)),
        useNativeDriver: true,
      }),
    ]).start();
  };

  const saveTrip = async (tripData: any) => {
    try {
      const response = await fetch(`${API_BASE}/trips_add.php`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tripData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        // Show success indicator
        setTripSaved(true);
        setTimeout(() => setTripSaved(false), 3000); // Hide after 3 seconds
        console.log('Trip saved successfully:', data.trip);
      } else {
        console.error('Failed to save trip:', data.error);
      }
    } catch (error) {
      console.error('Error saving trip:', error);
      // Don't show error to user - trip saving is secondary functionality
    }
  };
  
  const clearForm = () => {
    setDistance('');
    setEfficiency('');
    setFuelPrice('');
    setVehicleQuery('');
    setSelectedVehicle(null);
    setResults(null);
    setTripSaved(false);
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
  };
  
  const resetToDefaults = () => {
    setDistance(params.distanceKm ? String(params.distanceKm) : '');
    setDistanceUnit('km');
    setEfficiency('');
    setEfficiencyUnit('km/L');
    setFuelType('Gasoline / Unleaded (91)');
    setFuelPrice('');
    setCurrency('PHP');
    setVehicleQuery('');
    setSelectedVehicle(null);
    setResults(null);
    setTripSaved(false);
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
  };

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedPageContainer>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Fuel Calculator</Text>
            <Text style={styles.subtitle}>
              Calculate your fuel consumption and costs
            </Text>
            {isFromMapRoute && (
              <View style={styles.routeBadge}>
                <Text style={styles.routeBadgeText}>
                  📍 Route: {params.startName} → {params.endName}
                </Text>
                {currentUser && (
                  <Text style={styles.routeBadgeSubtext}>
                    This trip will be automatically saved
                  </Text>
                )}
              </View>
            )}
          </View>
          
          {/* Vehicle Search Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Vehicle</Text>
              <Text style={styles.sectionSubtitle}>
                {selectedVehicle 
                  ? 'Vehicle selected! Efficiency auto-filled below.' 
                  : 'Search models for auto-fill efficiency or enter manually below'
                }
              </Text>
            </View>
            
            <View style={styles.vehicleSearchContainer}>
              <View style={styles.searchInputRow}>
                <TextInput
                  style={[styles.input, styles.searchInput, selectedVehicle && styles.inputWithVehicle]}
                  placeholder="Search vehicle model"
                  placeholderTextColor="#94A3B8"
                  value={vehicleQuery}
                  onChangeText={setVehicleQuery}
                  onFocus={() => setShowVehicleDropdown(true)}
                />
                <TouchableOpacity 
                  style={styles.clearButtonInline} 
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setVehicleQuery('');
                    setSelectedVehicle(null);
                    setEfficiency('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.clearButtonText}>Clear</Text>
                </TouchableOpacity>
              </View>
              

            </View>
          </View>
          
          {/* Trip Details Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trip Details</Text>
              <Text style={styles.sectionSubtitle}>Enter your distance and fuel efficiency</Text>
            </View>
            
            {/* Distance Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Distance</Text>
              <View style={styles.inputWithUnit}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  placeholder="150"
                  placeholderTextColor="#94A3B8"
                  value={distance}
                  onChangeText={setDistance}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.unitButton}
                  onPress={() => setShowDistanceUnitModal(true)}
                >
                  <Text style={styles.unitButtonText}>{distanceUnit}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.inputHint}>One-way distance from your starting point to destination</Text>
            </View>
            
            {/* Efficiency Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Efficiency</Text>
              <View style={styles.inputWithUnit}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  placeholder="15"
                  placeholderTextColor="#94A3B8"
                  value={efficiency}
                  onChangeText={setEfficiency}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.unitButton}
                  onPress={() => setShowEfficiencyUnitModal(true)}
                >
                  <Text style={styles.unitButtonText}>{efficiencyUnit}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.inputHint}>Average consumption based on your vehicle's specifications</Text>
            </View>
          </View>
          
          {/* Fuel Type & Price Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Fuel Type & Price</Text>
              <Text style={styles.sectionSubtitle}>Select fuel type and enter current price</Text>
            </View>
            
            {/* Fuel Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Fuel Type</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowFuelTypeModal(true)}
              >
                <Text style={styles.selectButtonText}>{fuelType}</Text>
              </TouchableOpacity>
            </View>
            
            {/* Price Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price per Liter</Text>
              <View style={styles.inputWithUnit}>
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  placeholder="56"
                  placeholderTextColor="#94A3B8"
                  value={fuelPrice}
                  onChangeText={setFuelPrice}
                  keyboardType="numeric"
                />
                <TouchableOpacity
                  style={styles.unitButton}
                  onPress={() => setShowCurrencyModal(true)}
                >
                  <Text style={styles.unitButtonText}>{currency}</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.inputHint}>Prices vary by station; enter your actual price for accuracy</Text>
            </View>
          </View>
          
          {/* Action Buttons */}
          <View style={styles.actionSection}>
            <TouchableOpacity
              style={[styles.calculateButton, !canCalculate && styles.calculateButtonDisabled]}
              onPress={() => {
                if (canCalculate) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  performCalculation();
                }
              }}
              disabled={!canCalculate}
              activeOpacity={0.7}
            >
              <Text style={[styles.calculateButtonText, !canCalculate && styles.calculateButtonTextDisabled]}>
                Calculate Fuel Cost
              </Text>
            </TouchableOpacity>
            
            {!canCalculate && (
              <View style={styles.validationHint}>
                <Text style={styles.validationText}>
                  Please fill in: 
                  {!distance || parseFloat(distance) <= 0 ? ' Distance' : ''}
                  {!efficiency || parseFloat(efficiency) <= 0 ? ' Efficiency' : ''}
                  {!fuelPrice || parseFloat(fuelPrice) <= 0 ? ' Fuel Price' : ''}
                </Text>
              </View>
            )}
            
            <View style={styles.secondaryActions}>
              <TouchableOpacity style={styles.secondaryButton} onPress={clearForm}>
                <Text style={styles.secondaryButtonText}>Clear All</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.secondaryButton} onPress={resetToDefaults}>
                <Text style={styles.secondaryButtonText}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Results Section */}
          {results && (
            <Animated.View 
              style={[
                styles.resultsSection,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Calculation Results</Text>
                <Text style={styles.sectionSubtitle}>Your fuel consumption and cost breakdown</Text>
              </View>
              
              <View style={styles.resultsContainer}>
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Fuel Needed</Text>
                  <Text style={styles.resultValue}>
                    {results.litersNeeded.toFixed(2)} L
                  </Text>
                </View>
                
                <View style={styles.resultSeparator} />
                
                <View style={styles.resultItem}>
                  <Text style={styles.resultLabel}>Total Cost</Text>
                  <Text style={styles.resultValue}>
                    {currencySymbols[results.currency as keyof typeof currencySymbols]}{results.cost.toFixed(2)}
                  </Text>
                </View>
              </View>
              
              {/* Trip Saved Indicator */}
              {tripSaved && (
                <View style={styles.tripSavedIndicator}>
                  <Text style={styles.tripSavedText}>✅ Trip saved to your travel history!</Text>
                </View>
              )}
              
              {/* Quick Tips */}
              <View style={styles.tipsContainer}>
                <Text style={styles.tipsTitle}>💡 Fuel Saving Tips</Text>
                <Text style={styles.tipsText}>• Maintain steady speeds to improve fuel efficiency</Text>
                <Text style={styles.tipsText}>• Check tire pressure regularly for optimal performance</Text>
                <Text style={styles.tipsText}>• Plan routes to avoid heavy traffic and congestion</Text>
                <Text style={styles.tipsText}>• Remove excess weight to reduce fuel consumption</Text>
              </View>
            </Animated.View>
          )}
        </ScrollView>
        
        {/* Vehicle Dropdown Overlay - Outside ScrollView to prevent clipping */}
        {showVehicleDropdown && vehicleOptions.length > 0 && (
          <View style={styles.vehicleDropdownOverlay}>
            {vehicleOptions.slice(0, 3).map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={styles.dropdownItem}
                onPress={() => handleVehicleSelect(vehicle)}
              >
                <Text style={styles.dropdownItemText}>
                  {vehicle.typicalYears.split('-')[0]} {vehicle.make} {vehicle.model}
                </Text>
                <Text style={styles.dropdownItemSubtext}>
                  {vehicle.kmPerLiterAvg} km/L • {vehicle.category}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Modals for dropdowns */}
        {/* Distance Unit Modal */}
        <Modal visible={showDistanceUnitModal} transparent animationType="fade">
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDistanceUnitModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Distance Unit</Text>
              {distanceUnits.map(unit => (
                <TouchableOpacity
                  key={unit}
                  style={[styles.modalOption, distanceUnit === unit && styles.modalOptionSelected]}
                  onPress={() => {
                    setDistanceUnit(unit);
                    setShowDistanceUnitModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, distanceUnit === unit && styles.modalOptionTextSelected]}>
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
        
        {/* Efficiency Unit Modal */}
        <Modal visible={showEfficiencyUnitModal} transparent animationType="fade">
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowEfficiencyUnitModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Efficiency Unit</Text>
              {efficiencyUnits.map(unit => (
                <TouchableOpacity
                  key={unit}
                  style={[styles.modalOption, efficiencyUnit === unit && styles.modalOptionSelected]}
                  onPress={() => {
                    setEfficiencyUnit(unit);
                    setShowEfficiencyUnitModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, efficiencyUnit === unit && styles.modalOptionTextSelected]}>
                    {unit}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
        
        {/* Currency Modal */}
        <Modal visible={showCurrencyModal} transparent animationType="fade">
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowCurrencyModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Currency</Text>
              {currencies.map(curr => (
                <TouchableOpacity
                  key={curr}
                  style={[styles.modalOption, currency === curr && styles.modalOptionSelected]}
                  onPress={() => {
                    setCurrency(curr);
                    setShowCurrencyModal(false);
                  }}
                >
                  <Text style={[styles.modalOptionText, currency === curr && styles.modalOptionTextSelected]}>
                    {curr}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
        
        {/* Fuel Type Modal */}
        <Modal visible={showFuelTypeModal} transparent animationType="fade">
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowFuelTypeModal(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Fuel Type</Text>
              <ScrollView style={styles.modalScrollView}>
                {fuelTypes.map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[styles.modalOption, fuelType === type && styles.modalOptionSelected]}
                    onPress={() => {
                      setFuelType(type);
                      setShowFuelTypeModal(false);
                    }}
                  >
                    <Text style={[styles.modalOptionText, fuelType === type && styles.modalOptionTextSelected]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>
      </AnimatedPageContainer>
      <BottomNavBar activeTab="calculator" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 120,
  },
  header: {
    marginBottom: 32,
    paddingTop: 10,
  },
  routeBadge: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  routeBadgeText: {
    color: '#4FD1C5',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  routeBadgeSubtext: {
    color: '#94A3B8',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#F1F5F9',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    lineHeight: 24,
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4FD1C5',
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    fontWeight: '500',
  },
  vehicleSearchContainer: {
    position: 'relative',
    marginBottom: 16,
    zIndex: 10000,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
  },
  input: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#F1F5F9',
    fontSize: 16,
    fontWeight: '500',
  },
  inputWithVehicle: {
    borderColor: '#4FD1C5',
    backgroundColor: '#1E293B',
    borderWidth: 2,
    shadowColor: '#4FD1C5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  inputFlex: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4FD1C5',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  unitButton: {
    backgroundColor: '#4FD1C5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    minWidth: 80,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  unitButtonText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  inputHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
  },
  selectButton: {
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 1000,
  },
  vehicleDropdownOverlay: {
    position: 'absolute',
    top: 360, // Position below the search input - increased to avoid covering the field
    left: 20,
    right: 110, // Adjusted to match search field width more precisely
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 12,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 50,
    zIndex: 99999,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  dropdownItemText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  dropdownItemSubtext: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  clearButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#DC2626',
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearButtonInline: {
    backgroundColor: '#DC2626',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 70,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  selectedVehicleDisplay: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#4FD1C5',
  },
  selectedVehicleText: {
    color: '#4FD1C5',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  selectedVehicleEfficiency: {
    color: '#94A3B8',
    fontSize: 12,
  },
  actionSection: {
    marginBottom: 32,
    paddingHorizontal: 4,
  },
  actionButtons: {
    gap: 12,
  },
  calculateButton: {
    backgroundColor: '#4FD1C5',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  calculateButtonDisabled: {
    backgroundColor: '#475569',
    shadowOpacity: 0,
  },
  calculateButtonText: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '700',
  },
  calculateButtonTextDisabled: {
    color: '#94A3B8',
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  validationHint: {
    backgroundColor: '#7C2D12',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DC2626',
  },
  validationText: {
    color: '#FCA5A5',
    fontSize: 14,
    textAlign: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  resultsSection: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 2,
    borderColor: '#4FD1C5',
    shadowColor: '#4FD1C5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 12,
  },
  resultsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  resultItem: {
    flex: 1,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4FD1C5',
  },
  resultSeparator: {
    width: 1,
    height: 40,
    backgroundColor: '#475569',
    marginHorizontal: 16,
  },
  tipsContainer: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4FD1C5',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  tripSavedIndicator: {
    backgroundColor: '#065F46',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  tripSavedText: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    width: screenWidth * 0.8,
    maxHeight: '60%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScrollView: {
    maxHeight: 200,
  },
  modalOption: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  modalOptionSelected: {
    backgroundColor: '#4FD1C5',
  },
  modalOptionText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    color: '#0F172A',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});
