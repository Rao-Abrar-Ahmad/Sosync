import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '@/config/firebaseConfig';
import Theme from '@/config/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { adminGetSystemStats } from '@/config/dbutils';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<{ totalUsers: number, totalReports: number, activeSOS: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await adminGetSystemStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const navItems = [
    { title: 'Manage Users', icon: 'users', color: '#4A90E2', route: '/admin/users' },
    { title: 'Manage Reports', icon: 'file-text-o', color: '#F5A623', route: '/admin/reports' },
    { title: 'SOS Monitor', icon: 'warning', color: '#D0021B', route: '/admin/sos' },
    { title: 'Broadcast Alerts', icon: 'bullhorn', color: '#7ED321', route: '/admin/broadcast' },
  ];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Theme.variants.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.welcome}>Admin Control Center</Text>
          <Text style={styles.subtitle}>Overview of Sosync Platform</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderLeftColor: '#4A90E2' }]}>
            <Text style={styles.statLabel}>Total Users</Text>
            <Text style={styles.statValue}>{stats?.totalUsers || 0}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#F5A623' }]}>
            <Text style={styles.statLabel}>Reports</Text>
            <Text style={styles.statValue}>{stats?.totalReports || 0}</Text>
          </View>
          <View style={[styles.statCard, { borderLeftColor: '#D0021B' }]}>
            <Text style={styles.statLabel}>Active SOS</Text>
            <Text style={styles.statValue}>{stats?.activeSOS || 0}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Management Modules</Text>
        <View style={styles.menuGrid}>
          {navItems.map((item, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.menuCard}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color + '15' }]}>
                <FontAwesome name={item.icon as any} size={24} color={item.color} />
              </View>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <FontAwesome name="chevron-right" size={12} color="#ccc" style={styles.chevron} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <FontAwesome name="sign-out" size={18} color="#ff4444" />
          <Text style={styles.logoutTxt}>System Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>Sosync Admin v1.0.2 • Secure Session</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  welcome: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 26,
    color: Theme.variants.text,
  },
  subtitle: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 15,
    color: Theme.variants.textMuted,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 30,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statLabel: {
    fontFamily: Theme.typography.inter.medium,
    fontSize: 12,
    color: Theme.variants.textMuted,
    textTransform: 'uppercase',
  },
  statValue: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 22,
    color: Theme.variants.text,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 18,
    color: Theme.variants.text,
    marginBottom: 16,
  },
  menuGrid: {
    gap: 12,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTitle: {
    flex: 1,
    fontFamily: Theme.typography.inter.semibold,
    fontSize: 16,
    color: Theme.variants.text,
  },
  chevron: {
    marginLeft: 8,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 40,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff444433',
  },
  logoutTxt: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 15,
    color: '#ff4444',
  },
  footer: {
    textAlign: 'center',
    fontFamily: Theme.typography.inter.regular,
    fontSize: 12,
    color: '#bbb',
    marginTop: 30,
    marginBottom: 10,
  },
});
