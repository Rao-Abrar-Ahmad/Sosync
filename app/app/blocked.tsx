import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { auth } from '@/config/firebaseConfig';
import Theme from '@/config/theme';

export default function BlockedScreen() {
    const handleLogout = async () => {
        try {
            await auth.signOut();
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconCircle}>
                    <FontAwesome name="lock" size={60} color="#F44336" />
                </View>
                
                <Text style={styles.title}>Account Suspended</Text>
                <Text style={styles.subtitle}>
                    Your account has been suspended by the system administrator for violating community guidelines or suspicious activity.
                </Text>

                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                        If you believe this is a mistake, please contact support at support@sosync.com
                    </Text>
                </View>

                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                    <Text style={styles.logoutBtnText}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    iconCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFEBEE',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
    },
    title: {
        fontFamily: Theme.typography.geom,
        fontSize: 24,
        fontWeight: 'bold',
        color: Theme.variants.text,
        marginBottom: 16,
    },
    subtitle: {
        fontFamily: Theme.typography.inter.regular,
        fontSize: 16,
        color: Theme.variants.textMuted,
        textAlign: 'center',
        lineHeight: 24,
    },
    infoBox: {
        backgroundColor: '#f5f5f5',
        padding: 20,
        borderRadius: 12,
        marginTop: 40,
        width: '100%',
    },
    infoText: {
        fontFamily: Theme.typography.inter.medium,
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
    },
    logoutBtn: {
        marginTop: 'auto',
        paddingVertical: 15,
        width: '100%',
        alignItems: 'center',
    },
    logoutBtnText: {
        fontFamily: Theme.typography.inter.bold,
        color: Theme.variants.primary,
        fontSize: 16,
    },
});
