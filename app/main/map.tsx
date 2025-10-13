import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Dimensions, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOutUp, SlideInLeft, SlideOutLeft } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../src/config/api';
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
  steps: Array<{ maneuver: { instruction: string } }>;
}

interface SavedPlace {
  id: string;
  name: string;
  coordinates: Coordinates;
}

export default function MapScreen() {
  const { currentUser } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSavedPlacesOpen, setIsSavedPlacesOpen] = useState(false);
  const [startLocation, setStartLocation] = useState<{ coordinates: Coordinates; name: string } | null>(null);
  const [endLocation, setEndLocation] = useState<{ coordinates: Coordinates; name: string } | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [pickMode, setPickMode] = useState<'start' | 'end'>('start');
  const [startSearchQuery, setStartSearchQuery] = useState('');
  const [endSearchQuery, setEndSearchQuery] = useState('');
  const [startSearchResults, setStartSearchResults] = useState<any[]>([]);
  const [endSearchResults, setEndSearchResults] = useState<any[]>([]);
  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [isDirectionsOpen, setIsDirectionsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingSavedPlaces, setIsLoadingSavedPlaces] = useState(false);
  const mapRef = useRef<any>(null);

  // Load saved places from database when component mounts or user changes
  useEffect(() => {
    if (currentUser) {
      loadSavedPlaces();
    } else {
      setSavedPlaces([]);
    }
  }, [currentUser]);

  const loadSavedPlaces = async () => {
    if (!currentUser) {
      setSavedPlaces([]);
      return;
    }

    setIsLoadingSavedPlaces(true);
    try {
      const response = await fetch(`${API_BASE}/saved_places_list.php`, {
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
        const places = data.items.map((item: any) => ({
          id: item.id.toString(),
          name: item.name,
          coordinates: {
            longitude: parseFloat(item.longitude) || 0,
            latitude: parseFloat(item.latitude) || 0,
          },
        }));
        setSavedPlaces(places);
      } else {
        console.error('Failed to load saved places:', data.error);
        setSavedPlaces([]);
      }
    } catch (error) {
      console.error('Error loading saved places:', error);
      setSavedPlaces([]);
    } finally {
      setIsLoadingSavedPlaces(false);
    }
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

  const searchLocation = async (query: string, type: 'start' | 'end') => {
    if (!query || query.length < 3) {
      if (type === 'start') {
        setStartSearchResults([]);
      } else {
        setEndSearchResults([]);
      }
      return;
    }

    setIsSearching(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=ph&q=${encodeURIComponent(query)}`;
      const response = await fetch(url, { 
        method: 'GET',
        signal: controller.signal,
        headers: { 
          "Accept": "application/json",
          "Accept-Language": "en",
          "User-Agent": "FillTrip Mobile App"
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error(`Search API error: ${response.status} ${response.statusText}`);
        throw new Error(`Search service unavailable (${response.status})`);
      }
      
      const text = await response.text();
      
      if (!text || text.trim() === '') {
        console.error('Empty response from search service');
        throw new Error('Empty response from search service');
      }
      
      let results;
      try {
        results = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Response text:', text.substring(0, 200));
        throw new Error('Invalid response format from search service');
      }
      
      if (!Array.isArray(results)) {
        console.error('Unexpected response format:', typeof results);
        results = [];
      }
      
      if (type === 'start') {
        setStartSearchResults(results);
      } else {
        setEndSearchResults(results);
      }
    } catch (error) {
      console.error(`Search error for "${query}":`, error);
      
      // Clear results on error
      if (type === 'start') {
        setStartSearchResults([]);
      } else {
        setEndSearchResults([]);
      }
      
      // Only show alert for actual network/timeout errors, not for successful searches
      if (query.length >= 3 && error instanceof Error && (error.name === 'AbortError' || error.message.includes('network') || error.message.includes('fetch'))) {
        setTimeout(() => {
          Alert.alert(
            'Search Error',
            'Unable to search for locations. Please check your internet connection and try again.',
            [{ text: 'OK' }]
          );
        }, 100);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result: any, type: 'start' | 'end') => {
    const coordinates = {
      longitude: parseFloat(result.lon),
      latitude: parseFloat(result.lat),
    };
    
    if (type === 'start') {
      setStartLocation({ coordinates, name: result.display_name });
      setStartSearchQuery('');
      setStartSearchResults([]);
    } else {
      setEndLocation({ coordinates, name: result.display_name });
      setEndSearchQuery('');
      setEndSearchResults([]);
    }
    
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

  const savePlace = async (location: { coordinates: Coordinates; name: string } | null, type: 'start' | 'end') => {
    if (!location) {
      Alert.alert('Error', `No ${type} location to save`);
      return;
    }

    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to save places');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/saved_places_add.php`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: location.name,
          latitude: location.coordinates.latitude,
          longitude: location.coordinates.longitude,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        if (data.duplicate) {
          Alert.alert('Info', 'This place is already saved');
        } else {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Success', `${type} location saved successfully!`);
          // Reload saved places to get the updated list
          await loadSavedPlaces();
        }
      } else {
        throw new Error(data.error || 'Failed to save place');
      }
    } catch (error) {
      console.error('Error saving place:', error);
      Alert.alert('Error', 'Failed to save place. Please try again.');
    }
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

  const deleteSavedPlace = async (id: string) => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to delete places');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/saved_places_delete.php`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: parseInt(id),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        if (data.deleted) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          // Reload saved places to get the updated list
          await loadSavedPlaces();
        } else {
          Alert.alert('Error', 'Place not found or already deleted');
        }
      } else {
        throw new Error(data.error || 'Failed to delete place');
      }
    } catch (error) {
      console.error('Error deleting place:', error);
      Alert.alert('Error', 'Failed to delete place. Please try again.');
    }
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
              const label = `Dropped pin (${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)})`;
              
              // Web version logic: first click -> start, second click -> end, then use pickMode
              if (!startLocation) {
                setStartLocation({ coordinates, name: label });
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                return;
              }
              
              if (!endLocation) {
                setEndLocation({ coordinates, name: label });
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                return;
              }
              
              // Both locations set, use pickMode
              if (pickMode === 'start') {
                setStartLocation({ coordinates, name: label });
              } else {
                setEndLocation({ coordinates, name: label });
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
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              toggleMenu();
            }}
            activeOpacity={0.7}
          >
            <View style={styles.hamburgerIcon}>
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
              <View style={styles.hamburgerLine} />
            </View>
          </TouchableOpacity>

          {/* Right Side Controls */}
          <View style={styles.rightControls}>
            {/* Dark Mode Toggle */}
            <TouchableOpacity
              style={[styles.controlButton, styles.darkModeButton]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleDarkMode();
              }}
              activeOpacity={0.7}
            >
              <Image 
                source={isDarkMode ? require('../../assets/light-mode.png') : require('../../assets/dark-mode.png')}
                style={styles.controlIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Saved Places Button */}
            <TouchableOpacity
              style={[styles.controlButton, styles.savedPlacesButton]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleSavedPlaces();
              }}
              activeOpacity={0.7}
            >
              <Image 
                source={require('../../assets/saved-places.png')}
                style={styles.savedPlacesIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {/* Swap Button */}
            <TouchableOpacity
              style={[styles.controlButton, styles.swapButton]}
              onPress={swapLocations}
              activeOpacity={0.8}
            >
              <Image 
                source={require('../../assets/swap.png')}
                style={styles.swapIcon}
                resizeMode="contain"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Unified Route Info and Calculator Container */}
        {routeInfo && (
          <Animated.View
            entering={FadeInDown.duration(500).springify()}
            exiting={FadeOutUp.duration(300)}
            style={styles.bottomOverlayContainer}
          >
            {/* Unified Route Information Panel */}
            <View style={styles.unifiedRoutePanel}>
              {/* Route Metrics Header */}
              <View style={styles.routeMetricsSection}>
                <Text style={styles.routePanelTitle}>Route Overview</Text>
                <View style={styles.routeMetricsRow}>
                  <View style={styles.routeMetricItem}>
                    <Text style={styles.routeMetricLargeValue}>{routeInfo.distance.toFixed(1)}</Text>
                    <Text style={styles.routeMetricLargeLabel}>km</Text>
                  </View>
                  <View style={styles.routeMetricsDivider} />
                  <View style={styles.routeMetricItem}>
                    <Text style={styles.routeMetricLargeValue}>{routeInfo.duration}</Text>
                    <Text style={styles.routeMetricLargeLabel}>min</Text>
                  </View>
                </View>
              </View>
              
              {/* Calculator Action Section */}
              <TouchableOpacity
                style={styles.unifiedCalculatorSection}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  const startName = startLocation?.name || 'Start Location';
                  const endName = endLocation?.name || 'End Location';
                  router.push({
                    pathname: '/main/calculator',
                    params: {
                      distanceKm: routeInfo.distance.toFixed(2),
                      startName,
                      endName,
                    },
                  });
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.unifiedCalculatorTitle}>Fuel Calculator</Text>
                <Text style={styles.unifiedCalculatorSubtitle}>
                  Calculate costs for {routeInfo.distance.toFixed(1)} km trip
                </Text>
              </TouchableOpacity>
            </View>
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
              entering={SlideInLeft.duration(400).springify()}
              exiting={SlideOutLeft.duration(300)}
              style={styles.menuPanel}
            >
              {/* Header */}
              <View style={styles.menuHeader}>
                <Text style={styles.menuTitle}>Route Planner</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setIsMenuOpen(false)}
                >
                  <Image 
                    source={require('../../assets/exit.png')}
                    style={styles.closeIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.menuContent} showsVerticalScrollIndicator={false}>
                {/* Location Inputs */}
                <View style={styles.locationsContainer}>
                  {/* Start Location */}
                  <View style={styles.locationInput}>
                    <Text style={styles.locationLabel}>Start</Text>
                    <TextInput
                      style={styles.modernSearchInput}
                      placeholder="Enter starting point"
                      placeholderTextColor="#94A3B8"
                      value={startSearchQuery}
                      onChangeText={(text) => {
                        setStartSearchQuery(text);
                        searchLocation(text, 'start');
                      }}
                    />
                    <Text style={styles.currentLocationDisplay} numberOfLines={1}>
                      {startLocation ? startLocation.name : 'Not set'}
                    </Text>
                    
                    {startSearchResults.length > 0 && (
                      <View style={styles.searchResultsOverlay}>
                        {startSearchResults.slice(0, 3).map((result: any, index: number) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.searchResultItem}
                            onPress={() => selectSearchResult(result, 'start')}
                          >
                            <Text style={styles.searchResultText} numberOfLines={2}>
                              {result.display_name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* End Location */}
                  <View style={styles.locationInput}>
                    <Text style={styles.locationLabel}>Destination</Text>
                    <TextInput
                      style={styles.modernSearchInput}
                      placeholder="Enter destination"
                      placeholderTextColor="#94A3B8"
                      value={endSearchQuery}
                      onChangeText={(text) => {
                        setEndSearchQuery(text);
                        searchLocation(text, 'end');
                      }}
                    />
                    <Text style={styles.currentLocationDisplay} numberOfLines={1}>
                      {endLocation ? endLocation.name : 'Not set'}
                    </Text>
                    
                    {endSearchResults.length > 0 && (
                      <View style={styles.searchResultsOverlay}>
                        {endSearchResults.slice(0, 3).map((result: any, index: number) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.searchResultItem}
                            onPress={() => selectSearchResult(result, 'end')}
                          >
                            <Text style={styles.searchResultText} numberOfLines={2}>
                              {result.display_name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                </View>

                {/* Route Information */}
                {routeInfo && (
                  <View style={styles.routeInfoCard}>
                    <View style={styles.routeInfoRow}>
                      <View style={styles.routeInfoItem}>
                        <Text style={styles.routeInfoLabel}>Distance</Text>
                        <Text style={styles.routeInfoValue}>{routeInfo.distance.toFixed(1)} km</Text>
                      </View>
                      <View style={styles.routeInfoDivider} />
                      <View style={styles.routeInfoItem}>
                        <Text style={styles.routeInfoLabel}>Duration</Text>
                        <Text style={styles.routeInfoValue}>{routeInfo.duration} min</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Quick Actions */}
                <View style={styles.quickActions}>
                  <TouchableOpacity style={styles.quickActionButton} onPress={getCurrentLocation}>
                    <Text style={styles.quickActionText}>My Location</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={[styles.quickActionButton, styles.clearAction]} onPress={clearRoute}>
                    <Text style={styles.quickActionText}>Clear</Text>
                  </TouchableOpacity>
                </View>

                {/* Map Click Mode */}
                <View style={styles.mapModeSection}>
                  <Text style={styles.sectionTitle}>Tap map to set:</Text>
                  <View style={styles.mapModeButtons}>
                    <TouchableOpacity
                      style={[styles.mapModeButton, pickMode === 'start' && styles.mapModeButtonActive]}
                      onPress={() => setPickMode('start')}
                    >
                      <Text style={[styles.mapModeText, pickMode === 'start' && styles.mapModeTextActive]}>
                        Start
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.mapModeButton, pickMode === 'end' && styles.mapModeButtonActive]}
                      onPress={() => setPickMode('end')}
                    >
                      <Text style={[styles.mapModeText, pickMode === 'end' && styles.mapModeTextActive]}>
                        End
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Directions Button */}
                {routeInfo && routeInfo.steps.length > 0 && (
                  <TouchableOpacity
                    style={styles.directionsButton}
                    onPress={() => setIsDirectionsOpen(true)}
                  >
                    <Text style={styles.directionsButtonText}>
                      View Turn-by-Turn Directions ({routeInfo.steps.length} steps)
                    </Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
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
              entering={FadeInDown.duration(400).springify()}
              exiting={FadeOutUp.duration(300)}
              style={styles.savedPlacesPanel}
            >
              <Text style={styles.savedPlacesTitle}>Saved Places</Text>
              
              {/* Save Current Locations */}
              <View style={styles.saveActions}>
                <TouchableOpacity
                  style={[styles.saveButton, !currentUser && styles.disabledButton]}
                  onPress={() => savePlace(startLocation, 'start')}
                  disabled={!startLocation || !currentUser}
                >
                  <Text style={[styles.saveButtonText, (!startLocation || !currentUser) && styles.disabledText]}>
                    Save Start
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveButton, !currentUser && styles.disabledButton]}
                  onPress={() => savePlace(endLocation, 'end')}
                  disabled={!endLocation || !currentUser}
                >
                  <Text style={[styles.saveButtonText, (!endLocation || !currentUser) && styles.disabledText]}>
                    Save End
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Saved Places List */}
              <ScrollView style={styles.savedPlacesList} showsVerticalScrollIndicator={false}>
                {!currentUser ? (
                  <Text style={styles.emptyText}>Please log in to access saved places</Text>
                ) : isLoadingSavedPlaces ? (
                  <Text style={styles.emptyText}>Loading saved places...</Text>
                ) : savedPlaces.length === 0 ? (
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

        {/* Directions Modal */}
        <Modal
          visible={isDirectionsOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsDirectionsOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <Animated.View
              entering={FadeInDown.duration(300)}
              exiting={FadeOutUp.duration(200)}
              style={styles.directionsModal}
            >
              <View style={styles.directionsModalHeader}>
                <Text style={styles.directionsModalTitle}>Turn-by-Turn Directions</Text>
                <TouchableOpacity
                  style={styles.directionsCloseButton}
                  onPress={() => setIsDirectionsOpen(false)}
                >
                  <Image 
                    source={require('../../assets/exit.png')}
                    style={styles.closeIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
              
              {routeInfo && (
                <View style={styles.directionsModalInfo}>
                  <Text style={styles.directionsModalDistance}>
                    {routeInfo.distance.toFixed(1)} km • {routeInfo.duration} min
                  </Text>
                </View>
              )}

              <ScrollView style={styles.directionsModalContent} showsVerticalScrollIndicator={false}>
                {routeInfo && routeInfo.steps.map((step, index) => (
                  <View key={index} style={styles.directionsModalItem}>
                    <View style={styles.directionsModalCounter}>
                      <Text style={styles.directionsModalCounterText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.directionsModalText}>{step.maneuver.instruction}</Text>
                  </View>
                ))}
              </ScrollView>
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
    borderRadius: 8,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#334155',
  },
  hamburgerButton: {},
  darkModeButton: {
    marginBottom: 12,
  },
  savedPlacesButton: {},
  swapButton: {
    marginTop: 12,
  },
  hamburgerIcon: {
    width: 20,
    height: 16,
    justifyContent: 'space-between',
  },
  hamburgerLine: {
    width: 20,
    height: 2,
    backgroundColor: 'white',
    borderRadius: 1,
  },
  controlIcon: {
    width: 24,
    height: 24,
    tintColor: 'white',
  },
  savedPlacesIcon: {
    width: 20,
    height: 20,
    tintColor: 'white',
  },
  swapIcon: {
    width: 20,
    height: 20,
    tintColor: 'white',
  },
  closeIcon: {
    width: 20,
    height: 20,
    tintColor: 'white',
  },
  // Modern Route Info and Calculator Container
  bottomOverlayContainer: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  routeInfoOverlay: {
    position: 'absolute',
    bottom: 160,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  routeInfoContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  routeInfoHeader: {
    marginBottom: 8,
  },
  routeInfoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  routeInfoDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeInfoMetric: {
    alignItems: 'center',
    flex: 1,
  },
  routeMetricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4FD1C5',
  },
  routeMetricLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  routeInfoSeparator: {
    width: 1,
    height: 30,
    backgroundColor: '#475569',
    marginHorizontal: 16,
  },
  // Calculator Button
  calculatorButton: {
    backgroundColor: '#4FD1C5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  calculatorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  calculatorButtonDistance: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
    backgroundColor: 'rgba(30, 41, 59, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  // Legacy route info styles (kept for compatibility)
  routeInfo: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#1E293B',
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
    backgroundColor: '#0F172A',
    paddingTop: 60,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  menuContent: {
    flex: 1,
    padding: 20,
  },
  menuTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  // Modern Location Inputs
  locationsContainer: {
    marginBottom: 20,
  },
  locationInput: {
    marginBottom: 20,
    position: 'relative',
  },
  locationLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4FD1C5',
    marginBottom: 8,
  },
  modernSearchInput: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#475569',
  },
  currentLocationDisplay: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 6,
    fontStyle: 'italic',
  },
  searchResults: {
    marginTop: 8,
    backgroundColor: '#475569',
    borderRadius: 8,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#64748B',
  },
  searchResultsOverlay: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#475569',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  searchResultItem: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  searchResultText: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '500',
  },
  // Route Info Card in Menu
  routeInfoCard: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  routeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeInfoItem: {
    alignItems: 'center',
    flex: 1,
  },
  routeInfoLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  routeInfoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4FD1C5',
  },
  routeInfoDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#475569',
  },
  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 8,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#475569',
    gap: 6,
  },
  quickActionIcon: {
    width: 16,
    height: 16,
    tintColor: '#4FD1C5',
  },
  quickActionText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  clearAction: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  // Map Mode Section
  mapModeSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4FD1C5',
    marginBottom: 12,
  },
  mapModeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  mapModeButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#334155',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  mapModeButtonActive: {
    backgroundColor: '#334155',
    borderColor: '#475569',
  },
  mapModeText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '500',
  },
  mapModeTextActive: {
    color: '#E2E8F0',
  },
  directionsButton: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#475569',
  },
  directionsButtonText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  // Directions Section
  directionsSection: {
    marginBottom: 24,
  },
  directionsContainer: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    maxHeight: 300,
  },
  directionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#475569',
  },
  stepCounter: {
    color: '#4FD1C5',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
    marginTop: 2,
    width: 25,
  },
  stepText: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
  },
  // Legacy styles (keeping for compatibility)
  locationSection: {
    marginBottom: 24,
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
  },
  locationSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4FD1C5',
    marginBottom: 12,
  },
  searchContainer: {
    marginBottom: 12,
  },
  searchSection: {
    marginBottom: 24,
  },
  searchInput: {
    backgroundColor: '#475569',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#64748B',
  },
  currentLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentLocationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  currentLocationText: {
    flex: 1,
    fontSize: 14,
    color: '#E2E8F0',
  },
  pickModeSection: {
    marginBottom: 24,
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
    borderWidth: 1,
    borderColor: '#475569',
  },
  pickModeButtonActive: {
    backgroundColor: '#4FD1C5',
    borderColor: '#4FD1C5',
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
    borderWidth: 1,
    borderColor: '#475569',
    flexDirection: 'column',
    gap: 4,
  },
  actionIcon: {
    width: 20,
    height: 20,
    tintColor: '#4FD1C5',
  },
  clearButton: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  clearButtonText: {
    color: 'white',
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
    width: 32,
    height: 32,
    borderRadius: 6,
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
    backgroundColor: '#334155',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#475569',
  },
  disabledButton: {
    backgroundColor: '#64748B',
  },
  saveButtonText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledText: {
    color: '#94A3B8',
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
    backgroundColor: '#334155',
    borderWidth: 1,
    borderColor: '#475569',
  },
  deleteButton: {
    backgroundColor: '#DC2626',
  },
  useButtonText: {
    color: '#F1F5F9',
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
  // Directions Modal
  directionsModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.8,
    padding: 20,
  },
  directionsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  directionsModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  directionsCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  directionsModalInfo: {
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  directionsModalDistance: {
    color: '#4FD1C5',
    fontSize: 16,
    fontWeight: '600',
  },
  directionsModalContent: {
    flex: 1,
  },
  directionsModalItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#334155',
    borderRadius: 8,
    marginBottom: 8,
  },
  directionsModalCounter: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4FD1C5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  directionsModalCounterText: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: 'bold',
  },
  directionsModalText: {
    flex: 1,
    color: '#E2E8F0',
    fontSize: 14,
    lineHeight: 20,
  },
  // Unified Route Panel Styles
  unifiedRoutePanel: {
    backgroundColor: 'rgba(30, 41, 59, 0.95)',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 209, 197, 0.2)',
  },
  routeMetricsSection: {
    marginBottom: 12,
  },
  routePanelTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4FD1C5',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  routeMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeMetricItem: {
    alignItems: 'center',
    flex: 1,
  },
  routeMetricLargeValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  routeMetricLargeLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '500',
  },
  routeMetricsDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(79, 209, 197, 0.3)',
    marginHorizontal: 16,
  },
  unifiedCalculatorSection: {
    backgroundColor: 'rgba(79, 209, 197, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 209, 197, 0.3)',
  },
  unifiedCalculatorTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4FD1C5',
    textAlign: 'center',
    marginBottom: 2,
  },
  unifiedCalculatorSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    fontWeight: '500',
  },
});
