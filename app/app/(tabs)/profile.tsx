import React, { useState } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { TouchableOpacity, Image } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Theme from '@/config/theme';
import { useUser } from '@/context/UserContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const email = user?.email || 'Not provided';

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await signOut(auth);
              router.replace('/(onboarding)/welcome');
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
              console.error('Logout error:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    router.push('/(tabs)/profile'); // You can create an edit profile screen
    Alert.alert('Edit Profile', 'Edit profile feature coming soon!');
  };

  const handleGPSPermissions = () => {
    Alert.alert(
      'GPS Location Permissions',
      'Would you like to enable location services for this app?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Enable', onPress: () => Alert.alert('Success', 'Location permissions enabled!') },
      ]
    );
  };

  const handleTermsAndConditions = () => {
    Alert.alert(
      'Terms and Conditions',
      'By using SoSync, you agree to our terms of service and privacy policy.\n\nVersion 1.0.0',
      [{ text: 'I Agree', onPress: () => console.log('Agreed') }]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Picture Section */}
      <View style={styles.profilePictureSection}>
        <View style={styles.avatarWrapper}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <FontAwesome name="user" size={60} color="#fff" />
            </View>
          )}
        </View>

        {/* User Info */}
        <Text style={styles.userName}>{displayName}</Text>
        <Text style={styles.userEmail}>{email}</Text>

        {/* Edit Profile Button */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleEditProfile}
          activeOpacity={0.7}
        >
          <FontAwesome name="edit" size={16} color="#fff" />
          <Text style={styles.editButtonText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Settings Section */}
      <View style={styles.settingsSection}>
        {/* Edit Profile Card */}
        <TouchableOpacity
          style={styles.settingCard}
          onPress={handleEditProfile}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <FontAwesome name="user-circle" size={24} color={Theme.variants.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Edit Profile</Text>
            <Text style={styles.cardDescription}>Update your name, email, and photo</Text>
          </View>
          <FontAwesome name="chevron-right" size={16} color={Theme.variants.textMuted} />
        </TouchableOpacity>

        {/* GPS Location Permissions Card */}
        <TouchableOpacity
          style={styles.settingCard}
          onPress={handleGPSPermissions}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <FontAwesome name="map-marker" size={24} color={Theme.variants.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>GPS Location Permissions</Text>
            <Text style={styles.cardDescription}>Manage location access and settings</Text>
          </View>
          <FontAwesome name="chevron-right" size={16} color={Theme.variants.textMuted} />
        </TouchableOpacity>

        {/* Terms and Conditions Card */}
        <TouchableOpacity
          style={styles.settingCard}
          onPress={handleTermsAndConditions}
          activeOpacity={0.7}
        >
          <View style={styles.iconContainer}>
            <FontAwesome name="file-text" size={24} color={Theme.variants.primary} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Terms and Conditions</Text>
            <Text style={styles.cardDescription}>Review our terms and privacy policy</Text>
          </View>
          <FontAwesome name="chevron-right" size={16} color={Theme.variants.textMuted} />
        </TouchableOpacity>

        {/* Logout Card */}
        <TouchableOpacity
          style={[styles.settingCard, styles.logoutCard]}
          onPress={handleLogout}
          activeOpacity={0.7}
          disabled={loading}
        >
          <View style={[styles.iconContainer, styles.logoutIconContainer]}>
            <FontAwesome name="sign-out" size={24} color="#fff" />
          </View>
          <View style={styles.cardContent}>
            <Text style={[styles.cardTitle, styles.logoutText]}>
              {loading ? 'Logging out...' : 'Logout'}
            </Text>
            <Text style={[styles.cardDescription, styles.logoutDescription]}>
              Sign out of your account
            </Text>
          </View>
          <FontAwesome
            name="chevron-right"
            size={16}
            color={loading ? Theme.variants.textMuted : '#ff4444'}
          />
        </TouchableOpacity>
      </View>

      {/* Version Information */}
      <View style={styles.footerSection}>
        <Text style={styles.versionText}>SoSync v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.variants.border,
    backgroundColor: '#fff',
  },
  avatarWrapper: {
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: '#fff',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Theme.variants.primary,
    backgroundColor: '#fff',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Theme.variants.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Theme.variants.primary,
  },

  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: Theme.variants.text,
    marginBottom: 4,
    fontFamily: Theme.typography.inter.bold,
  },

  userEmail: {
    fontSize: 14,
    color: Theme.variants.textMuted,
    marginBottom: 24,
    fontFamily: Theme.typography.inter.regular,
  },

  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.variants.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },

  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Theme.typography.inter.semibold,
  },

  settingsSection: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    gap: 12,
    backgroundColor: '#fff',
  },

  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Theme.variants.border,
  },

  logoutCard: {
    backgroundColor: '#fff5f5',
    borderColor: '#ffdddd',
  },

  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  logoutIconContainer: {
    backgroundColor: '#ff4444',
  },

  cardContent: {
    flex: 1,
    backgroundColor: '#fff',
  },

  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Theme.variants.text,
    marginBottom: 4,
    fontFamily: Theme.typography.inter.semibold,
    backgroundColor: '#fff',
  },

  logoutText: {
    color: '#ff4444',
  },

  cardDescription: {
    fontSize: 12,
    color: Theme.variants.textMuted,
    fontFamily: Theme.typography.inter.regular,
  },

  logoutDescription: {
    color: '#cc0000',
  },

  footerSection: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: Theme.variants.border,
    backgroundColor: '#fff',
  },

  versionText: {
    fontSize: 12,
    color: Theme.variants.textMuted,
    fontFamily: Theme.typography.inter.regular,
    backgroundColor: '#fff',
  },
});
