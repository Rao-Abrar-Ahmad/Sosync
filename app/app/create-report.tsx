import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { createDisasterReport, DisasterType } from '@/config/dbutils';
import { useUser } from '@/context/UserContext';
import Theme from '@/config/theme';
import Input from '@/components/Input';
import FontAwesome from '@expo/vector-icons/FontAwesome';

const DISASTER_TYPES: DisasterType[] = ['FLOOD', 'EARTHQUAKE', 'FIRE', 'ACCIDENT', 'LANDSLIDE', 'OTHER'];
const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

export default function CreateReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  // Form state
  const [disasterType, setDisasterType] = useState<DisasterType>('OTHER');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [severityModalVisible, setSeverityModalVisible] = useState(false);

  // Fetch current location on mount
  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  // Fetch current location
  const fetchCurrentLocation = async () => {
    try {
      setFetchingLocation(true);
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(location.coords.latitude.toString());
      setLongitude(location.coords.longitude.toString());
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert('Location Error', 'Could not fetch your location. Please enter it manually.');
    } finally {
      setFetchingLocation(false);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!disasterType) {
      Alert.alert('Validation Error', 'Please select a disaster type');
      return false;
    }

    if (!description.trim()) {
      Alert.alert('Validation Error', 'Please describe the disaster');
      return false;
    }

    if (!latitude || !longitude) {
      Alert.alert('Validation Error', 'Please provide latitude and longitude');
      return false;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      Alert.alert('Validation Error', 'Latitude and longitude must be valid numbers');
      return false;
    }

    if (lat < -90 || lat > 90) {
      Alert.alert('Validation Error', 'Latitude must be between -90 and 90');
      return false;
    }

    if (lng < -180 || lng > 180) {
      Alert.alert('Validation Error', 'Longitude must be between -180 and 180');
      return false;
    }

    return true;
  };

  // Submit report
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setLoading(true);

      const reportId = await createDisasterReport({
        user_id: user.uid,
        type: disasterType,
        description: description.trim(),
        status: 'PENDING',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address.trim() || undefined,
        severity_level: severity || undefined,
      });

      Alert.alert('Success', 'Disaster report created successfully!', [
        {
          text: 'View Home',
          onPress: () => router.replace('/(tabs)'),
        },
      ]);
    } catch (error) {
      console.error('Error creating report:', error);
      Alert.alert('Error', 'Failed to create report. Please try again.');
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
          contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <FontAwesome name="arrow-left" size={24} color={Theme.variants.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Create Disaster Report</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Form Title */}
          <Text style={styles.sectionTitle}>Report Details</Text>

          {/* Disaster Type */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Disaster Type *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setTypeModalVisible(true)}
            >
              <Text style={styles.selectButtonText}>{disasterType}</Text>
              <FontAwesome name="chevron-down" size={14} color={Theme.variants.primary} />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={styles.textAreaInput}
              placeholder="Describe the disaster, what you see, people affected, etc."
              placeholderTextColor={Theme.variants.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={5}
              editable={!loading}
            />
          </View>

          {/* Location Section */}
          <Text style={styles.sectionTitle}>Location</Text>

          {/* Latitude & Longitude Row */}
          <View style={styles.rowContainer}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Latitude *</Text>
              <TextInput
                style={styles.input}
                placeholder="-90 to 90"
                placeholderTextColor={Theme.variants.textMuted}
                value={latitude}
                onChangeText={setLatitude}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Longitude *</Text>
              <TextInput
                style={styles.input}
                placeholder="-180 to 180"
                placeholderTextColor={Theme.variants.textMuted}
                value={longitude}
                onChangeText={setLongitude}
                keyboardType="decimal-pad"
                editable={!loading}
              />
            </View>
          </View>

          {/* Get Current Location Button */}
          <TouchableOpacity
            style={[styles.locationButton, fetchingLocation && styles.buttonDisabled]}
            onPress={fetchCurrentLocation}
            disabled={fetchingLocation || loading}
          >
            {fetchingLocation ? (
              <ActivityIndicator color={Theme.variants.primary} />
            ) : (
              <>
                <FontAwesome name="location-arrow" size={16} color={Theme.variants.primary} />
                <Text style={styles.locationButtonText}>Use Current Location</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Address */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Address (Optional)</Text>
            <Input
              placeholder="Enter address or location name"
              value={address}
              onChangeText={setAddress}
              editable={!loading}
            />
          </View>

          {/* Severity Level */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Severity Level</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setSeverityModalVisible(true)}
            >
              <Text style={styles.selectButtonText}>{severity}</Text>
              <FontAwesome name="chevron-down" size={14} color={Theme.variants.primary} />
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <FontAwesome name="send" size={16} color="#fff" />
                <Text style={styles.submitButtonText}>Submit Report</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.requiredNote}>* Required fields</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Disaster Type Modal */}
      <Modal
        visible={typeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTypeModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Disaster Type</Text>
              <TouchableOpacity onPress={() => setTypeModalVisible(false)}>
                <FontAwesome name="close" size={20} color={Theme.variants.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={DISASTER_TYPES}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setDisasterType(item);
                    setTypeModalVisible(false);
                  }}
                >
                  <View style={styles.modalItemContent}>
                    <FontAwesome
                      name={
                        item === 'FLOOD'
                          ? 'tint'
                          : item === 'EARTHQUAKE'
                          ? 'bolt'
                          : item === 'FIRE'
                          ? 'fire'
                          : item === 'ACCIDENT'
                          ? 'car'
                          : item === 'LANDSLIDE'
                          ? 'exclamation'
                          : 'question-circle'
                      }
                      size={18}
                      color={Theme.variants.primary}
                    />
                    <Text style={styles.modalItemText}>{item}</Text>
                  </View>
                  {disasterType === item && (
                    <FontAwesome name="check" size={18} color={Theme.variants.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Severity Level Modal */}
      <Modal
        visible={severityModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSeverityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Severity Level</Text>
              <TouchableOpacity onPress={() => setSeverityModalVisible(false)}>
                <FontAwesome name="close" size={20} color={Theme.variants.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={SEVERITY_LEVELS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.modalItem}
                  onPress={() => {
                    setSeverity(item);
                    setSeverityModalVisible(false);
                  }}
                >
                  <View style={styles.modalItemContent}>
                    <View
                      style={[
                        styles.severityIndicator,
                        {
                          backgroundColor:
                            item === 'Low'
                              ? '#4CAF50'
                              : item === 'Medium'
                              ? '#FF9800'
                              : item === 'High'
                              ? '#F44336'
                              : '#8B0000',
                        },
                      ]}
                    />
                    <Text style={styles.modalItemText}>{item}</Text>
                  </View>
                  {severity === item && (
                    <FontAwesome name="check" size={18} color={Theme.variants.primary} />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  headerTitle: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 18,
    fontWeight: '600',
    color: Theme.variants.text,
  },
  sectionTitle: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 14,
    fontWeight: '600',
    color: Theme.variants.text,
    marginBottom: 16,
    marginTop: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontFamily: Theme.typography.inter.medium,
    fontSize: 14,
    fontWeight: '600',
    color: Theme.variants.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: Theme.variants.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: Theme.typography.inter.regular,
    fontSize: 14,
    color: Theme.variants.text,
  },
  textAreaInput: {
    borderWidth: 1,
    borderColor: Theme.variants.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: Theme.typography.inter.regular,
    fontSize: 14,
    color: Theme.variants.text,
    textAlignVertical: 'top',
  },
  selectButton: {
    borderWidth: 1,
    borderColor: Theme.variants.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectButtonText: {
    fontFamily: Theme.typography.inter.medium,
    fontSize: 14,
    color: Theme.variants.text,
  },
  rowContainer: {
    flexDirection: 'row',
  },
  locationButton: {
    borderWidth: 1.5,
    borderColor: Theme.variants.primary,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  locationButtonText: {
    fontFamily: Theme.typography.inter.semibold,
    fontSize: 14,
    fontWeight: '600',
    color: Theme.variants.primary,
  },
  submitButton: {
    backgroundColor: Theme.variants.primary,
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  submitButtonText: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  requiredNote: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 12,
    color: Theme.variants.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 0,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.variants.border,
  },
  modalTitle: {
    fontFamily: Theme.typography.inter.bold,
    fontSize: 16,
    fontWeight: '600',
    color: Theme.variants.text,
  },
  modalItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalItemText: {
    fontFamily: Theme.typography.inter.medium,
    fontSize: 14,
    color: Theme.variants.text,
  },
  severityIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
});
