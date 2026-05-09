import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUser } from '@/context/UserContext';
import Theme from '@/config/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Location from 'expo-location';
import { subscribeToDisasterReports, subscribeToActiveSOSAlerts, DisasterReportDocument, SOSAlertDocument } from '@/config/dbutils';
import { calculateDistance, getDisasterIcon } from '@/constants/utils';
import { useState } from 'react';
import CriticalAlertOverlay from '@/components/CriticalAlertOverlay';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, loading } = useUser();

  // State for nearby alerts
  const [nearestAlert, setNearestAlert] = useState<{ type: 'REPORT' | 'SOS', data: any, distance: number } | null>(null);
  const [userLocation, setUserLocation] = useState<{ latitude: number, longitude: number } | null>(null);
  const [showCriticalOverlay, setShowCriticalOverlay] = useState(false);
  const [dismissedAlertId, setDismissedAlertId] = useState<string | null>(null);

  useEffect(() => {
    if (nearestAlert && nearestAlert.distance < 1.0 && dismissedAlertId !== nearestAlert.data.id) {
      setShowCriticalOverlay(true);
    } else {
      setShowCriticalOverlay(false);
    }
  }, [nearestAlert, dismissedAlertId]);

  useEffect(() => {
    let unsubscribeReports: (() => void) | undefined;
    let unsubscribeSOS: (() => void) | undefined;
    let locationSubscription: Location.LocationSubscription | undefined;

    const setupAlerts = async () => {
      // 1. Get initial location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({ latitude: location.coords.latitude, longitude: location.coords.longitude });

      // 2. Subscribe to location changes
      locationSubscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 100 },
        (loc) => {
          setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      );

      let activeReports: DisasterReportDocument[] = [];
      let activeSOS: SOSAlertDocument[] = [];

      const updateNearest = (reports: DisasterReportDocument[], sos: SOSAlertDocument[], loc: { latitude: number, longitude: number }) => {
        let closest: any = null;
        let minDistance = 10; // Only show alerts within 10km

        // Check SOS alerts first (higher priority)
        sos.forEach(s => {
          if (s.user_id === user?.id) return; // Skip own SOS
          const d = calculateDistance(loc.latitude, loc.longitude, s.latitude, s.longitude);
          if (d < minDistance) {
            minDistance = d;
            closest = { type: 'SOS', data: s, distance: d };
          }
        });

        // Check disaster reports
        reports.forEach(r => {
          if (r.status === 'FALSE_ALARM' || r.status === 'RESOLVED') return;
          const d = calculateDistance(loc.latitude, loc.longitude, r.latitude, r.longitude);
          if (d < minDistance) {
            // If it's a critical report or closer than a previously found SOS
            if (!closest || d < closest.distance) {
              minDistance = d;
              closest = { type: 'REPORT', data: r, distance: d };
            }
          }
        });

        setNearestAlert(closest);
      };

      // 3. Listen to reports
      unsubscribeReports = subscribeToDisasterReports((reports) => {
        activeReports = reports;
        if (userLocation) updateNearest(activeReports, activeSOS, userLocation);
      });

      // 4. Listen to SOS
      unsubscribeSOS = subscribeToActiveSOSAlerts((alerts) => {
        activeSOS = alerts;
        if (userLocation) updateNearest(activeReports, activeSOS, userLocation);
      });
    };

    if (user) setupAlerts();

    return () => {
      if (unsubscribeReports) unsubscribeReports();
      if (unsubscribeSOS) unsubscribeSOS();
      if (locationSubscription) locationSubscription.remove();
    };
  }, [user]);

  // SOS button pulse animation
  const sosPulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(sosPulse, { toValue: 1.1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(sosPulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  // Redirect admin to admin panel
  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      router.replace('/admin');
    }
  }, [user])


  return (
    <LinearGradient
      colors={Theme.backgrounds.white as any}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 10 }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!loading}
      >
        {/* Loading Overlay */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={Theme.variants.primary} />
            <Text style={styles.loadingText}>Loading your profile...</Text>
          </View>
        )}

        {/* Header Greeting */}
        <View style={[styles.header, loading && styles.opacityReduced]}>
          <View>
            <Text style={styles.greeting}>Hello, {user?.first_name || 'User'}! 👋</Text>
            <Text style={styles.subheading}>Report disasters and save lives</Text>
          </View>
        </View>

        {/* Nearby Alert Section */}
        {nearestAlert && (
          <View style={[styles.section, { marginBottom: 0 }]}>
            <TouchableOpacity
              activeOpacity={0.9}
              style={[styles.alertCard, nearestAlert.type === 'SOS' && styles.sosAlertCard]}
              onPress={() => {
                if (nearestAlert.type === 'REPORT') {
                  router.push(`/report/${nearestAlert.data.id}` as any);
                } else {
                  router.push('/(tabs)/map'); // Or a specific SOS detail screen
                }
              }}
            >
              <View style={[styles.alertIconContainer, nearestAlert.type === 'SOS' && styles.sosAlertIcon]}>
                <FontAwesome
                  name={nearestAlert.type === 'SOS' ? 'warning' : getDisasterIcon(nearestAlert.data.type)}
                  size={24}
                  color="#fff"
                />
              </View>
              <View style={styles.alertContent}>
                <Text style={[styles.alertTitle, nearestAlert.type === 'SOS' && styles.sosAlertTitle]}>
                  {nearestAlert.type === 'SOS' ? 'Nearby Emergency SOS' : `Nearby ${nearestAlert.data.type}`}
                </Text>
                <Text style={[styles.alertSubtitle, nearestAlert.type === 'SOS' && styles.sosAlertText]} numberOfLines={1}>
                  {nearestAlert.type === 'SOS' ? 'Someone nearby needs help immediately!' : nearestAlert.data.description}
                </Text>
                <Text style={[styles.alertDistance, nearestAlert.type === 'SOS' && styles.sosAlertText]}>
                  📍 {nearestAlert.distance.toFixed(1)} km away
                </Text>
              </View>
              <FontAwesome name="chevron-right" size={14} color={nearestAlert.type === 'SOS' ? '#B71C1C' : '#E65100'} />
            </TouchableOpacity>
          </View>
        )}

        <CriticalAlertOverlay
          visible={showCriticalOverlay}
          type={nearestAlert?.type || 'REPORT'}
          data={nearestAlert?.data}
          distance={nearestAlert?.distance || 0}
          onDismiss={() => {
            setShowCriticalOverlay(false);
            if (nearestAlert) setDismissedAlertId(nearestAlert.data.id);
          }}
        />

        {/* Quick Actions */}
        <View style={[styles.section, loading && styles.opacityReduced]}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          {/* Create Report Card */}
          <TouchableOpacity
            style={[styles.actionCard, loading && styles.buttonDisabled]}
            onPress={() => router.push('/create-report')}
            activeOpacity={0.8}
            disabled={loading}
          >
            <LinearGradient
              colors={[Theme.variants.primary, '#1976d2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.actionCardGradient}
            >
              <View style={styles.actionCardContent}>
                <View style={styles.iconContainer}>
                  <FontAwesome name="plus-circle" size={16} color="#fff" />
                </View>
                <View style={styles.actionCardText}>
                  <Text style={[styles.actionCardTitle, { color: '#fff' }]}>Create Report</Text>
                  <Text style={[styles.actionCardDescription, { color: '#fff' }]}>
                    Report a disaster in your area
                  </Text>
                </View>
                <FontAwesome name="arrow-right" size={16} color="#fff" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* View Reports Card */}
          <TouchableOpacity
            style={[styles.actionCard, loading && styles.buttonDisabled]}
            onPress={() => router.push('/(tabs)/reports')}
            activeOpacity={0.8}
            disabled={loading}
          >
            <View style={styles.actionCardBorder}>
              <View style={styles.actionCardContent}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: '#f0f7ff' },
                  ]}
                >
                  <FontAwesome
                    name="list"
                    size={16}
                    color={Theme.variants.primary}
                  />
                </View>
                <View style={styles.actionCardText}>
                  <Text style={styles.actionCardTitle}>View Reports</Text>
                  <Text style={styles.actionCardDescription}>
                    See all disaster reports
                  </Text>
                </View>
                <FontAwesome name="arrow-right" size={16} color={Theme.variants.primary} />
              </View>
            </View>
          </TouchableOpacity>
        </View>


        {/* Info Card */}
        <View style={[styles.infoCard, loading && styles.opacityReduced]}>
          <FontAwesome name="info-circle" size={20} color={Theme.variants.primary} />
          <Text style={styles.infoText}>
            Help your community by reporting disasters. Every report makes a difference.
          </Text>
        </View>
      </ScrollView>

      {/* Floating SOS Button */}
      <Animated.View style={[styles.sosFloating, { transform: [{ scale: sosPulse }] }]}>
        <TouchableOpacity
          style={styles.sosFloatingBtn}
          onPress={() => router.push('/(tabs)/sos')}
          activeOpacity={0.7}
          disabled={loading}
        >
          <FontAwesome name="exclamation-triangle" size={22} color="#fff" />
          <Text style={styles.sosFloatingTxt}>SOS</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  header: {
    marginBottom: 32,
  },
  greeting: {
    fontFamily: Theme.typography.geom,
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.variants.text,
    marginBottom: 4,
  },
  subheading: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 14,
    color: Theme.variants.textMuted,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 14,
    fontWeight: '600',
    color: Theme.variants.text,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionCard: {
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  actionCardGradient: {
    borderRadius: 12,
  },
  actionCardBorder: {
    borderWidth: 1.5,
    borderColor: Theme.variants.border,
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  actionCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCardText: {
    flex: 1,
  },
  actionCardTitle: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 14,
    fontWeight: '600',
    color: Theme.variants.text,
    marginBottom: 2,
  },
  actionCardDescription: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 12,
    color: Theme.variants.textMuted,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48.5%',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Theme.variants.border,
  },
  featureIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 24,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 13,
    fontWeight: '600',
    color: Theme.variants.text,
    marginBottom: 2,
    textAlign: 'center',
  },
  featureDescription: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 11,
    color: Theme.variants.textMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: '#f0f7ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderLeftWidth: 4,
    borderLeftColor: Theme.variants.primary,
    marginTop: 20,
  },
  infoText: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 13,
    color: Theme.variants.text,
    flex: 1,
    lineHeight: 18,
  },
  // Loading States
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 14,
    color: Theme.variants.text,
    marginTop: 16,
    textAlign: 'center',
  },
  opacityReduced: {
    opacity: 0.5,
    pointerEvents: 'none',
  },
  buttonDisabled: {
    opacity: 0.6,
    pointerEvents: 'none',
  },
  // Floating SOS
  sosFloating: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 100,
  },
  sosFloatingBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ff4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  sosFloatingTxt: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 1,
  },
  alertCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE0B2',
    backgroundColor: '#FFF8E1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#FFA000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  alertIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFA000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 16,
    color: '#E65100',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 13,
    color: '#6D4C41',
  },
  alertDistance: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 12,
    color: '#E65100',
    marginTop: 4,
  },
  sosAlertCard: {
    borderColor: '#FFCDD2',
    backgroundColor: '#FFEBEE',
  },
  sosAlertIcon: {
    backgroundColor: '#D32F2F',
  },
  sosAlertTitle: {
    color: '#B71C1C',
  },
  sosAlertText: {
    color: '#C62828',
  },
});
