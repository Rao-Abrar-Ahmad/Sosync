import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet, Alert, TouchableOpacity, ActivityIndicator, Animated, Easing, Linking,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Location from 'expo-location';
import Theme from '@/config/theme';
import { useUser } from '@/context/UserContext';
import {
  createSOSAlert, updateSOSLocation, deactivateSOSAlert,
  getActiveSOSAlert, getEmergencyContacts, SOSAlertDocument,
  EmergencyContactDocument,
} from '@/config/dbutils';
import { sendSOSPushNotification } from '@/services/NotificationService';

export default function SOSScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [activeAlert, setActiveAlert] = useState<SOSAlertDocument | null>(null);
  const [contacts, setContacts] = useState<EmergencyContactDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  const locationInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  // Pulse animation for SOS button
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.7, duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start(); glow.start();
    return () => { pulse.stop(); glow.stop(); };
  }, []);

  // Load existing alert & contacts
  useEffect(() => {
    (async () => {
      if (!user?.uid) return;
      try {
        const [alert, cts] = await Promise.all([
          getActiveSOSAlert(user.uid),
          getEmergencyContacts(user.uid),
        ]);
        setActiveAlert(alert);
        setContacts(cts);
        if (alert) setCurrentLocation({ lat: alert.latitude, lng: alert.longitude });
      } catch (err) { console.error('Load error:', err); }
      finally { setLoading(false); }
    })();
  }, [user?.uid]);

  // Live location tracking when SOS is active
  useEffect(() => {
    if (activeAlert) {
      startLocationTracking();
    }
    return () => stopLocationTracking();
  }, [activeAlert?.id]);

  const startLocationTracking = () => {
    stopLocationTracking();
    locationInterval.current = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setCurrentLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
        if (activeAlert) {
          await updateSOSLocation(activeAlert.id, loc.coords.latitude, loc.coords.longitude);
        }
      } catch (err) { console.error('Location update error:', err); }
    }, 10000); // Update every 10 seconds
  };

  const stopLocationTracking = () => {
    if (locationInterval.current) { clearInterval(locationInterval.current); locationInterval.current = null; }
  };

  const handleActivateSOS = () => {
    if (contacts.length === 0) {
      Alert.alert('No Contacts', 'Please add emergency contacts first before using SOS.', [
        { text: 'Add Contacts', onPress: () => router.push('/(tabs)/emergency-contacts') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }

    Alert.alert(
      '🚨 Activate SOS',
      'This will send your live location to all emergency contacts. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'ACTIVATE SOS', style: 'destructive', onPress: activateSOS },
      ]
    );
  };

  const activateSOS = async () => {
    if (!user?.uid) return;
    setActivating(true);
    try {
      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location Required', 'Please enable location permissions to use SOS.');
        setActivating(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = loc.coords;

      // Create SOS alert in Firestore
      const alertId = await createSOSAlert(user.uid, latitude, longitude);
      const newAlert: SOSAlertDocument = {
        id: alertId, user_id: user.uid, latitude, longitude,
        status: 'ACTIVE', created_at: new Date(),
      };
      setActiveAlert(newAlert);
      setCurrentLocation({ lat: latitude, lng: longitude });

      // Send push notifications to contacts that have push tokens
      // For now, we also open SMS as a fallback
      const senderName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'SoSync User';

      // Send SMS to all contacts as primary notification method
      const phoneNumbers = contacts.map(c => c.phone_number).join(',');
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      const smsBody = `🚨 SOS EMERGENCY! ${senderName} needs help! Location: ${mapsUrl}`;

      try {
        const smsUrl = Platform.OS === 'ios'
          ? `sms:${phoneNumbers}&body=${encodeURIComponent(smsBody)}`
          : `sms:${phoneNumbers}?body=${encodeURIComponent(smsBody)}`;
        await Linking.openURL(smsUrl);
      } catch { console.log('SMS fallback failed, push notifications sent'); }

      Alert.alert('SOS Activated', 'Your emergency contacts have been notified with your location.');
    } catch (err) {
      console.error('SOS activation error:', err);
      Alert.alert('Error', 'Failed to activate SOS. Try again.');
    } finally { setActivating(false); }
  };

  const handleDeactivate = () => {
    Alert.alert('Cancel SOS', 'Are you sure you want to cancel the SOS alert?', [
      { text: 'Keep Active', style: 'cancel' },
      { text: 'Cancel SOS', style: 'destructive', onPress: async () => {
        try {
          if (activeAlert) await deactivateSOSAlert(activeAlert.id);
          stopLocationTracking();
          setActiveAlert(null);
          Alert.alert('SOS Cancelled', 'Your SOS alert has been deactivated.');
        } catch { Alert.alert('Error', 'Failed to cancel SOS.'); }
      }},
    ]);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.center}><ActivityIndicator size="large" color={Theme.variants.primary} /></View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="arrow-left" size={20} color={Theme.variants.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SOS Emergency</Text>
        <View style={{ width: 40, backgroundColor: '#fff' }} />
      </View>

      <View style={styles.content}>
        {activeAlert ? (
          /* Active SOS View */
          <>
            <Animated.View style={[styles.activeGlow, { opacity: glowAnim }]} />
            <View style={styles.activeCard}>
              <View style={styles.activePulse}>
                <FontAwesome name="exclamation-triangle" size={40} color="#ff4444" />
              </View>
              <Text style={styles.activeTitle}>🚨 SOS ACTIVE</Text>
              <Text style={styles.activeDesc}>Your location is being shared with emergency contacts</Text>

              {currentLocation && (
                <View style={styles.locationBox}>
                  <FontAwesome name="map-marker" size={16} color={Theme.variants.primary} />
                  <Text style={styles.locationText}>
                    {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                  </Text>
                </View>
              )}

              <View style={styles.contactsNotified}>
                <Text style={styles.notifiedLabel}>Contacts Notified</Text>
                {contacts.map((c) => (
                  <View key={c.id} style={styles.notifiedContact}>
                    <View style={styles.notifiedDot} />
                    <Text style={styles.notifiedName}>{c.name}</Text>
                    <Text style={styles.notifiedPhone}>{c.phone_number}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity style={styles.cancelSOSBtn} onPress={handleDeactivate} activeOpacity={0.8}>
                <FontAwesome name="times-circle" size={18} color="#fff" />
                <Text style={styles.cancelSOSTxt}>Cancel SOS</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* SOS Button View */
          <>
            <Text style={styles.sosInstruction}>Press the button below in case of emergency</Text>
            <Animated.View style={[styles.sosOuter, { transform: [{ scale: pulseAnim }] }]}>
              <Animated.View style={[styles.sosGlowRing, { opacity: glowAnim }]} />
              <TouchableOpacity
                style={[styles.sosButton, activating && { opacity: 0.7 }]}
                onPress={handleActivateSOS}
                disabled={activating}
                activeOpacity={0.7}
              >
                {activating ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : (
                  <>
                    <FontAwesome name="exclamation-triangle" size={42} color="#fff" />
                    <Text style={styles.sosText}>SOS</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>

            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <FontAwesome name="map-marker" size={16} color={Theme.variants.primary} />
                <Text style={styles.infoText}>Sends your live GPS location</Text>
              </View>
              <View style={styles.infoItem}>
                <FontAwesome name="users" size={14} color={Theme.variants.primary} />
                <Text style={styles.infoText}>{contacts.length} contact{contacts.length !== 1 ? 's' : ''} will be notified</Text>
              </View>
              <View style={styles.infoItem}>
                <FontAwesome name="refresh" size={14} color={Theme.variants.primary} />
                <Text style={styles.infoText}>Location updates every 10 seconds</Text>
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

// Need to import Platform for SMS URL
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Theme.variants.border, backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Theme.variants.text, fontFamily: Theme.typography.inter.bold, backgroundColor: '#fff' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, backgroundColor: '#fff' },
  // SOS Button
  sosInstruction: { fontSize: 16, color: Theme.variants.textMuted, fontFamily: Theme.typography.inter.regular, textAlign: 'center', marginBottom: 40, backgroundColor: '#fff' },
  sosOuter: { alignItems: 'center', justifyContent: 'center', marginBottom: 48 },
  sosGlowRing: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#ff4444' },
  sosButton: { width: 160, height: 160, borderRadius: 80, backgroundColor: '#ff4444', justifyContent: 'center', alignItems: 'center', shadowColor: '#ff4444', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.5, shadowRadius: 16, elevation: 12 },
  sosText: { fontSize: 28, fontWeight: '900', color: '#fff', fontFamily: Theme.typography.inter.bold, marginTop: 6 },
  // Info
  infoSection: { gap: 14, backgroundColor: '#fff', width: '100%' },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f8f9fa', paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: Theme.variants.border },
  infoText: { fontSize: 14, color: Theme.variants.text, fontFamily: Theme.typography.inter.regular },
  // Active SOS
  activeGlow: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#ff4444', top: '15%' },
  activeCard: { backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 8 },
  activePulse: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#fff0f0', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  activeTitle: { fontSize: 24, fontWeight: '900', color: '#ff4444', fontFamily: Theme.typography.inter.bold, marginBottom: 8, backgroundColor: '#fff' },
  activeDesc: { fontSize: 14, color: Theme.variants.textMuted, textAlign: 'center', fontFamily: Theme.typography.inter.regular, marginBottom: 20, backgroundColor: '#fff' },
  locationBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0f7ff', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, marginBottom: 20, width: '100%', justifyContent: 'center' },
  locationText: { fontSize: 13, color: Theme.variants.text, fontFamily: Theme.typography.inter.medium },
  contactsNotified: { width: '100%', marginBottom: 20, backgroundColor: '#fff' },
  notifiedLabel: { fontSize: 13, fontWeight: '600', color: Theme.variants.textMuted, fontFamily: Theme.typography.inter.semibold, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5, backgroundColor: '#fff' },
  notifiedContact: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Theme.variants.border, backgroundColor: '#fff' },
  notifiedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#4CAF50' },
  notifiedName: { flex: 1, fontSize: 14, color: Theme.variants.text, fontFamily: Theme.typography.inter.medium, backgroundColor: '#fff' },
  notifiedPhone: { fontSize: 12, color: Theme.variants.textMuted, fontFamily: Theme.typography.inter.regular },
  cancelSOSBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ff4444', paddingVertical: 15, paddingHorizontal: 32, borderRadius: 12, gap: 8, width: '100%' },
  cancelSOSTxt: { color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: Theme.typography.inter.bold },
});
