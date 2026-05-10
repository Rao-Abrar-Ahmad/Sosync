import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import { TouchableOpacity, Image } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as Location from 'expo-location';
import Theme from '@/config/theme';
import { useUser } from '@/context/UserContext';
import { signOut } from 'firebase/auth';
import { auth } from '@/config/firebaseConfig';
import { getEmergencyContacts } from '@/config/dbutils';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [contactCount, setContactCount] = useState(0);

  const displayName = user?.first_name && user?.last_name
    ? `${user.first_name} ${user.last_name}`
    : user?.displayName || user?.email?.split('@')[0] || 'User';
  const email = user?.email || 'Not provided';
  const phone = user?.phone_number || 'Not added';
  const profilePic = user?.profile_picture || user?.photoURL || null;

  useEffect(() => {
    if (user?.uid) {
      getEmergencyContacts(user.uid)
        .then((c) => setContactCount(c.length))
        .catch(() => { });
    }
  }, [user?.uid]);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive',
        onPress: async () => {
          try {
            setLoading(true);
            await signOut(auth);
            router.replace('/(onboarding)/welcome');
          } catch { Alert.alert('Error', 'Failed to logout.'); }
          finally { setLoading(false); }
        },
      },
    ]);
  };

  const handleGPSPermissions = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') Alert.alert('Success', 'Location permissions granted!');
      else Alert.alert('Permission Denied', 'Enable location in device settings.');
    } catch { Alert.alert('Error', 'Failed to request permissions.'); }
  };

  const SettingCard = ({ icon, iconColor, title, desc, onPress, badge, danger }: any) => (
    <TouchableOpacity
      style={[styles.settingCard, danger && styles.dangerCard]}
      onPress={onPress} activeOpacity={0.7} disabled={loading}
    >
      <View style={[styles.iconBox, danger && styles.dangerIconBox]}>
        <FontAwesome name={icon} size={22} color={danger ? '#fff' : (iconColor || Theme.variants.primary)} />
      </View>
      <View style={styles.cardContent}>
        <Text style={[styles.cardTitle, danger && styles.dangerText]}>{title}</Text>
        <Text style={[styles.cardDesc, danger && styles.dangerDesc]}>{desc}</Text>
      </View>
      <View style={styles.cardRight}>
        {badge !== undefined && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
        <FontAwesome name="chevron-right" size={14}
          color={danger ? '#ff4444' : Theme.variants.textMuted} />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profile Header */}
      <View style={styles.profileSection}>
        <View style={styles.avatarWrap}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <FontAwesome name="user" size={60} color="#fff" />
            </View>
          )}
        </View>
        <Text style={styles.userName}>{displayName}</Text>
        <Text style={styles.userEmail}>{email}</Text>
        {phone !== 'Not added' && (
          <View style={styles.phoneRow}>
            <FontAwesome name="phone" size={13} color={Theme.variants.textMuted} />
            <Text style={styles.phoneText}>{phone}</Text>
          </View>
        )}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push('/(tabs)/edit-profile')}
          activeOpacity={0.7}
        >
          <FontAwesome name="edit" size={16} color="#fff" />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Settings */}
      <View style={styles.settingsSection}>
        <SettingCard
          icon="users" title="Emergency Contacts"
          desc="Manage people notified during SOS"

          onPress={() => router.push('/(tabs)/emergency-contacts')}
        />
        <SettingCard
          icon="exclamation-triangle" iconColor="#ff4444"
          title="SOS Emergency"
          desc="Send alert to your emergency contacts"
          onPress={() => router.push('/(tabs)/sos')}
        />
        <SettingCard
          icon="user-circle" title="Edit Profile"
          desc="Update your name, phone, and photo"
          onPress={() => router.push('/(tabs)/edit-profile')}
        />
        <SettingCard
          icon="map-marker" title="GPS Location Permissions"
          desc="Manage location access and settings"
          onPress={handleGPSPermissions}
        />
        <SettingCard
          icon="file-text" title="Terms and Conditions"
          desc="Review our terms and privacy policy"
          onPress={() => Alert.alert('Terms', `Welcome to SoSync! By continuing to use our platform, you agree to abide by our terms and conditions.\n\nPlease read them carefully to understand your rights and responsibilities when using SoSync for your safety.\n\nThank you for being a part of our community! Version 1.0.0`)}
        />
        <SettingCard
          icon="sign-out" title={loading ? 'Logging out...' : 'Logout'}
          desc="Sign out of your account"
          onPress={handleLogout} danger
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.versionText}>SoSync v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  profileSection: {
    alignItems: 'center', paddingVertical: 30, paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: Theme.variants.border, backgroundColor: '#fff',
  },
  avatarWrap: { marginBottom: 20, borderRadius: 60, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5, backgroundColor: '#fff' },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: Theme.variants.primary, backgroundColor: '#fff' },
  avatarPlaceholder: { width: 120, height: 120, borderRadius: 60, backgroundColor: Theme.variants.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: Theme.variants.primary },
  userName: { fontSize: 24, fontWeight: '700', color: Theme.variants.text, marginBottom: 4, fontFamily: Theme.typography.inter.bold, backgroundColor: '#fff' },
  userEmail: { fontSize: 14, color: Theme.variants.textMuted, marginBottom: 6, fontFamily: Theme.typography.inter.regular, backgroundColor: '#fff' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20, backgroundColor: '#fff' },
  phoneText: { fontSize: 13, color: Theme.variants.textMuted, fontFamily: Theme.typography.inter.regular },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: Theme.variants.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  editBtnText: { color: '#fff', fontSize: 14, fontWeight: '600', fontFamily: Theme.typography.inter.semibold },
  settingsSection: { paddingHorizontal: 16, paddingVertical: 24, gap: 12, backgroundColor: '#fff' },
  settingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 16, gap: 12, borderWidth: 1, borderColor: Theme.variants.border },
  dangerCard: { backgroundColor: '#fff5f5', borderColor: '#ffdddd' },
  iconBox: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
  dangerIconBox: { backgroundColor: '#ff4444' },
  cardContent: { flex: 1, backgroundColor: 'transparent' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: Theme.variants.text, marginBottom: 4, fontFamily: Theme.typography.inter.semibold, backgroundColor: 'transparent' },
  dangerText: { color: '#ff4444' },
  cardDesc: { fontSize: 12, color: Theme.variants.textMuted, fontFamily: Theme.typography.inter.regular },
  dangerDesc: { color: '#cc0000' },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'transparent' },
  badge: { backgroundColor: Theme.variants.primary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700', fontFamily: Theme.typography.inter.bold },
  footer: { alignItems: 'center', paddingVertical: 20, borderTopWidth: 1, borderTopColor: Theme.variants.border, backgroundColor: '#fff' },
  versionText: { fontSize: 12, color: Theme.variants.textMuted, fontFamily: Theme.typography.inter.regular, backgroundColor: '#fff' },
});
