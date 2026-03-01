import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { useUser } from '@/context/UserContext';
import { updateUserLocation } from '@/config/dbutils';
import Theme from '@/config/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function AllowGPSScreen() {
    const [loading, setLoading] = useState(false);
    const [locationGranted, setLocationGranted] = useState(false);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useUser();

    // Request GPS permission
    const handleRequestPermission = async () => {
        try {
            setLoading(true);

            // Request foreground location permission
            const { status } = await Location.requestForegroundPermissionsAsync();

            if (status === 'granted') {
                // Permission granted
                setLocationGranted(true);

                // Get current location
                const location = await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                });

                // Save location permission status and coordinates to Firestore using utility
                if (user?.uid) {
                    await updateUserLocation(
                        user.uid,
                        location.coords.latitude,
                        location.coords.longitude,
                        location.coords.accuracy
                    );
                }

                Alert.alert(
                    'Success',
                    'GPS location permission granted. You can now use location-based features.',
                    [
                        {
                            text: 'Continue',
                            onPress: () => proceedToHome(),
                        },
                    ]
                );
            } else if (status === 'denied') {
                Alert.alert(
                    'Permission Denied',
                    'GPS location permission is required to use this app. Please enable it in your device settings.',
                    [
                        {
                            text: 'Retry',
                            onPress: handleRequestPermission,
                        },
                    ]
                );
            }
        } catch (error) {
            console.error('Error requesting location permission:', error);
            Alert.alert(
                'Error',
                'Failed to request location permission. Please try again.',
                [
                    {
                        text: 'Retry',
                        onPress: handleRequestPermission,
                    },
                ]
            );
        } finally {
            setLoading(false);
        }
    };

    // Proceed to home
    const proceedToHome = async () => {
        try {
            // Clear onboarding stack and go to home
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Error navigating to home:', error);
            Alert.alert('Error', 'Failed to navigate to home. Please try again.');
        }
    };

    return (
        <LinearGradient
            colors={Theme.backgrounds.white as any}
            style={styles.container}
        >
            <ScrollView
                contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Back Button */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <FontAwesome name="arrow-left" size={24} color={Theme.variants.primary} />
                    </TouchableOpacity>
                </View>

                {/* Title */}
                <View style={styles.titleSection}>
                    <Text style={styles.title}>Enable Location Tracking</Text>
                    <Text style={styles.subtitle}>
                        We need access to your location to provide location-based services
                    </Text>
                </View>

                {/* Icon Section */}
                <View style={styles.iconSection}>
                    <View style={styles.iconContainer}>
                        <FontAwesome name="map-marker" size={48} color={Theme.variants.primary} />
                    </View>
                </View>

                {/* Features List */}
                <View style={styles.featuresSection}>
                    <Text style={styles.featuresTitle}>Why we need your location:</Text>

                    <View style={styles.featureItem}>
                        <View style={styles.featureBullet}>
                            <FontAwesome name="check" size={12} color="#fff" />
                        </View>
                        <Text style={styles.featureText}>Find nearby resources and support</Text>
                    </View>

                    <View style={styles.featureItem}>
                        <View style={styles.featureBullet}>
                            <FontAwesome name="check" size={12} color="#fff" />
                        </View>
                        <Text style={styles.featureText}>Deliver accurate reports based on location</Text>
                    </View>

                    <View style={styles.featureItem}>
                        <View style={styles.featureBullet}>
                            <FontAwesome name="check" size={12} color="#fff" />
                        </View>
                        <Text style={styles.featureText}>Help emergency responders reach you faster</Text>
                    </View>

                    <View style={styles.featureItem}>
                        <View style={styles.featureBullet}>
                            <FontAwesome name="check" size={12} color="#fff" />
                        </View>
                        <Text style={styles.featureText}>Get location-specific alerts and notifications</Text>
                    </View>
                </View>

                {/* Privacy Notice */}
                <View style={styles.privacyCard}>
                    <FontAwesome name="shield" size={20} color={Theme.variants.primary} />
                    <Text style={styles.privacyText}>
                        Your location data is encrypted and only used for the purposes you've authorized. You can revoke location access anytime in your device settings.
                    </Text>
                </View>

                {/* Permission Status */}
                {locationGranted && (
                    <View style={styles.successCard}>
                        <FontAwesome name="check-circle" size={20} color="#4CAF50" />
                        <Text style={styles.successText}>
                            Location permission granted! Ready to proceed.
                        </Text>
                    </View>
                )}

                {/* Proceed Button */}
                <TouchableOpacity
                    style={[styles.proceedButton, (loading || !locationGranted) && styles.buttonDisabled]}
                    onPress={locationGranted ? proceedToHome : handleRequestPermission}
                    disabled={loading}
                >
                    <Text style={styles.proceedButtonText}>
                        {loading ? 'Requesting Permission...' : locationGranted ? 'Go to Home' : 'Enable Location'}
                    </Text>
                    <FontAwesome name={locationGranted ? 'home' : 'arrow-right'} size={16} color="#fff" style={{ marginLeft: 8 }} />
                </TouchableOpacity>

                {/* Mandatory Notice */}
                <Text style={styles.mandatoryNotice}>
                    ⚠️ Location permission is mandatory to use this app
                </Text>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        padding: 20,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 30,
    },
    titleSection: {
        marginBottom: 40,
    },
    title: {
        fontFamily: Theme.typography.geom,
        fontSize: 28,
        fontWeight: 'bold',
        color: Theme.variants.text,
        marginBottom: 10,
    },
    subtitle: {
        fontFamily: Theme.typography.inter.regular,
        fontSize: 14,
        color: Theme.variants.textMuted,
        lineHeight: 20,
    },
    iconSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#f0f7ff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Theme.variants.primary,
    },
    featuresSection: {
        marginBottom: 32,
    },
    featuresTitle: {
        fontFamily: Theme.typography.inter.bold,
        fontSize: 14,
        fontWeight: '600',
        color: Theme.variants.text,
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
        gap: 12,
    },
    featureBullet: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Theme.variants.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
        flexShrink: 0,
    },
    featureText: {
        fontFamily: Theme.typography.inter.regular,
        fontSize: 14,
        color: Theme.variants.text,
        flex: 1,
        lineHeight: 20,
    },
    privacyCard: {
        backgroundColor: '#f0f7ff',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 20,
        gap: 12,
        borderLeftWidth: 4,
        borderLeftColor: Theme.variants.primary,
    },
    privacyText: {
        fontFamily: Theme.typography.inter.regular,
        fontSize: 13,
        color: Theme.variants.text,
        flex: 1,
        lineHeight: 18,
    },
    successCard: {
        backgroundColor: '#f1f8f4',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#4CAF50',
    },
    successText: {
        fontFamily: Theme.typography.inter.semibold,
        fontSize: 14,
        fontWeight: '600',
        color: '#2e7d32',
        flex: 1,
    },
    proceedButton: {
        backgroundColor: Theme.variants.primary,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
        marginBottom: 16,
    },
    proceedButtonText: {
        fontFamily: Theme.typography.inter.bold,
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    mandatoryNotice: {
        fontFamily: Theme.typography.inter.regular,
        fontSize: 12,
        color: Theme.variants.textMuted,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
