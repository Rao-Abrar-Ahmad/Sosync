import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ScrollView, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebaseConfig';
import { useUser } from '@/context/UserContext';
import Theme from '@/config/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function CompleteProfileScreen() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useUser();

    // Static profile picture for now
    const profilePictureUri = user?.photoURL || 'https://via.placeholder.com/120?text=No+Photo';

    // Handle proceed without profile picture
    const handleProceed = async () => {
        try {
            setLoading(true);
            // Profile is already set up during signup, just proceed
            router.push('/(onboarding)/allow-gps');
        } catch (error) {
            console.error('Error proceeding:', error);
            Alert.alert('Error', 'Failed to proceed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle skip profile picture
    const handleSkip = () => {
        router.push('/(onboarding)/allow-gps');
    };

    // Handle upload image (static for now)
    const handleUploadImage = () => {
        Alert.alert(
            'Upload Profile Picture',
            'Image upload functionality will be added soon. You can update your profile picture later from the profile page.',
            [{ text: 'OK' }]
        );
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
                    <Text style={styles.title}>Complete Your Profile</Text>
                    <Text style={styles.subtitle}>
                        Add a profile picture to help others recognize you
                    </Text>
                </View>

                {/* Profile Picture Section */}
                <View style={styles.profileSection}>
                    <View style={styles.profilePictureContainer}>
                        <Image
                            source={{ uri: profilePictureUri }}
                            style={styles.profilePicture}
                        />
                        <TouchableOpacity
                            style={styles.uploadButton}
                            onPress={handleUploadImage}
                        >
                            <FontAwesome name="camera" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.userInfoSection}>
                        <Text style={styles.userName}>
                            {user?.displayName || 'User Name'}
                        </Text>
                        <Text style={styles.userEmail}>
                            {user?.email || 'user@example.com'}
                        </Text>
                    </View>
                </View>

                {/* Info Card */}
                <View style={styles.infoCard}>
                    <FontAwesome name="info-circle" size={20} color={Theme.variants.primary} />
                    <Text style={styles.infoText}>
                        You can update your profile picture anytime from your profile page
                    </Text>
                </View>

                {/* Buttons Section */}
                <View style={styles.buttonsSection}>
                    {/* Skip Button */}
                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={handleSkip}
                        disabled={loading}
                    >
                        <Text style={styles.skipButtonText}>Skip</Text>
                    </TouchableOpacity>

                    {/* Proceed Button */}
                    <TouchableOpacity
                        style={[styles.proceedButton, loading && styles.buttonDisabled]}
                        onPress={handleProceed}
                        disabled={loading}
                    >
                        <Text style={styles.proceedButtonText}>
                            {loading ? 'Proceeding...' : 'Proceed'}
                        </Text>
                        <FontAwesome name="arrow-right" size={16} color="#fff" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>
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
    profileSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    profilePictureContainer: {
        position: 'relative',
        marginBottom: 20,
    },
    profilePicture: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 4,
        borderColor: Theme.variants.primary,
        backgroundColor: '#f5f5f5',
    },
    uploadButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Theme.variants.primary,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 5,
    },
    userInfoSection: {
        alignItems: 'center',
    },
    userName: {
        fontFamily: Theme.typography.inter.bold,
        fontSize: 18,
        fontWeight: '600',
        color: Theme.variants.text,
        marginBottom: 4,
    },
    userEmail: {
        fontFamily: Theme.typography.inter.regular,
        fontSize: 14,
        color: Theme.variants.textMuted,
    },
    infoCard: {
        backgroundColor: '#f0f7ff',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 40,
        borderLeftWidth: 4,
        borderLeftColor: Theme.variants.primary,
    },
    infoText: {
        fontFamily: Theme.typography.inter.regular,
        fontSize: 13,
        color: Theme.variants.text,
        marginLeft: 12,
        flex: 1,
        lineHeight: 18,
    },
    buttonsSection: {
        gap: 12,
    },
    skipButton: {
        borderWidth: 1.5,
        borderColor: Theme.variants.border,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    skipButtonText: {
        fontFamily: Theme.typography.inter.semibold,
        fontSize: 16,
        fontWeight: '600',
        color: Theme.variants.text,
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
});
