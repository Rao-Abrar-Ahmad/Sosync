import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import Theme from '@/config/theme';
import Input from '@/components/Input';
import { globalStyles } from '@/config/styles';
import Logo from '@/components/Logo';
import FontAwesome from '@expo/vector-icons/FontAwesome';

export default function ForgotPasswordScreen() {
    const insets = useSafeAreaInsets();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleResetPassword = async () => {
        if (!email) {
            Alert.alert('Validation Error', 'Please enter your email address');
            return;
        }

        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            Alert.alert(
                'Success',
                'Password reset email has been sent. Please check your inbox.',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error: any) {
            console.error('Password Reset Error:', error);
            if (error.code === 'auth/user-not-found') {
                Alert.alert('Error', 'No account found with this email address.');
            } else if (error.code === 'auth/invalid-email') {
                Alert.alert('Error', 'Invalid email address.');
            } else {
                Alert.alert('Error', error.message || 'An error occurred. Please try again.');
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
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <FontAwesome name="arrow-left" size={20} color={Theme.variants.text} />
                    </TouchableOpacity>

                    <Logo />

                    <View style={styles.header}>
                        <Text style={styles.title}>Reset Password</Text>
                        <Text style={styles.subtitle}>Enter your email to receive a password reset link</Text>
                    </View>

                    <View style={globalStyles.form}>
                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email Address</Text>
                            <Input
                                placeholder="Enter your registered email"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                editable={!loading}
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleResetPassword}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Send Reset Link</Text>
                            )}
                        </TouchableOpacity>
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
    backBtn: {
        position: 'absolute',
        top: 60,
        left: 20,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
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
        marginBottom: 10,
    },
    subtitle: {
        fontFamily: Theme.typography.inter.regular,
        fontSize: 16,
        color: Theme.variants.textMuted,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    inputContainer: {
        marginBottom: 24,
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
});
