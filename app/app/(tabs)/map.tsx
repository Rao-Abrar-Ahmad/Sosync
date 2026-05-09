import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity, Platform, Alert } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { subscribeToDisasterReports, DisasterReportDocument, DisasterType } from '@/config/dbutils';
import Theme from '@/config/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const DEFAULT_REGION = {
  latitude: 24.8607,
  longitude: 67.0011,
  latitudeDelta: 15,
  longitudeDelta: 15,
};

export default function MapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [reports, setReports] = useState<DisasterReportDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      if (status !== 'granted') {
        setError('Location permission denied. Map will use default location.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
    } catch (err) {
      console.error('Error requesting location:', err);
      setError('Failed to determine your location. Default region is shown.');
    }
  };

  const getDisasterMarkerColor = (type: DisasterType) => {
    switch (type) {
      case 'FLOOD':
        return '#2196F3';
      case 'EARTHQUAKE':
        return '#FF9800';
      case 'FIRE':
        return '#F44336';
      case 'ACCIDENT':
        return '#9C27B0';
      case 'LANDSLIDE':
        return '#795548';
      default:
        return '#607D8B';
    }
  };

  const mapRegion = {
    latitude: location ? location.latitude : DEFAULT_REGION.latitude,
    longitude: location ? location.longitude : DEFAULT_REGION.longitude,
    latitudeDelta: location ? 0.05 : DEFAULT_REGION.latitudeDelta,
    longitudeDelta: location ? 0.05 : DEFAULT_REGION.longitudeDelta,
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View>
          <Text style={styles.title}>Disaster Map</Text>
          <Text style={styles.subtitle}>Tap a marker to review the report details.</Text>
          {/* <View>
            Add list of colors with their alert type, so user can easily understand, which color of market means what.
          </View> */}
        </View>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Theme.variants.primary} />
          <Text style={styles.loadingText}>Loading map data...</Text>
        </View>
      ) : (
        <>
          {error && (
            <TouchableOpacity
              style={styles.errorBanner}
              onPress={() => Alert.alert('Map Notice', error)}
            >
              <FontAwesome name="exclamation-circle" size={16} color="#fff" />
              <Text style={styles.errorBannerText}>{error}</Text>
            </TouchableOpacity>
          )}

          <MapView
            style={styles.map}
            region={mapRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {reports.map((report) => (
              <Marker
                key={report.id}
                coordinate={{ latitude: report.latitude, longitude: report.longitude }}
                title={report.type}
                description={report.address || report.description}
                pinColor={getDisasterMarkerColor(report.type)}
                onCalloutPress={() => router.push(`/report/${report.id}` as any)}
              />
            ))}
          </MapView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 20,
    color: Theme.variants.text,
  },
  subtitle: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 12,
    color: Theme.variants.textMuted,
    marginTop: 4,
  },
  map: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontFamily: Theme.typography.inter.regular,
    color: Theme.variants.textMuted,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D32F2F',
    padding: 10,
    marginHorizontal: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  errorBannerText: {
    color: '#fff',
    marginLeft: 8,
    fontFamily: Theme.typography.inter.semibold,
    fontSize: 13,
  },
});
