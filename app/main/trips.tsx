import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../src/config/api';
import AnimatedPageContainer from '../components/AnimatedPageContainer';
import BottomNavBar from '../components/BottomNavBar';

const { width: screenWidth } = Dimensions.get('window');

interface Trip {
  id: number;
  startLocationName: string;
  endLocationName: string;
  distanceKm: number;
  efficiencyKmPerL: number | null;
  litersNeeded: number;
  pricePerLiter: number | null;
  fuelCost: number;
  currency: string;
  fuelType?: string | null;
  vehicleLabel?: string | null;
  createdAt: string;
}

interface GroupedTrips {
  key: string;
  label: string;
  items: Trip[];
  totalDistance: number;
  totalTrips: number;
}

export default function TripsScreen() {
  const { currentUser } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [groupedTrips, setGroupedTrips] = useState<GroupedTrips[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set([new Date().toISOString().slice(0, 7)]));
  const [totalStats, setTotalStats] = useState({
    totalDistance: 0,
    totalTrips: 0,
  });

  const loadTrips = useCallback(async (isRefresh = false) => {
    if (!currentUser) {
      setTrips([]);
      setGroupedTrips([]);
      setTotalStats({ totalDistance: 0, totalTrips: 0 });
      return;
    }

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await fetch(`${API_BASE}/trips_list.php`, {
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
      
      if (data.success && Array.isArray(data.trips)) {
        // Normalize trip data to ensure proper types
        const normalizedTrips = data.trips.map((trip: any) => ({
          ...trip,
          id: parseInt(trip.id) || 0,
          distanceKm: parseFloat(trip.distanceKm) || 0,
          efficiencyKmPerL: trip.efficiencyKmPerL ? parseFloat(trip.efficiencyKmPerL) : null,
          litersNeeded: parseFloat(trip.litersNeeded) || 0,
          pricePerLiter: trip.pricePerLiter ? parseFloat(trip.pricePerLiter) : null,
          fuelCost: parseFloat(trip.fuelCost) || 0,
          currency: trip.currency || 'PHP',
          fuelType: trip.fuelType || 'Gasoline',
          vehicleLabel: trip.vehicleLabel || null,
        }));
        
        setTrips(normalizedTrips);
        const grouped = groupTripsByMonth(normalizedTrips);
        setGroupedTrips(grouped);
        
        // Calculate total stats
        const totalDistance = normalizedTrips.reduce((sum: number, trip: Trip) => {
          const distance = typeof trip.distanceKm === 'number' && !isNaN(trip.distanceKm) ? trip.distanceKm : 0;
          return sum + distance;
        }, 0);
        setTotalStats({
          totalDistance: totalDistance || 0,
          totalTrips: normalizedTrips.length || 0,
        });
      } else {
        console.error('Failed to load trips:', data.error);
        setTrips([]);
        setGroupedTrips([]);
        setTotalStats({ totalDistance: 0, totalTrips: 0 });
      }
    } catch (error) {
      console.error('Error loading trips:', error);
      setHasError(true);
      setTrips([]);
      setGroupedTrips([]);
      setTotalStats({ totalDistance: 0, totalTrips: 0 });
      Alert.alert('Error', 'Failed to load trips. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [currentUser]);

  const groupTripsByMonth = (trips: Trip[]): GroupedTrips[] => {
    const groups: { [key: string]: Trip[] } = {};
    
    for (const trip of trips) {
      // Skip invalid trips
      if (!trip || typeof trip !== 'object' || !trip.createdAt) continue;
      
      const date = new Date(trip.createdAt);
      if (isNaN(date.getTime())) continue;
      
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(trip);
    }
    
    const ordered = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    
    return ordered.map(key => {
      const items = groups[key].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const totalDistance = items.reduce((sum, trip) => {
        const distance = typeof trip.distanceKm === 'number' && !isNaN(trip.distanceKm) ? trip.distanceKm : 0;
        return sum + distance;
      }, 0);
      
      return {
        key,
        label: new Date(`${key}-01T00:00:00`).toLocaleString(undefined, { 
          month: 'long', 
          year: 'numeric' 
        }),
        items,
        totalDistance: totalDistance || 0,
        totalTrips: items.length || 0,
      };
    });
  };

  const deleteTrip = async (id: number) => {
    try {
      console.log('Attempting to delete trip with ID:', id);
      
      const formData = new FormData();
      formData.append('id', id.toString());

      const response = await fetch(`${API_BASE}/trips_delete.php`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Delete response data:', data);
      
      if (data.success && data.deleted) {
        await loadTrips();
        Alert.alert('Success', 'Trip deleted successfully!');
      } else {
        Alert.alert('Error', data.error || 'Failed to delete trip');
      }
    } catch (error) {
      console.error('Error deleting trip:', error);
      Alert.alert('Error', 'Failed to delete trip. Please try again.');
    }
  };

  const confirmDeleteTrip = (trip: Trip) => {
    Alert.alert(
      'Delete Trip',
      `Are you sure you want to delete the trip from ${trip.startLocationName} to ${trip.endLocationName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteTrip(trip.id)
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

  const formatDistance = (distance: any): string => {
    const num = safeNumber(distance);
    return `${num.toFixed(1)} km`;
  };

  const formatLiters = (liters: any): string => {
    const num = safeNumber(liters);
    return `${num.toFixed(1)} L`;
  };

  useEffect(() => {
    loadTrips();
  }, [loadTrips]);

  const onRefresh = () => {
    setHasError(false);
    loadTrips(true);
  };

  const toggleMonth = (monthKey: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey);
      } else {
        newSet.add(monthKey);
      }
      return newSet;
    });
  };

  if (!currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <AnimatedPageContainer>
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateIcon}>🔐</Text>
            <Text style={styles.emptyStateTitle}>Sign In Required</Text>
            <Text style={styles.emptyStateText}>
              Please sign in to view your travel history and saved trips.
            </Text>
          </View>
        </AnimatedPageContainer>
        <BottomNavBar activeTab="trips" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AnimatedPageContainer>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>My Trips</Text>
          <Text style={styles.subtitle}>
            Track your journeys and explore your travel patterns over time
          </Text>
        </View>

        {/* Stats Overview */}
        {totalStats.totalTrips > 0 && (
          <Animated.View 
            entering={FadeInDown.duration(300)}
            style={styles.statsContainer}
          >
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{safeNumber(totalStats.totalDistance).toFixed(0)} km</Text>
              <Text style={styles.statLabel}>TOTAL DISTANCE</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalStats.totalTrips || 0}</Text>
              <Text style={styles.statLabel}>TOTAL JOURNEYS</Text>
            </View>
          </Animated.View>
        )}

        {/* Trips List */}
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
          {isLoading && trips.length === 0 ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading trips...</Text>
            </View>
          ) : hasError ? (
            <Animated.View 
              entering={FadeInDown.duration(500)}
              style={styles.emptyStateContainer}
            >
              <Text style={styles.emptyStateIcon}>⚠️</Text>
              <Text style={styles.emptyStateTitle}>Something went wrong</Text>
              <Text style={styles.emptyStateText}>
                Unable to load your trips. Pull down to refresh and try again.
              </Text>
            </Animated.View>
          ) : groupedTrips.length === 0 ? (
            <Animated.View 
              entering={FadeInDown.duration(500)}
              style={styles.emptyStateContainer}
            >
              <Text style={styles.emptyStateIcon}>🗺️</Text>
              <Text style={styles.emptyStateTitle}>No Trips Yet</Text>
              <Text style={styles.emptyStateText}>
                Start planning routes on the map page to automatically track your trips here!
              </Text>
            </Animated.View>
          ) : (
            groupedTrips.filter(group => group && group.items && Array.isArray(group.items)).map((group, groupIndex) => (
              <Animated.View
                key={group.key}
                entering={FadeInDown.duration(300).delay(groupIndex * 100)}
                style={styles.monthGroup}
              >
                {/* Month Header - Clickable */}
                <TouchableOpacity 
                  style={styles.monthHeader}
                  onPress={() => toggleMonth(group.key)}
                  activeOpacity={0.7}
                >
                  <View style={styles.monthHeaderContent}>
                    <Text style={styles.monthTitle}>{group.label}</Text>
                    <Text style={styles.monthStatsText}>
                      {group.totalTrips} trip{group.totalTrips !== 1 ? 's' : ''} • {safeNumber(group.totalDistance).toFixed(0)} km
                    </Text>
                  </View>
                  <Text style={styles.expandIcon}>
                    {expandedMonths.has(group.key) ? '▼' : '▶'}
                  </Text>
                </TouchableOpacity>

                {/* Trip Items - Conditionally rendered */}
                {expandedMonths.has(group.key) && (group.items || []).filter(trip => trip && typeof trip === 'object').map((trip, tripIndex) => (
                  <Animated.View
                    key={trip.id}
                    entering={FadeInDown.duration(200).delay((groupIndex * 100) + (tripIndex * 50))}
                    exiting={FadeOutUp.duration(200)}
                    style={styles.tripCard}
                  >

                    
                    {/* Route Info */}
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeLocation} numberOfLines={1} ellipsizeMode="tail">
                        {trip.startLocationName.length > 20 ? trip.startLocationName.substring(0, 20) + '...' : trip.startLocationName}
                      </Text>
                      <Text style={styles.routeArrow}>→</Text>
                      <Text style={styles.routeLocation} numberOfLines={1} ellipsizeMode="tail">
                        {trip.endLocationName.length > 20 ? trip.endLocationName.substring(0, 20) + '...' : trip.endLocationName}
                      </Text>
                    </View>

                    {/* Trip Details */}
                    <View style={styles.tripDetails}>
                      <Text style={styles.tripDate}>{formatDate(trip.createdAt)}</Text>
                      {trip.vehicleLabel && (
                        <Text style={styles.tripVehicle}>Vehicle: {trip.vehicleLabel}</Text>
                      )}
                      <Text style={styles.tripFuel}>Fuel: {trip.fuelType || 'Gasoline'}</Text>
                    </View>

                    {/* Trip Metrics */}
                    <View style={styles.tripMetrics}>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Distance</Text>
                        <Text style={styles.metricValue}>{formatDistance(trip.distanceKm)}</Text>
                      </View>
                      
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Fuel</Text>
                        <Text style={styles.metricValue}>{formatLiters(trip.litersNeeded)}</Text>
                      </View>
                      
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Cost</Text>
                        <Text style={styles.metricValue}>{formatCurrency(safeNumber(trip.fuelCost), trip.currency || 'PHP')}</Text>
                      </View>
                    </View>

                    {/* Delete Button */}
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => confirmDeleteTrip(trip)}
                      activeOpacity={0.7}
                    >
                      <Image 
                        source={require('../../assets/delete.png')} 
                        style={styles.deleteIcon}
                      />
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </Animated.View>
            ))
          )}
          
          <View style={styles.bottomPadding} />
        </ScrollView>
      </AnimatedPageContainer>
      <BottomNavBar activeTab="trips" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 24,
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
  statsContainer: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4FD1C5',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  statSeparator: {
    width: 1,
    height: 30,
    backgroundColor: '#334155',
    marginHorizontal: 12,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 16,
  },
  emptyStateContainer: {
    paddingVertical: 80,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
  },
  monthGroup: {
    marginBottom: 16,
  },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  monthHeaderContent: {
    flex: 1,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4FD1C5',
    marginBottom: 4,
  },
  expandIcon: {
    fontSize: 16,
    color: '#94A3B8',
    marginLeft: 12,
  },
  monthStatsText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  tripCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.6)',
    borderRadius: 20,
    padding: 20,
    paddingRight: 50, // Add extra padding to prevent delete button overlap
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(79, 209, 197, 0.1)',
    position: 'relative',
  },

  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeLocation: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  routeArrow: {
    fontSize: 16,
    color: '#4FD1C5',
    marginHorizontal: 8,
    fontWeight: 'bold',
  },
  tripDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  tripDate: {
    fontSize: 14,
    color: '#94A3B8',
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tripVehicle: {
    fontSize: 14,
    color: '#94A3B8',
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tripFuel: {
    fontSize: 14,
    color: '#94A3B8',
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tripMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginRight: -25, // Offset for delete button to center the metrics
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(51, 65, 85, 0.5)',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4FD1C5',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    width: 14,
    height: 14,
    tintColor: '#FFFFFF',
  },
  bottomPadding: {
    height: 40,
  },
  // Legacy styles for compatibility
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
});
