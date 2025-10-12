import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown, FadeOutUp, SlideInLeft, SlideOutLeft } from 'react-native-reanimated';
import AnimatedPageContainer from '../components/AnimatedPageContainer';
import BottomNavBar from '../components/BottomNavBar';
import MapComponent from '../components/MapComponent';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Coordinates {
  longitude: number;
  latitude: number;
}

interface RouteInfo {
  distance: number;
  duration: number;
  coordinates: number[][];
  steps: Array<{ instruction: string }>;
}

interface SavedPlace {
  id: string;
  name: string;
  coordinates: Coordinates;
}

export default function MapScreen() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSavedPlacesOpen, setIsSavedPlacesOpen] = useState(false);
  const [startLocation, setStartLocation] = useState<{ coordinates: Coordinates; name: string } | null>(null);
  const [endLocation, setEndLocation] = useState<{ coordinates: Coordinates; name: string } | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [pickMode, setPickMode] = useState<'start' | 'end'>('start');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const mapRef = useRef<any>(null);

  // Load saved places from storage
  useEffect(() => {
    loadSavedPlaces();
  }, []);

  const loadSavedPlaces = async () => {
    // In a real app, this would load from AsyncStorage or server
    // For now, using mock data
    setSavedPlaces([
      { id: '1', name: 'Home', coordinates: { longitude: 121.0244, latitude: 14.5547 } },
      { id: '2', name: 'Office', coordinates: { longitude: 121.0364, latitude: 14.5565 } },
    ]);
  };

  const toggleDarkMode = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsDarkMode(!isDarkMode);
  };

  const toggleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleSavedPlaces = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSavedPlacesOpen(!isSavedPlacesOpen);
  };

  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=ph&q=${encodeURIComponent(query)}`;
      const response = await fetch(url, { headers: { "Accept-Language": "en" } });
      const results = await response.json();
      setSearchResults(results || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result: any) => {
    const coordinates = {
      longitude: parseFloat(result.lon),
      latitude: parseFloat(result.lat),
    };
    
    if (pickMode === 'start') {
      setStartLocation({ coordinates, name: result.display_name });
    } else {
      setEndLocation({ coordinates, name: result.display_name });
    }
    
    setSearchQuery('');
    setSearchResults([]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const getCurrentLocation = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to use this feature.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const coordinates = {
        longitude: location.coords.longitude,
        latitude: location.coords.latitude,
      };

      setStartLocation({ coordinates, name: 'My Location' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Unable to get your location. Please try again.');
    }
  };

  const calculateRoute = async () => {
    if (!startLocation || !endLocation) return;

    try {
      const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${startLocation.coordinates.longitude},${startLocation.coordinates.latitude};${endLocation.coordinates.longitude},${endLocation.coordinates.latitude}?geometries=geojson&steps=true&access_token=${process.env.EXPO_PUBLIC_MAPBOX_TOKEN}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setRouteInfo({
          distance: route.distance / 1000, // Convert to km
          duration: Math.round(route.duration / 60), // Convert to minutes
          coordinates: route.geometry.coordinates,
          steps: route.legs[0]?.steps || [],
        });
      }
    } catch (error) {
      console.error('Route calculation error:', error);
      Alert.alert('Error', 'Unable to calculate route. Please try again.');
    }
  };

  const clearRoute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStartLocation(null);
    setEndLocation(null);
    setRouteInfo(null);
  };

  const swapLocations = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const temp = startLocation;
    setStartLocation(endLocation);
    setEndLocation(temp);
  };

  const savePlace = (location: { coordinates: Coordinates; name: string } | null, type: 'start' | 'end') => {
    if (!location) {
      Alert.alert('Error', `No ${type} location to save`);
      return;
    }

    const newPlace: SavedPlace = {
      id: Date.now().toString(),
      name: location.name,
      coordinates: location.coordinates,
    };

    setSavedPlaces(prev => [newPlace, ...prev.slice(0, 9)]); // Keep max 10 places
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Success', `${type} location saved successfully!`);
  };

  const useSavedPlace = (place: SavedPlace, type: 'start' | 'end') => {
    if (type === 'start') {
      setStartLocation({ coordinates: place.coordinates, name: place.name });
    } else {
      setEndLocation({ coordinates: place.coordinates, name: place.name });
    }
    setIsSavedPlacesOpen(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const deleteSavedPlace = (id: string) => {
    setSavedPlaces(prev => prev.filter(place => place.id !== id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Calculate route when both locations are set
  useEffect(() => {
    if (startLocation && endLocation) {
      calculateRoute();
    }
  }, [startLocation, endLocation]);

  return (
    <View style={styles.container}>
      <AnimatedPageContainer>
        {/* Map Container */}
        <View style={styles.mapContainer}>
          <MapComponent 
            ref={mapRef}
            isDarkMode={isDarkMode}
            startLocation={startLocation}
            endLocation={endLocation}
            routeCoordinates={routeInfo?.coordinates}
            onMapPress={(coordinates: Coordinates) => {
              if (pickMode === 'start') {
                setStartLocation({ 
                  coordinates, 
                  name: `Dropped pin (${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)})` 
                });
              } else {
                setEndLocation({ 
                  coordinates, 
                  name: `Dropped pin (${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)})` 
                });
              }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          />
        </View>

        {/* Top Controls */}
        <View style={styles.topControls}>
          {/* Hamburger Menu Button */}
          <TouchableOpacity
            style={[styles.controlButton, styles.hamburgerButton]}
            onPress={toggleMenu}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonIcon}>☰</Text>
          </TouchableOpacity>

          {/* Right Side Controls */}
          <View style={styles.rightControls}>
            {/* Dark Mode Toggle */}
            <TouchableOpacity
              style={[styles.controlButton, styles.darkModeButton]}
              onPress={toggleDarkMode}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonIcon}>{isDarkMode ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>

            {/* Saved Places Button */}
            <TouchableOpacity
              style={[styles.controlButton, styles.savedPlacesButton]}
              onPress={toggleSavedPlaces}
              activeOpacity={0.8}
            >
              <Text style={styles.buttonIcon}>📍</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Route Info Display */}
        {routeInfo && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            exiting={FadeOutUp.duration(200)}
            style={styles.routeInfo}
          >
            <Text style={styles.routeDistance}>{routeInfo.distance.toFixed(1)} km</Text>
            <Text style={styles.routeDuration}>{routeInfo.duration} min</Text>
          </Animated.View>
        )}

        {/* Hamburger Menu Modal */}
        <Modal
          visible={isMenuOpen}
          animationType="none"
          transparent={true}
          onRequestClose={() => setIsMenuOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              entering={SlideInLeft.duration(300)}
              exiting={SlideOutLeft.duration(200)}
              style={styles.menuPanel}
            >
              <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
                <Text style={styles.menuTitle}>Route Planner</Text>

                {/* Search Section */}
                <View style={styles.searchSection}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search for a location..."
                    placeholderTextColor="#94A3B8"
                    value={searchQuery}
                    onChangeText={(text) => {
                      setSearchQuery(text);
                      searchLocation(text);
                    }}
                  />
                  
                  {searchResults.length > 0 && (
                    <View style={styles.searchResults}>
                      {searchResults.map((result, index) => (
                        <TouchableOpacity
                          key={index}
                          style={styles.searchResultItem}
                          onPress={() => selectSearchResult(result)}
                        >
                          <Text style={styles.searchResultText} numberOfLines={2}>
                            {result.display_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Pick Mode Selection */}
                <View style={styles.pickModeSection}>
                  <Text style={styles.sectionTitle}>Map Click Mode</Text>
                  <View style={styles.pickModeButtons}>
                    <TouchableOpacity
                      style={[styles.pickModeButton, pickMode === 'start' && styles.pickModeButtonActive]}
                      onPress={() => setPickMode('start')}
                    >
                      <Text style={[styles.pickModeText, pickMode === 'start' && styles.pickModeTextActive]}>
                        Pick Start
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.pickModeButton, pickMode === 'end' && styles.pickModeButtonActive]}
                      onPress={() => setPickMode('end')}
                    >
                      <Text style={[styles.pickModeText, pickMode === 'end' && styles.pickModeTextActive]}>
                        Pick End
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Current Locations */}
                <View style={styles.locationsSection}>
                  <View style={styles.locationItem}>
                    <Text style={styles.locationLabel}>Start:</Text>
                    <Text style={styles.locationText} numberOfLines={2}>
                      {startLocation ? startLocation.name : '(none)'}
                    </Text>
                  </View>
                  <View style={styles.locationItem}>
                    <Text style={styles.locationLabel}>End:</Text>
                    <Text style={styles.locationText} numberOfLines={2}>
                      {endLocation ? endLocation.name : '(none)'}
                    </Text>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.actionButton} onPress={getCurrentLocation}>
                    <Text style={styles.actionButtonText}>📍 My Location</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton} onPress={swapLocations}>
                    <Text style={styles.actionButtonText}>🔄 Swap</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionButton, styles.clearButton]} onPress={clearRoute}>
                    <Text style={[styles.actionButtonText, styles.clearButtonText]}>🗑️ Clear</Text>
                  </TouchableOpacity>
                </View>

                {/* Turn-by-turn Directions */}
                {routeInfo && routeInfo.steps.length > 0 && (
                  <View style={styles.directionsSection}>
                    <Text style={styles.sectionTitle}>Turn-by-turn Directions</Text>
                    <ScrollView style={styles.directionsScroll} nestedScrollEnabled={true}>
                      {routeInfo.steps.map((step, index) => (
                        <View key={index} style={styles.directionStep}>
                          <Text style={styles.stepNumber}>{index + 1}</Text>
                          <Text style={styles.stepInstruction}>{step.instruction}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </ScrollView>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsMenuOpen(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>

        {/* Saved Places Modal */}
        <Modal
          visible={isSavedPlacesOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsSavedPlacesOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              entering={FadeInDown.duration(300)}
              exiting={FadeOutUp.duration(200)}
              style={styles.savedPlacesPanel}
            >
              <Text style={styles.savedPlacesTitle}>Saved Places</Text>
              
              {/* Save Current Locations */}
              <View style={styles.saveActions}>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => savePlace(startLocation, 'start')}
                  disabled={!startLocation}
                >
                  <Text style={[styles.saveButtonText, !startLocation && styles.disabledText]}>
                    💾 Save Start
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => savePlace(endLocation, 'end')}
                  disabled={!endLocation}
                >
                  <Text style={[styles.saveButtonText, !endLocation && styles.disabledText]}>
                    💾 Save End
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Saved Places List */}
              <ScrollView style={styles.savedPlacesList} showsVerticalScrollIndicator={false}>
                {savedPlaces.length === 0 ? (
                  <Text style={styles.emptyText}>No saved places yet</Text>
                ) : (
                  savedPlaces.map((place) => (
                    <View key={place.id} style={styles.savedPlaceItem}>
                      <View style={styles.placeInfo}>
                        <Text style={styles.placeName} numberOfLines={1}>{place.name}</Text>
                        <Text style={styles.placeCoords}>
                          {place.coordinates.latitude.toFixed(4)}, {place.coordinates.longitude.toFixed(4)}
                        </Text>
                      </View>
                      <View style={styles.placeActions}>
                        <TouchableOpacity
                          style={styles.useButton}
                          onPress={() => useSavedPlace(place, 'start')}
                        >
                          <Text style={styles.useButtonText}>Start</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.useButton}
                          onPress={() => useSavedPlace(place, 'end')}
                        >
                          <Text style={styles.useButtonText}>End</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.useButton, styles.deleteButton]}
                          onPress={() => deleteSavedPlace(place.id)}
                        >
                          <Text style={[styles.useButtonText, styles.deleteButtonText]}>Del</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>

              {/* Close Button */}
              <TouchableOpacity
                style={styles.savedPlacesCloseButton}
                onPress={() => setIsSavedPlacesOpen(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </Modal>
      </AnimatedPageContainer>
      <BottomNavBar activeTab="maps" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    zIndex: 10,
  },
  rightControls: {
    alignItems: 'flex-end',
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    backdropFilter: 'blur(10px)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  hamburgerButton: {
    // Additional styles for hamburger button if needed
  },
  darkModeButton: {
    marginBottom: 12,
  },
  savedPlacesButton: {
    // Additional styles for saved places button if needed
  },
  buttonIcon: {
    fontSize: 20,
    color: 'white',
  },
  routeInfo: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 10,
  },
  routeDistance: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4FD1C5',
  },
  routeDuration: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4FD1C5',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  menuPanel: {
    width: screenWidth * 0.85,
    height: screenHeight,
    backgroundColor: '#1E293B',
    paddingTop: 60,
  },
  menuContent: {
    flex: 1,
    padding: 20,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 24,
  },
  searchSection: {
    marginBottom: 24,
  },
  searchInput: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 16,
  },
  searchResults: {
    marginTop: 8,
    backgroundColor: '#334155',
    borderRadius: 8,
    maxHeight: 200,
  },
  searchResultItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  searchResultText: {
    color: '#E2E8F0',
    fontSize: 14,
  },
  pickModeSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4FD1C5',
    marginBottom: 12,
  },
  pickModeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  pickModeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  pickModeButtonActive: {
    backgroundColor: '#4FD1C5',
  },
  pickModeText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '500',
  },
  pickModeTextActive: {
    color: '#1E293B',
  },
  locationsSection: {
    marginBottom: 24,
  },
  locationItem: {
    marginBottom: 12,
  },
  locationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4FD1C5',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#E2E8F0',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#DC2626',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  clearButtonText: {
    color: 'white',
  },
  directionsSection: {
    marginBottom: 24,
  },
  directionsScroll: {
    maxHeight: 200,
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
  },
  directionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4FD1C5',
    color: '#1E293B',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 24,
    marginRight: 12,
  },
  stepInstruction: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 18,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  savedPlacesPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.7,
    padding: 20,
  },
  savedPlacesTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  saveActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4FD1C5',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledText: {
    color: '#64748B',
  },
  savedPlacesList: {
    flex: 1,
    marginBottom: 20,
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  savedPlaceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#334155',
    borderRadius: 8,
    marginBottom: 8,
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  placeCoords: {
    color: '#94A3B8',
    fontSize: 12,
  },
  placeActions: {
    flexDirection: 'row',
    gap: 6,
  },
  useButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#4FD1C5',
  },
  deleteButton: {
    backgroundColor: '#DC2626',
  },
  useButtonText: {
    color: '#1E293B',
    fontSize: 10,
    fontWeight: '600',
  },
  deleteButtonText: {
    color: 'white',
  },
  savedPlacesCloseButton: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
  },
});
