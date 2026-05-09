import React, { useState, useEffect, useCallback } from 'react';
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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { createDisasterReport, DisasterType } from '@/config/dbutils';
import { uploadMedia } from '@/config/storage';
import { useUser } from '@/context/UserContext';
import Theme from '@/config/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DISASTER_TYPES } from '@/constants/utils';


const SEVERITY_LEVELS = ['Low', 'Medium', 'High', 'Critical'];

// Default location (Pakistan center)
const DEFAULT_COORDS = { latitude: 30.3753, longitude: 69.3451 };

export default function CreateReportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useUser();

  // Form state
  const [disasterType, setDisasterType] = useState<DisasterType>('OTHER');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [severity, setSeverity] = useState('Medium');

  // Location state (numeric, not strings)
  const [markerCoords, setMarkerCoords] = useState(DEFAULT_COORDS);
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Media state
  const [mediaItems, setMediaItems] = useState<ImagePicker.ImagePickerAsset[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(true);
  const [reverseGeoLoading, setReverseGeoLoading] = useState(false);
  const [typeModalVisible, setTypeModalVisible] = useState(false);
  const [severityModalVisible, setSeverityModalVisible] = useState(false);

  // Fetch current GPS location on mount
  useEffect(() => {
    fetchCurrentLocation();
  }, []);

  // Reverse geocode whenever marker moves
  useEffect(() => {
    reverseGeocode(markerCoords.latitude, markerCoords.longitude);
  }, [markerCoords]);

  // Fetch current GPS location
  const fetchCurrentLocation = async () => {
    try {
      setFetchingLocation(true);

      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services to auto-detect your location.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Location.enableNetworkProviderAsync() },
          ]
        );
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Location permission is required. You can still tap on the map to set the location.',
          [{ text: 'OK' }]
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setGpsCoords(coords);
      setMarkerCoords(coords);
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert('Location Error', 'Could not fetch your location. Tap on the map to set it manually.');
    } finally {
      setFetchingLocation(false);
    }
  };

  // Media handlers
  const pickMedia = async () => {
    if (mediaItems.length >= 3) {
      Alert.alert('Limit Reached', 'You can attach up to 3 items maximum.');
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Allow photo library access to attach media.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 0.7,
      allowsMultipleSelection: true,
      selectionLimit: 3 - mediaItems.length,
    });
    if (!result.canceled && result.assets) {
      setMediaItems(prev => [...prev, ...result.assets].slice(0, 3));
    }
  };

  const takeMedia = async () => {
    if (mediaItems.length >= 3) {
      Alert.alert('Limit Reached', 'You can attach up to 3 items maximum.');
      return;
    }
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission Required', 'Allow camera access to capture media.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images', 'videos'],
      allowsEditing: false,
      quality: 0.7,
    });
    if (!result.canceled && result.assets) {
      setMediaItems(prev => [...prev, ...result.assets].slice(0, 3));
    }
  };

  const removeMedia = (index: number) => {
    setMediaItems(prev => prev.filter((_, i) => i !== index));
  };

  // Reverse geocode coordinates to address
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    try {
      setReverseGeoLoading(true);
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });

      if (results && results.length > 0) {
        const place = results[0];
        const parts = [
          place.name,
          place.street,
          place.district,
          place.city,
          place.region,
          place.country,
        ].filter(Boolean);

        // Remove duplicates while preserving order
        const unique = [...new Set(parts)];
        setAddress(unique.join(', '));
      } else {
        setAddress('');
      }
    } catch (error) {
      console.error('Reverse geocode error:', error);
      // Don't overwrite existing address on error
    } finally {
      setReverseGeoLoading(false);
    }
  }, []);

  // Handle map tap — move marker to tapped location
  const handleMapClick = (event: any) => {
    if (event.nativeEvent && event.nativeEvent.coordinate) {
      setMarkerCoords({
        latitude: event.nativeEvent.coordinate.latitude,
        longitude: event.nativeEvent.coordinate.longitude,
      });
    }
  };

  // Re-center map to GPS location
  const handleRecenterGPS = () => {
    if (gpsCoords) {
      setMarkerCoords(gpsCoords);
    } else {
      fetchCurrentLocation();
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

    if (!markerCoords.latitude || !markerCoords.longitude) {
      Alert.alert('Validation Error', 'Please set a location on the map');
      return false;
    }

    return true;
  };

  // Submit report
  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setLoading(true);

      const uploadedMedia: any[] = [];
      
      // Upload media if present
      for (const item of mediaItems) {
        const fileName = item.uri.substring(item.uri.lastIndexOf('/') + 1);
        const path = `reports/${user.uid}/${Date.now()}_${fileName}`;
        const url = await uploadMedia(item.uri, path);
        uploadedMedia.push({
          type: item.type === 'video' ? 'video' : 'image',
          url,
          file_name: fileName,
          uploaded_at: new Date(),
        });
      }

      await createDisasterReport({
        user_id: user.uid,
        type: disasterType,
        description: description.trim(),
        status: 'PENDING',
        latitude: markerCoords.latitude,
        longitude: markerCoords.longitude,
        address: address.trim() || '',
        severity_level: severity || '',
        media: uploadedMedia,
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

  // Region for MapView
  const mapRegion = {
    latitude: markerCoords.latitude,
    longitude: markerCoords.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled
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

          {/* Disaster Type + Severity in one row */}
          <View style={styles.rowContainer}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>Disaster Type *</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setTypeModalVisible(true)}
              >
                <Text style={styles.selectButtonText} numberOfLines={1}>{disasterType}</Text>
                <FontAwesome name="chevron-down" size={12} color={Theme.variants.primary} />
              </TouchableOpacity>
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Severity</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setSeverityModalVisible(true)}
              >
                <Text style={styles.selectButtonText} numberOfLines={1}>{severity}</Text>
                <FontAwesome name="chevron-down" size={12} color={Theme.variants.primary} />
              </TouchableOpacity>
            </View>
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
              numberOfLines={4}
              editable={!loading}
            />
          </View>

          {/* Media Attachments */}
          <Text style={styles.sectionTitle}>Attachments (Max 3)</Text>
          <View style={styles.mediaContainer}>
            <TouchableOpacity style={styles.mediaButton} onPress={pickMedia} disabled={loading}>
              <FontAwesome name="image" size={16} color={Theme.variants.primary} />
              <Text style={styles.mediaButtonText}>Gallery</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.mediaButton} onPress={takeMedia} disabled={loading}>
              <FontAwesome name="camera" size={16} color={Theme.variants.primary} />
              <Text style={styles.mediaButtonText}>Camera</Text>
            </TouchableOpacity>
          </View>

          {mediaItems.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaScroll}>
              {mediaItems.map((item, index) => (
                <View key={index} style={styles.mediaThumbnailContainer}>
                  <Image source={{ uri: item.uri }} style={styles.mediaThumbnail} />
                  {item.type === 'video' && (
                    <View style={styles.videoIndicator}>
                      <FontAwesome name="video-camera" size={12} color="#fff" />
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.mediaRemoveButton}
                    onPress={() => removeMedia(index)}
                    disabled={loading}
                  >
                    <FontAwesome name="close" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Location Section */}
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.locationHint}>
            Tap anywhere on the map to set the disaster location
          </Text>

          {/* Interactive Map */}
          <View style={styles.mapContainer}>
            {fetchingLocation ? (
              <View style={styles.mapLoadingOverlay}>
                <ActivityIndicator size="large" color={Theme.variants.primary} />
                <Text style={styles.mapLoadingText}>Detecting your location...</Text>
              </View>
            ) : (
              <MapView
                style={styles.map}
                region={mapRegion}
                onPress={handleMapClick}
                showsUserLocation={false}
                zoomEnabled={true}
              >
                <Marker
                  coordinate={markerCoords}
                  title="Report Location"
                  description={address || 'Tap the map to change location'}
                />
              </MapView>
            )}

            {/* Re-center GPS button (floating on map) */}
            {!fetchingLocation && (
              <TouchableOpacity
                style={styles.recenterButton}
                onPress={handleRecenterGPS}
                activeOpacity={0.8}
              >
                <FontAwesome name="crosshairs" size={18} color={Theme.variants.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Coordinates display */}
          <View style={styles.coordsRow}>
            <View style={styles.coordChip}>
              <Text style={styles.coordLabel}>Lat</Text>
              <Text style={styles.coordValue}>{markerCoords.latitude.toFixed(5)}</Text>
            </View>
            <View style={styles.coordChip}>
              <Text style={styles.coordLabel}>Lng</Text>
              <Text style={styles.coordValue}>{markerCoords.longitude.toFixed(5)}</Text>
            </View>
          </View>

          {/* Address (auto-filled from reverse geocode) */}
          <View style={styles.formGroup}>
            <View style={styles.addressLabelRow}>
              <Text style={styles.label}>Address</Text>
              {reverseGeoLoading && (
                <ActivityIndicator size="small" color={Theme.variants.primary} style={{ marginLeft: 8 }} />
              )}
            </View>
            <TextInput
              style={styles.input}
              placeholder="Address will be auto-detected..."
              placeholderTextColor={Theme.variants.textMuted}
              value={address}
              onChangeText={setAddress}
              editable={!loading}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <ActivityIndicator color="#fff" />
                <Text style={styles.submitButtonText}>{mediaItems.length > 0 ? 'Uploading...' : 'Submitting...'}</Text>
              </>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    marginBottom: 24,
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
    marginBottom: 12,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontFamily: Theme.typography.inter.medium,
    fontSize: 13,
    fontWeight: '600',
    color: Theme.variants.text,
    marginBottom: 6,
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
    minHeight: 100,
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
    fontSize: 13,
    color: Theme.variants.text,
    flex: 1,
  },
  rowContainer: {
    flexDirection: 'row',
  },
  locationHint: {
    fontFamily: Theme.typography.inter.regular,
    fontSize: 12,
    color: Theme.variants.textMuted,
    marginBottom: 10,
    fontStyle: 'italic',
  },

  // Media styles
  mediaContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: Theme.variants.primary,
    borderRadius: 10,
    borderStyle: 'dashed',
    gap: 8,
  },
  mediaButtonText: {
    fontFamily: Theme.typography.inter.medium,
    fontSize: 13,
    color: Theme.variants.primary,
  },
  mediaScroll: {
    marginBottom: 16,
  },
  mediaThumbnailContainer: {
    position: 'relative',
    marginRight: 12,
  },
  mediaThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  mediaRemoveButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fff',
  },
  videoIndicator: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 4,
    padding: 2,
  },

  // Map styles
  mapContainer: {
    height: 260,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Theme.variants.border,
    marginBottom: 12,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  mapLoadingOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  mapLoadingText: {
    marginTop: 10,
    fontFamily: Theme.typography.inter.regular,
    fontSize: 13,
    color: Theme.variants.textMuted,
  },
  recenterButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },

  // Coordinates display
  coordsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  coordChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  coordLabel: {
    fontFamily: Theme.typography.inter.semibold,
    fontSize: 11,
    color: Theme.variants.primary,
    textTransform: 'uppercase',
    marginRight: 8,
  },
  coordValue: {
    fontFamily: Theme.typography.inter.medium,
    fontSize: 13,
    color: Theme.variants.text,
  },

  // Address label row
  addressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  // Submit
  submitButton: {
    backgroundColor: Theme.variants.primary,
    paddingVertical: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
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

  // Modals
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
