import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword, signInWithCredential, GoogleAuthProvider, updateProfile } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { auth, db } from '@/config/firebaseConfig';
import { createUserDocument, userDocumentExists } from '@/config/dbutils';
import Theme from '@/config/theme';
import { globalStyles } from '@/config/styles';
import Input from '@/components/Input';
import FontAwesome from '@expo/vector-icons/FontAwesome';

WebBrowser.maybeCompleteAuthSession();

// 🔑 TEMPORARY: Google Auth Configuration
// ⚠️  This is temporarily disabled to prevent app crashes
// We will configure it properly later with Android Client ID
// For now, Google Sign-Up button is shown as disabled
const GOOGLE_WEB_CLIENT_ID = ''; // Will be set up later
const GOOGLE_ANDROID_CLIENT_ID = ''; // Will be set up later
const GOOGLE_AUTH_ENABLED = false; // Temporarily disabled

export default function SignupScreen() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const router = useRouter();

    // 🔐 Google Auth Setup using expo-auth-session (TEMPORARILY DISABLED)
    // This will be enabled once we configure Android Client ID
    const [request, response, promptAsync] = GOOGLE_AUTH_ENABLED
        ? Google.useAuthRequest({
            webClientId: GOOGLE_WEB_CLIENT_ID,
            androidClientId: GOOGLE_ANDROID_CLIENT_ID,
        })
        : [null, null, () => {
            Alert.alert('Google Sign-Up', 'Google Sign-Up is being configured. Please use email/password for now.');
        }];

    // 👂 Listen for Google auth response
    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            if (id_token) {
                handleGoogleSignUp(id_token);
            }
        } else if (response?.type === 'error') {
            Alert.alert('Authentication Error', 'Failed to sign up with Google');
            setGoogleLoading(false);
        }
    }, [response]);

    // ✅ Handle Google Sign-Up
    const handleGoogleSignUp = async (idToken: string) => {
        try {
            setGoogleLoading(true);
            // Create Firebase credential from Google idToken
            const credential = GoogleAuthProvider.credential(idToken);
            // Sign in with Firebase using Google credential
            const userCredential = await signInWithCredential(auth, credential);
            const user = userCredential.user;

            // Check if user profile already exists in Firestore
            const userExists = await userDocumentExists(user.uid);

            if (!userExists) {
                // Extract name from Google profile
                const displayNameParts = (user.displayName || 'User User').split(' ');
                const firstName = displayNameParts[0] || 'User';
                const lastName = displayNameParts.slice(1).join(' ') || '';

                // Create new user profile using utility
                await createUserDocument(user.uid, {
                    id: user.uid,
                    first_name: firstName,
                    last_name: lastName,
                    email: user.email || '',
                    phone_number: '',
                    profile_picture: user.photoURL || '',
                    role: 'USER',
                    is_active: true,
                    auth_provider: 'google',
                });
            }

            Alert.alert('Success', 'Account created successfully!', [
                { text: 'OK', onPress: () => router.replace('/(onboarding)/complete-profile') }
            ]);
        } catch (error: any) {
            console.error('Google Sign-Up Error:', error);
            Alert.alert('Google Sign-Up Failed', error.message || 'An error occurred');
        } finally {
            setGoogleLoading(false);
        }
    };

    // ✅ Handle Email/Password Sign-Up
    const handleEmailSignUp = async () => {
        // Validation
        if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword) {
            Alert.alert('Validation Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Validation Error', 'Passwords do not match');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Validation Error', 'Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            // 1. Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Update user profile (displayName)
            await updateProfile(user, {
                displayName: `${firstName} ${lastName}`,
            });

            // 3. Create user document in Firestore using utility
            await createUserDocument(user.uid, {
                id: user.uid,
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone_number: phoneNumber,
                profile_picture: '',
                role: 'USER',
                is_active: true,
                auth_provider: 'email',
            });

            Alert.alert('Success', 'Account created successfully!', [
                { text: 'OK', onPress: () => router.replace('/(onboarding)/complete-profile') }
            ]);
        } catch (error: any) {
            console.error('Signup Error:', error);

            // Handle specific Firebase errors
            if (error.code === 'auth/email-already-in-use') {
                Alert.alert('Signup Failed', 'This email is already registered');
            } else if (error.code === 'auth/invalid-email') {
                Alert.alert('Signup Failed', 'Invalid email address');
            } else if (error.code === 'auth/weak-password') {
                Alert.alert('Signup Failed', 'Password is too weak');
            } else {
                Alert.alert('Signup Failed', error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={Theme.backgrounds.white as any}
            style={styles.container}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join Sosync to stay safe and connected</Text>
                    </View>

                    <View style={globalStyles.form}>
                        {/* First and Last Name */}
                        <View style={styles.row}>
                            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>First Name</Text>
                                <Input
                                    placeholder="John"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    editable={!loading && !googleLoading}
                                />
                            </View>
                            <View style={[styles.inputContainer, { flex: 1 }]}>
                                <Text style={styles.label}>Last Name</Text>
                                <Input
                                    placeholder="Doe"
                                    value={lastName}
                                    onChangeText={setLastName}
                                    editable={!loading && !googleLoading}
                                />
                            </View>
                        </View>

                        {/* Email */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <Input
                                placeholder="john.doe@example.com"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!loading && !googleLoading}
                            />
                        </View>

                        {/* Phone Number */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Phone Number</Text>
                            <Input
                                placeholder="+1 234 567 890"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                                editable={!loading && !googleLoading}
                            />
                        </View>

                        {/* Password */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <Input
                                placeholder="Min. 6 characters"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                editable={!loading && !googleLoading}
                            />
                        </View>

                        {/* Confirm Password */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <Input
                                placeholder="Re-enter password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                editable={!loading && !googleLoading}
                            />
                        </View>

                        {/* Sign Up Button */}
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleEmailSignUp}
                            disabled={loading || googleLoading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Creating Account...' : 'Sign Up'}
                            </Text>
                        </TouchableOpacity>

                        {/* OR Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Google Sign-Up Button */}
                        {/* Google Sign-Up Button - TEMPORARILY DISABLED */}
                        <TouchableOpacity
                            style={[styles.googleButton, (googleLoading || !GOOGLE_AUTH_ENABLED) && styles.buttonDisabled]}
                            onPress={() => promptAsync()}
                            disabled={!request || googleLoading || loading || !GOOGLE_AUTH_ENABLED}
                        >
                            {googleLoading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <>
                                    <FontAwesome name="google" size={18} color={!GOOGLE_AUTH_ENABLED ? '#ccc' : '#000'} style={{ marginRight: 10 }} />
                                    <Text style={[styles.googleButtonText, !GOOGLE_AUTH_ENABLED && { color: '#ccc' }]}>
                                        {!GOOGLE_AUTH_ENABLED ? 'Google Sign-Up (Coming Soon)' : 'Sign Up with Google'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Sign In Link */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)/login')} disabled={loading || googleLoading}>
                                <Text style={styles.link}>Sign In</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
        paddingTop: 40,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 30,
        alignItems: 'center',
    },
    title: {
        fontFamily: Theme.typography.geom,
        fontSize: 28,
        fontWeight: 'bold',
        color: Theme.variants.text,
        marginBottom: 8,
    },
    subtitle: {
        fontFamily: Theme.typography.inter.regular,
        fontSize: 16,
        color: Theme.variants.textMuted,
        marginTop: 5,
        textAlign: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontFamily: Theme.typography.inter.medium,
        fontSize: 14,
        color: Theme.variants.text,
        marginBottom: 6,
        fontWeight: '500',
    },
    button: {
        backgroundColor: Theme.variants.primary,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        fontFamily: Theme.typography.inter.bold,
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    dividerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
        gap: 12,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: Theme.variants.border,
    },
    dividerText: {
        fontFamily: Theme.typography.inter.medium,
        fontSize: 12,
        color: Theme.variants.textMuted,
        fontWeight: '500',
    },
    googleButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: Theme.variants.border,
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    googleButtonText: {
        fontFamily: Theme.typography.inter.semibold,
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 24,
    },
    footerText: {
        fontFamily: Theme.typography.inter.regular,
        color: Theme.variants.text,
        fontSize: 14,
    },
    link: {
        fontFamily: Theme.typography.inter.bold,
        color: Theme.variants.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});
