import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider } from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { auth } from '@/config/firebaseConfig';
import Theme from '@/config/theme';
import Input from '@/components/Input';
import { globalStyles } from '@/config/styles';
import Logo from '@/components/Logo';
import FontAwesome from '@expo/vector-icons/FontAwesome';

WebBrowser.maybeCompleteAuthSession();

// 🔑 Google Auth Configuration
const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '';
const GOOGLE_AUTH_ENABLED = true;

export default function LoginScreen() {
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const router = useRouter();

    const redirectUri = makeRedirectUri();
    console.log("\n============================================");
    console.log("👉 YOUR REDIRECT URI IS:", redirectUri);
    console.log("============================================\n");

    // 🔐 Google Auth Setup using expo-auth-session
    const [request, response, promptAsync] = GOOGLE_AUTH_ENABLED
        ? Google.useAuthRequest({
            webClientId: GOOGLE_WEB_CLIENT_ID,
            androidClientId: GOOGLE_ANDROID_CLIENT_ID,
        })
        : [null, null, () => {
            Alert.alert('Google Sign-In', 'Google Sign-In is being configured. Please use email/password for now.');
        }];

    // 👂 Listen for Google auth response
    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            if (id_token) {
                handleGoogleSignIn(id_token);
            }
        } else if (response?.type === 'error') {
            Alert.alert('Authentication Error', 'Failed to sign in with Google');
            setGoogleLoading(false);
        }
    }, [response]);

    // ✅ Handle Google Sign-In
    const handleGoogleSignIn = async (idToken: string) => {
        try {
            setGoogleLoading(true);
            // Create Firebase credential from Google idToken
            const credential = GoogleAuthProvider.credential(idToken);
            // Sign in with Firebase using Google credential
            await signInWithCredential(auth, credential);
            // Success: Redirection will be handled by _layout.tsx
        } catch (error: any) {
            console.error('Google Sign-In Error:', error);
            Alert.alert('Google Sign-In Failed', error.message || 'An error occurred');
        } finally {
            setGoogleLoading(false);
        }
    };

    // ✅ Handle Email/Password Sign-In
    const handleEmailSignIn = async () => {
        if (!email || !password) {
            Alert.alert('Validation Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Success: Redirection will be handled by _layout.tsx
        } catch (error: any) {
            console.error('Login Error:', error);

            // Handle specific Firebase errors
            if (error.code === 'auth/user-not-found') {
                Alert.alert('Login Failed', 'No account found with this email');
            } else if (error.code === 'auth/wrong-password') {
                Alert.alert('Login Failed', 'Incorrect password');
            } else if (error.code === 'auth/invalid-email') {
                Alert.alert('Login Failed', 'Invalid email address');
            } else if (error.code === 'auth/too-many-requests') {
                Alert.alert('Login Failed', 'Too many failed attempts. Please try again later.');
            } else if (error.code === 'auth/invalid-credential') {
                Alert.alert('Login Failed', 'Invalid credentials. Please check your email and password.');
            } else {
                Alert.alert('Login Failed', error.message);
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
                <ScrollView
                    contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 20) + 20, paddingTop: Math.max(insets.top, 20) + 20 }]}
                    showsVerticalScrollIndicator={false}
                >
                    <Logo />

                    <View style={styles.header}>
                        <Text style={styles.title}>Welcome Back</Text>
                        <Text style={styles.subtitle}>Sign in to continue to Sosync</Text>
                    </View>

                    <View style={globalStyles.form}>
                        {/* Email Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <Input
                                placeholder="Enter your email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!loading && !googleLoading}
                            />
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <Input
                                placeholder="Enter your password"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                editable={!loading && !googleLoading}
                            />
                        </View>

                        {/* Sign In Button */}
                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleEmailSignIn}
                            disabled={loading || googleLoading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Signing In...' : 'Sign In'}
                            </Text>
                        </TouchableOpacity>

                        {/* OR Divider */}
                        <View style={styles.dividerContainer}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>OR</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Google Sign-In Button - TEMPORARILY DISABLED */}
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
                                        {!GOOGLE_AUTH_ENABLED ? 'Google Sign-In (Coming Soon)' : 'Sign In with Google'}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        {/* Sign Up Link */}
                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Don't have an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/(auth)/signup')} disabled={loading || googleLoading}>
                                <Text style={styles.link}>Sign Up</Text>
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
    },
    header: {
        marginBottom: 40,
        alignItems: 'center',
    },
    title: {
        fontFamily: Theme.typography.geom,
        fontSize: 28,
        fontWeight: 'bold',
        color: Theme.variants.text,
        marginBottom: 0,
    },
    subtitle: {
        fontFamily: Theme.typography.inter.regular,
        fontSize: 16,
        color: Theme.variants.textMuted,
        marginTop: 5,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontFamily: Theme.typography.inter.medium,
        fontSize: 14,
        color: Theme.variants.text,
        marginBottom: 8,
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
