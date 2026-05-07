import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { auth } from '@/config/firebaseConfig';
import Theme from '@/config/theme';

export default function AdminDashboard() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await auth.signOut();
      // AuthHandler in _layout.tsx will automatically redirect to welcome screen
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Admin Dashboard</Text>
        <Text style={styles.subtitle}>You have administrative access.</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Manage Reports</Text>
          <Text style={styles.cardDesc}>View and manage user disaster reports.</Text>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    flex: 1,
  },
  title: {
    fontFamily: Theme.typography.geom,
    fontSize: 24,
    color: Theme.variants.text,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 16,
    color: Theme.variants.textMuted,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 18,
    color: Theme.variants.text,
    marginBottom: 8,
  },
  cardDesc: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 14,
    color: Theme.variants.textMuted,
  },
  logoutButton: {
    backgroundColor: Theme.variants.danger || '#ef4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 20,
  },
  logoutButtonText: {
    color: '#fff',
    fontFamily: Theme.typography.inter.bold,
    fontSize: 16,
  },
});
