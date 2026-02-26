import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/config/firebaseConfig';
import Theme from '@/config/theme';
import { globalStyles } from '@/config/styles';
import Input from '@/components/Input';

export default function SignupScreen() {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSignup = async () => {
        if (!firstName || !lastName || !email || !phoneNumber || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            // 1. Create user in Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            console.log(user);
            // 2. Create user profile in Firestore
            const document = await setDoc(doc(db, 'users', user.uid), {
                id: user.uid,
                first_name: firstName,
                last_name: lastName,
                email: email,
                phone_number: phoneNumber,
                role: 'USER',
                is_active: true,
                auth_provider: 'email',
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
            });

            console.log(document);
            Alert.alert('Success', 'Account created successfully!', [
                { text: 'OK', onPress: () => router.replace('/(tabs)') }
            ]);
        } catch (error: any) {
            console.log(error);
            Alert.alert('Signup Failed', error.message);
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
                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join Sosync to stay safe and connected</Text>
                    </View>

                    <View style={globalStyles.form}>
                        <View style={styles.row}>
                            <View style={[styles.inputContainer, { flex: 1, marginRight: 10 }]}>
                                <Text style={styles.label}>First Name</Text>
                                <Input
                                    placeholder="John"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                />
                            </View>
                            <View style={[styles.inputContainer, { flex: 1 }]}>
                                <Text style={styles.label}>Last Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Doe"
                                    value={lastName}
                                    onChangeText={setLastName}
                                />
                            </View>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="john.doe@example.com"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="+1 234 567 890"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                keyboardType="phone-pad"
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Min. 6 characters"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Confirm Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Re-enter password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                            />
                        </View>

                        <TouchableOpacity
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleSignup}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Creating Account...' : 'Sign Up'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.push('/login')}>
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
        paddingTop: 60,
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
    },
    inputContainer: {
        marginBottom: 15,
    },
    label: {
        fontFamily: Theme.typography.inter.medium,
        fontSize: 14,
        color: Theme.variants.text,
        marginBottom: 6,
    },
    input: {
        fontFamily: Theme.typography.inter.regular,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: Theme.variants.border,
        padding: 8,
        borderRadius: 4,
        fontSize: 14,
    },
    button: {
        backgroundColor: Theme.variants.primary,
        padding: 10,
        borderRadius: 4,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonDisabled: {
        opacity: 0.7,
    },
    buttonText: {
        fontFamily: Theme.typography.inter.bold,
        color: '#fff',
        fontSize: 18,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
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
    },
});
