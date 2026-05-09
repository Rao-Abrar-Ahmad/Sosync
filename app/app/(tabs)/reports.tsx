import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { subscribeToDisasterReports, DisasterReportDocument, DisasterType } from '@/config/dbutils';
import Theme from '@/config/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import ReportCard from '@/components/ReportCard';
import { DISASTER_TYPES, formatFirebaseTimestamp, getDisasterMarkerColor } from '@/constants/utils';

export default function ReportsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<DisasterReportDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Fetch all reports on mount and listen to real-time updates
  useEffect(() => {
    requestUserLocation();
    setLoading(true);
    const unsubscribe = subscribeToDisasterReports((newReports) => {
      setReports(newReports);
      setLoading(false);
      setError(null);
    });

    return () => unsubscribe();
  }, []);

  const requestUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      }
    } catch (err) {
      console.error('Error requesting location:', err);
    }
  };


  return (
    <LinearGradient
      colors={Theme.backgrounds.white as any}
      style={styles.container}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top - 20 }]}>
        <View style={styles.headerTopRow}>
          <View>
            <Text style={styles.headerTitle}>Disaster Reports</Text>
            <Text style={styles.headerSubtitle}>
              {loading ? 'Loading...' : `${reports.length} report${reports.length !== 1 ? 's' : ''}`}
            </Text>
            {/* List down the disaster colors to easily understand on map */}
          </View>
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive]}
              onPress={() => setViewMode('list')}
            >
              <FontAwesome name="list" size={16} color={viewMode === 'list' ? '#fff' : Theme.variants.text} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'map' && styles.toggleButtonActive]}
              onPress={() => setViewMode('map')}
            >
              <FontAwesome name="map" size={16} color={viewMode === 'map' ? '#fff' : Theme.variants.text} />
            </TouchableOpacity>
          </View>
        </View>
        {viewMode == 'map' && (
          <View style={styles.legend}>
            {DISASTER_TYPES.map((type) => (
              <View key={type} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: getDisasterMarkerColor(type) }]} />
                <Text style={styles.legendText}>{type}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.variants.primary} />
          <Text style={styles.loadingText}>Fetching disaster reports...</Text>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View style={styles.centerContainer}>
          <FontAwesome name="exclamation-circle" size={48} color="#F44336" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Waiting for connection...</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {!loading && reports.length === 0 && !error && (
        <View style={styles.centerContainer}>
          <FontAwesome name="inbox" size={48} color={Theme.variants.textMuted} />
          <Text style={styles.emptyText}>No disaster reports yet</Text>
          <Text style={styles.emptySubtext}>Be the first to report a disaster in your area</Text>
        </View>
      )}

      {/* Reports Content */}
      {!loading && reports.length > 0 && (
        <>
          {viewMode === 'map' ? (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: location?.latitude || 24.8607,
                  longitude: location?.longitude || 67.0011,
                  latitudeDelta: 15,
                  longitudeDelta: 15,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
              >
                {reports.map((report) => (
                  <Marker
                    key={report.id}
                    coordinate={{ latitude: report.latitude, longitude: report.longitude }}
                    title={report.type}
                    description={`Details: ${report.description}\n Address: ${report.address}`}
                    pinColor={getDisasterMarkerColor(report.type)}
                    onCalloutPress={() => router.push(`/report/${report.id}` as any)}
                  />
                ))}
              </MapView>
            </View>
          ) : (
            <FlatList
              data={reports}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ReportCard item={item} />
              )}
              contentContainerStyle={styles.listContent}
              scrollEnabled={true}
              showsVerticalScrollIndicator={false}
            />)}
        </>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.variants.border,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.variants.border,
    borderRadius: 8,
    padding: 2,
  },
  toggleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  toggleButtonActive: {
    backgroundColor: Theme.variants.primary,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 4,
  },
  legendText: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 12,
    color: Theme.variants.textMuted,
  },
  headerTitle: {
    fontFamily: Theme.typography.geom,
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.variants.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 13,
    color: Theme.variants.textMuted,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingText: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 14,
    color: Theme.variants.text,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    fontFamily: Theme.typography.inter.medium,
    fontSize: 16,
    color: '#F44336',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 18,
    fontWeight: '600',
    color: Theme.variants.text,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 13,
    color: Theme.variants.textMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: Theme.variants.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 20,
  },
  retryButtonText: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  }
});
