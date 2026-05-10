import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Theme from '@/config/theme';
import { adminGetAllUsers } from '@/config/dbutils';
import { sendBroadcastPushNotification } from '@/services/NotificationService';

type NotificationType = 'CRITICAL' | 'WARNING' | 'INFO' | 'UPDATE';

export default function AdminBroadcastScreen() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [type, setType] = useState<NotificationType>('INFO');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ totalUsers: 0, withTokens: 0 });

    useEffect(() => {
        fetchUserStats();
    }, []);

    const fetchUserStats = async () => {
        try {
            const users = await adminGetAllUsers();
            const withTokens = users.filter(u => u.pushToken).length;
            setStats({ totalUsers: users.length, withTokens });
        } catch (error) {
            console.error('Error fetching user stats:', error);
        }
    };

    const handleSendBroadcast = async () => {
        if (!title || !message) {
            Alert.alert('Validation Error', 'Please enter both title and message.');
            return;
        }

        Alert.alert(
            'Confirm Broadcast',
            `This will send a push notification to all ${stats.withTokens} reachable users. Continue?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send Now',
                    onPress: async () => {
                        try {
                            setLoading(true);
                            const users = await adminGetAllUsers();
                            const tokens = users
                                .map(u => u.pushToken)
                                .filter(t => !!t) as string[];

                            if (tokens.length === 0) {
                                Alert.alert('Error', 'No reachable users with push tokens found.');
                                return;
                            }

                            await sendBroadcastPushNotification(tokens, title, message, { priority: type });
                            Alert.alert('Success', 'Broadcast notification sent successfully!');
                            setTitle('');
                            setMessage('');
                        } catch (error: any) {
                            Alert.alert('Error', 'Failed to send broadcast: ' + error.message);
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    const getTypeColor = (t: NotificationType) => {
        switch (t) {
            case 'CRITICAL': return '#F44336';
            case 'WARNING': return '#FF9800';
            case 'UPDATE': return '#2196F3';
            default: return '#4CAF50';
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <FontAwesome name="arrow-left" size={20} color={Theme.variants.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Broadcast Alert</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Stats Card */}
                <View style={styles.statsCard}>
                    <View style={styles.statItem}>
                        <Text style={styles.statVal}>{stats.totalUsers}</Text>
                        <Text style={styles.statLabel}>Total Users</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statVal}>{stats.withTokens}</Text>
                        <Text style={styles.statLabel}>Reachable</Text>
                    </View>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    <Text style={styles.label}>Notification Type</Text>
                    <View style={styles.typeRow}>
                        {(['INFO', 'UPDATE', 'WARNING', 'CRITICAL'] as NotificationType[]).map((t) => (
                            <TouchableOpacity
                                key={t}
                                style={[
                                    styles.typeBtn,
                                    type === t && { backgroundColor: getTypeColor(t), borderColor: getTypeColor(t) }
                                ]}
                                onPress={() => setType(t)}
                            >
                                <Text style={[styles.typeText, type === t && { color: '#fff' }]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.label}>Alert Title</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g., Flood Warning - Sindh Region"
                        value={title}
                        onChangeText={setTitle}
                        maxLength={50}
                    />

                    <Text style={styles.label}>Message Content</Text>
                    <TextInput
                        style={[styles.input, styles.textArea]}
                        placeholder="Provide detailed instructions or information..."
                        value={message}
                        onChangeText={setMessage}
                        multiline
                        numberOfLines={5}
                        textAlignVertical="top"
                    />

                    <Text style={styles.label}>Quick Templates</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
                        {[
                            { t: 'Flood Warning', m: 'Severe flood warning for your region. Please move to higher ground immediately and follow local authorities.', type: 'CRITICAL' },
                            { t: 'Earthquake Alert', m: 'Strong earthquake felt. Please stay outdoors in clear areas or under sturdy furniture if indoors. Watch for aftershocks.', type: 'CRITICAL' },
                            { t: 'Weather Update', m: 'Heavy rain and thunderstorms expected in the next 24 hours. Avoid unnecessary travel.', type: 'WARNING' },
                            { t: 'System Update', m: 'Sosync app has been updated with new safety features. Please check the latest report maps.', type: 'UPDATE' },
                        ].map((temp, i) => (
                            <TouchableOpacity
                                key={i}
                                style={styles.templateBtn}
                                onPress={() => {
                                    setTitle(temp.t);
                                    setMessage(temp.m);
                                    setType(temp.type as any);
                                }}
                            >
                                <Text style={styles.templateBtnTxt}>{temp.t}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <TouchableOpacity
                        style={[styles.sendBtn, loading && { opacity: 0.7 }]}
                        onPress={handleSendBroadcast}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <FontAwesome name="send" size={18} color="#fff" />
                                <Text style={styles.sendBtnText}>Send Broadcast Now</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.infoCard}>
                    <FontAwesome name="info-circle" size={20} color={Theme.variants.primary} />
                    <Text style={styles.infoText}>
                        Broadcasts are sent immediately to all users who have enabled push notifications. Please use this feature responsibly for critical updates.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f9fa' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    backBtn: { width: 40, height: 40, justifyContent: 'center' },
    headerTitle: { fontFamily: Theme.typography.inter.bold, fontSize: 18, color: Theme.variants.text },
    content: { padding: 20 },
    statsCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    statItem: { flex: 1, alignItems: 'center' },
    statVal: { fontSize: 24, fontFamily: Theme.typography.inter.bold, color: Theme.variants.primary },
    statLabel: { fontSize: 12, color: Theme.variants.textMuted, marginTop: 4 },
    divider: { width: 1, backgroundColor: '#eee', marginHorizontal: 10 },
    form: { backgroundColor: '#fff', borderRadius: 16, padding: 20, elevation: 2 },
    label: { fontSize: 14, fontFamily: Theme.typography.inter.semibold, color: Theme.variants.text, marginBottom: 12, marginTop: 10 },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    typeBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#eee', backgroundColor: '#f5f5f5' },
    typeText: { fontSize: 11, fontWeight: 'bold', color: '#666' },
    input: {
        backgroundColor: '#f9f9f9',
        borderRadius: 10,
        padding: 12,
        fontSize: 16,
        fontFamily: Theme.typography.inter.regular,
        borderWidth: 1,
        borderColor: '#eee',
        marginBottom: 16,
    },
    textArea: { height: 120 },
    sendBtn: {
        backgroundColor: Theme.variants.primary,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 10,
    },
    sendBtnText: { color: '#fff', fontSize: 16, fontFamily: Theme.typography.inter.bold },
    infoCard: { flexDirection: 'row', backgroundColor: '#e3f2fd', padding: 16, borderRadius: 12, marginTop: 24, gap: 12 },
    infoText: { flex: 1, fontSize: 13, color: '#1976d2', lineHeight: 18, fontFamily: Theme.typography.inter.regular },
    templateScroll: {
        marginBottom: 20,
        marginHorizontal: -5,
    },
    templateBtn: {
        backgroundColor: '#f0f4f8',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        marginHorizontal: 5,
        borderWidth: 1,
        borderColor: '#d1d9e6',
    },
    templateBtnTxt: {
        fontSize: 12,
        fontFamily: Theme.typography.inter.medium,
        color: '#444',
    },
});
