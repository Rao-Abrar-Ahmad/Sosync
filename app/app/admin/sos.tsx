import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import Theme from '@/config/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { subscribeToActiveSOSAlerts, SOSAlertDocument } from '@/config/dbutils';
import { formatDate } from '@/constants/utils';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminSOSMonitor() {
  const [activeSOS, setActiveSOS] = useState<SOSAlertDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSOS, setSelectedSOS] = useState<SOSAlertDocument | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToActiveSOSAlerts((alerts) => {
      setActiveSOS(alerts);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const renderSOSItem = ({ item }: { item: SOSAlertDocument }) => (
    <TouchableOpacity 
      style={[styles.sosCard, selectedSOS?.id === item.id && styles.sosCardSelected]}
      onPress={() => setSelectedSOS(item)}
    >
      <View style={styles.sosIconCircle}>
        <FontAwesome name="warning" size={18} color="#fff" />
      </View>
      <View style={styles.sosDetails}>
        <Text style={styles.sosUser}>User: {item.user_id.substring(0, 8)}...</Text>
        <Text style={styles.sosTime}>{formatDate(item.created_at)}</Text>
      </View>
      <FontAwesome name="map-marker" size={16} color="#D0021B" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.variants.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 33.6844, // Default to Islamabad or a central location
          longitude: 73.0479,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
        region={selectedSOS ? {
          latitude: selectedSOS.latitude,
          longitude: selectedSOS.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        } : undefined}
      >
        {activeSOS.map((sos) => (
          <Marker
            key={sos.id}
            coordinate={{ latitude: sos.latitude, longitude: sos.longitude }}
            pinColor="#D0021B"
            onPress={() => setSelectedSOS(sos)}
          >
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>Emergency SOS</Text>
                <Text style={styles.calloutText}>{sos.user_id}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      <SafeAreaView style={styles.overlay} pointerEvents="box-none" edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Live SOS Monitor</Text>
          <View style={styles.badge}>
            <View style={styles.pulseDot} />
            <Text style={styles.badgeTxt}>{activeSOS.length} ACTIVE</Text>
          </View>
        </View>

        <View style={styles.listWrapper}>
          <FlatList
            data={activeSOS}
            keyExtractor={(item) => item.id}
            renderItem={renderSOSItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTxt}>No active SOS alerts at this time.</Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 18,
    color: Theme.variants.text,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffebee',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D0021B',
  },
  badgeTxt: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D0021B',
  },
  listWrapper: {
    marginBottom: 20,
  },
  listContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  sosCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 16,
    width: 240,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  sosCardSelected: {
    borderColor: '#D0021B',
    borderWidth: 2,
  },
  sosIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D0021B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sosDetails: {
    flex: 1,
  },
  sosUser: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 13,
    color: Theme.variants.text,
  },
  sosTime: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 11,
    color: Theme.variants.textMuted,
    marginTop: 2,
  },
  emptyCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    width: 300,
    alignItems: 'center',
  },
  emptyTxt: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 13,
    color: Theme.variants.textMuted,
  },
  callout: {
    padding: 10,
    width: 150,
  },
  calloutTitle: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 14,
    marginBottom: 4,
  },
  calloutText: {
    fontSize: 10,
    color: '#666',
  },
});
