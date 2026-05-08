import React, { useState } from 'react';
import {
  StyleSheet, ScrollView, Alert, TouchableOpacity, Image,
  TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Text, View } from '@/components/Themed';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import * as ImagePicker from 'expo-image-picker';
import Theme from '@/config/theme';
import { useUser } from '@/context/UserContext';
import { updateUserProfile, isValidPhoneNumber } from '@/config/dbutils';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebaseConfig';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useUser();
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || '');
  const [profileImage, setProfileImage] = useState<string | null>(
    user?.profile_picture || user?.photoURL || null
  );
  const [newImageUri, setNewImageUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<{ firstName?: string; lastName?: string; phone?: string }>({});

  const validate = (): boolean => {
    const e: typeof errors = {};
    if (!firstName.trim()) e.firstName = 'First name is required';
    if (!lastName.trim()) e.lastName = 'Last name is required';
    if (phoneNumber.trim() && !isValidPhoneNumber(phoneNumber))
      e.phone = 'Enter a valid phone number (min 10 digits)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickImage = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission Required', 'Allow photo library access.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setNewImageUri(result.assets[0].uri);
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!validate() || !user?.uid) return;
    setSaving(true);
    try {
      const updates: any = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone_number: phoneNumber.trim(),
      };

      console.log('[EditProfile] Starting save for user:', user.uid);
      console.log('[EditProfile] Updates:', JSON.stringify(updates));

      // Handle image upload
      if (newImageUri) {
        console.log('[EditProfile] New image selected, starting upload...');
        console.log('[EditProfile] Image URI:', newImageUri);
        try {
          // Step 1: Fetch the image as blob
          console.log('[EditProfile] Step 1: Fetching image blob...');
          const resp = await fetch(newImageUri);
          if (!resp.ok) {
            throw new Error(`Failed to fetch image: ${resp.status} ${resp.statusText}`);
          }
          const blob = await resp.blob();
          console.log('[EditProfile] Blob created, size:', blob.size, 'type:', blob.type);

          // Step 2: Upload to Firebase Storage
          const fileName = `profile_pictures/${user.uid}_${Date.now()}.jpg`;
          console.log('[EditProfile] Step 2: Uploading to:', fileName);
          const storageRef = ref(storage, fileName);
          const uploadResult = await uploadBytes(storageRef, blob);
          console.log('[EditProfile] Upload complete, path:', uploadResult.metadata.fullPath);

          // Step 3: Get download URL
          console.log('[EditProfile] Step 3: Getting download URL...');
          const downloadUrl = await getDownloadURL(storageRef);
          console.log('[EditProfile] Download URL:', downloadUrl);

          updates.profile_picture = downloadUrl;
        } catch (imgError: any) {
          console.error('[EditProfile] Image upload FAILED:', imgError);
          console.error('[EditProfile] Error name:', imgError?.name);
          console.error('[EditProfile] Error message:', imgError?.message);
          console.error('[EditProfile] Error code:', imgError?.code);
          Alert.alert(
            'Photo Upload Failed',
            `Could not upload profile picture: ${imgError?.message || 'Unknown error'}. Other profile changes will still be saved.`
          );
        }
      }

      // Save to Firestore
      console.log('[EditProfile] Saving to Firestore:', JSON.stringify(updates));
      await updateUserProfile(user.uid, updates);
      console.log('[EditProfile] Firestore update successful!');

      // Update local UserContext with all changes
      const contextUpdate: any = {
        first_name: updates.first_name,
        last_name: updates.last_name,
        phone_number: updates.phone_number,
        displayName: `${updates.first_name} ${updates.last_name}`,
      };
      if (updates.profile_picture) {
        contextUpdate.profile_picture = updates.profile_picture;
        contextUpdate.photoURL = updates.profile_picture;
      }
      console.log('[EditProfile] Updating UserContext:', JSON.stringify(contextUpdate));
      updateUser(contextUpdate);

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      console.error('[EditProfile] Save FAILED:', error);
      console.error('[EditProfile] Error details:', error?.message, error?.code);
      Alert.alert('Error', `Failed to save profile: ${error?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (
    label: string, value: string, onChange: (t: string) => void,
    icon: string, placeholder: string, error?: string,
    opts?: { keyboard?: any; editable?: boolean; helper?: string }
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, error && styles.inputErr, opts?.editable === false && styles.inputOff]}>
        <FontAwesome name={icon as any} size={15} color={Theme.variants.textMuted} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, opts?.editable === false && { color: Theme.variants.textMuted }]}
          value={value} onChangeText={onChange} placeholder={placeholder}
          placeholderTextColor={Theme.variants.textMuted} keyboardType={opts?.keyboard}
          editable={opts?.editable} autoCapitalize="words"
        />
      </View>
      {error && <Text style={styles.errTxt}>{error}</Text>}
      {opts?.helper && <Text style={styles.helpTxt}>{opts.helper}</Text>}
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <FontAwesome name="arrow-left" size={20} color={Theme.variants.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={{ width: 40, backgroundColor: '#fff' }} />
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.7}>
            <View style={styles.avatarWrap}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <FontAwesome name="user" size={50} color="#fff" />
                </View>
              )}
              <View style={styles.camIcon}>
                <FontAwesome name="camera" size={14} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.tapText}>Tap to change photo</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {renderInput('First Name', firstName, (t) => { setFirstName(t); setErrors(p => ({ ...p, firstName: undefined })); },
            'user', 'Enter first name', errors.firstName)}
          {renderInput('Last Name', lastName, (t) => { setLastName(t); setErrors(p => ({ ...p, lastName: undefined })); },
            'user', 'Enter last name', errors.lastName)}
          {renderInput('Phone Number', phoneNumber, (t) => { setPhoneNumber(t); setErrors(p => ({ ...p, phone: undefined })); },
            'phone', '+92 300 1234567', errors.phone, { keyboard: 'phone-pad' })}
          {renderInput('Email', user?.email || '', () => {}, 'envelope', '',
            undefined, { editable: false, helper: 'Email cannot be changed' })}
        </View>

        {/* Buttons */}
        <View style={styles.btnSection}>
          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]}
            onPress={handleSave} disabled={saving} activeOpacity={0.8}>
            {saving ? <ActivityIndicator size="small" color="#fff" /> : (
              <><FontAwesome name="check" size={16} color="#fff" /><Text style={styles.saveTxt}>Save Changes</Text></>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} disabled={saving}>
            <Text style={styles.cancelTxt}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: Theme.variants.border, backgroundColor: '#fff' },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f5f5f5', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Theme.variants.text, fontFamily: Theme.typography.inter.bold, backgroundColor: '#fff' },
  avatarSection: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#fff' },
  avatarWrap: { position: 'relative', marginBottom: 8 },
  avatar: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: Theme.variants.primary },
  avatarPlaceholder: { width: 110, height: 110, borderRadius: 55, backgroundColor: Theme.variants.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: Theme.variants.primary },
  camIcon: { position: 'absolute', bottom: 4, right: 4, width: 32, height: 32, borderRadius: 16, backgroundColor: Theme.variants.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  tapText: { fontSize: 13, color: Theme.variants.primary, fontFamily: Theme.typography.inter.medium, backgroundColor: '#fff' },
  form: { paddingHorizontal: 20, gap: 18, backgroundColor: '#fff' },
  field: { backgroundColor: '#fff' },
  label: { fontSize: 14, fontWeight: '600', color: Theme.variants.text, marginBottom: 8, fontFamily: Theme.typography.inter.semibold, backgroundColor: '#fff' },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9f9f9', borderRadius: 12, borderWidth: 1.5, borderColor: Theme.variants.border, paddingHorizontal: 14, height: 50 },
  inputErr: { borderColor: '#ff4444', backgroundColor: '#fff5f5' },
  inputOff: { backgroundColor: '#f0f0f0', opacity: 0.7 },
  inputIcon: { marginRight: 10, width: 20, textAlign: 'center' },
  input: { flex: 1, fontSize: 15, color: Theme.variants.text, fontFamily: Theme.typography.inter.regular },
  errTxt: { fontSize: 12, color: '#ff4444', marginTop: 4, fontFamily: Theme.typography.inter.regular, backgroundColor: '#fff' },
  helpTxt: { fontSize: 11, color: Theme.variants.textMuted, marginTop: 4, fontFamily: Theme.typography.inter.regular, backgroundColor: '#fff' },
  btnSection: { paddingHorizontal: 20, paddingVertical: 30, gap: 12, backgroundColor: '#fff' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.variants.primary, paddingVertical: 15, borderRadius: 12, gap: 8, shadowColor: Theme.variants.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  saveTxt: { color: '#fff', fontSize: 16, fontWeight: '600', fontFamily: Theme.typography.inter.semibold },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelTxt: { color: Theme.variants.textMuted, fontSize: 14, fontFamily: Theme.typography.inter.medium },
});
