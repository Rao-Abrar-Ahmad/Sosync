import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Easing, Vibration, Modal } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Theme from '@/config/theme';
import { useRouter } from 'expo-router';

interface CriticalAlertOverlayProps {
  visible: boolean;
  type: 'REPORT' | 'SOS';
  data: any;
  distance: number;
  onDismiss: () => void;
}

export default function CriticalAlertOverlay({ visible, type, data, distance, onDismiss }: CriticalAlertOverlayProps) {
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start animations
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();

      pulse.start();

      // Trigger heavy vibration
      const vibrationPattern = [0, 500, 200, 500, 200, 500];
      Vibration.vibrate(vibrationPattern, true);

      return () => {
        pulse.stop();
        Vibration.cancel();
      };
    } else {
      opacityAnim.setValue(0);
      Vibration.cancel();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="fade">
      <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
        <View style={styles.background}>
          <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]} />
          <Animated.View style={[styles.pulseCircleOuter, { transform: [{ scale: pulseAnim }] }]} />
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <FontAwesome name="warning" size={60} color="#fff" />
            <Text style={styles.alertTitle}>IMMEDIATE DANGER</Text>
            <Text style={styles.alertType}>
              {type === 'SOS' ? 'NEARBY EMERGENCY SOS' : `CRITICAL ${data.type}`}
            </Text>
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.distanceText}>📍 {distance.toFixed(1)} km away</Text>
            <Text style={styles.descriptionText}>
              {type === 'SOS' 
                ? 'Someone nearby is in urgent need of assistance. Please check the map or proceed with caution.' 
                : data.description}
            </Text>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.viewBtn} 
              onPress={() => {
                onDismiss();
                if (type === 'REPORT') {
                  router.push(`/report/${data.id}` as any);
                } else {
                  router.push('/(tabs)/map');
                }
              }}
            >
              <Text style={styles.viewBtnTxt}>VIEW DETAILS</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.dismissBtn} onPress={onDismiss}>
              <Text style={styles.dismissBtnTxt}>DISMISS</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ff4444',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  pulseCircleOuter: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    zIndex: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  alertTitle: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 32,
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  alertType: {
    fontFamily: Theme.typography.inter.semibold,
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  detailsCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    marginBottom: 60,
  },
  distanceText: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 20,
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  descriptionText: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
  },
  actions: {
    width: '100%',
    gap: 16,
  },
  viewBtn: {
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  viewBtnTxt: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 16,
    color: '#ff4444',
  },
  dismissBtn: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  dismissBtnTxt: {
    fontFamily: Theme.typography.inter.semibold,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textDecorationLine: 'underline',
  },
});
