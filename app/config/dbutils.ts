import { doc, setDoc, updateDoc, getDoc, deleteDoc, serverTimestamp, Timestamp, collection, query, getDocs, orderBy, where } from 'firebase/firestore';
import { db } from '@/config/firebaseConfig';


export const generateUniqueId = (): string => {
  // Generate a unique ID using current timestamp and a-z, 1-9 characters
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface UserDocument {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  profile_picture: string;
  role: 'USER' | 'ADMIN' | 'RESPONDER';
  is_active: boolean;
  onboarding_completed: boolean;
  auth_provider: 'email' | 'google' | 'phone';
  location_permission_granted?: boolean;
  last_known_location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  location_permission_granted_at?: Timestamp | Date;
  created_at: Timestamp | Date;
  updated_at: Timestamp | Date;
}

export type UserDocumentInput = Omit<UserDocument, 'created_at' | 'updated_at'>;

// ============================================================================
// USER CREATION & MANAGEMENT
// ============================================================================

/**
 * Create a new user document in Firestore
 * @param userId - Firebase user ID (uid)
 * @param userData - User information to store
 * @returns Promise that resolves when document is created
 */
export async function createUserDocument(
  userId: string,
  userData: UserDocumentInput
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    
    await setDoc(userDocRef, {
      ...userData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
}

/**
 * Get user document from Firestore
 * @param userId - Firebase user ID (uid)
 * @returns User document data or null if not found
 */
export async function getUserDocument(userId: string): Promise<UserDocument | null> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    
    if (userDocSnap.exists()) {
      return userDocSnap.data() as UserDocument;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user document:', error);
    throw error;
  }
}

/**
 * Check if user document exists in Firestore
 * @param userId - Firebase user ID (uid)
 * @returns Boolean indicating if user exists
 */
export async function userDocumentExists(userId: string): Promise<boolean> {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDocSnap = await getDoc(userDocRef);
    return userDocSnap.exists();
  } catch (error) {
    console.error('Error checking if user exists:', error);
    throw error;
  }
}

// ============================================================================
// USER PROFILE UPDATES
// ============================================================================

/**
 * Update user profile information
 * @param userId - Firebase user ID (uid)
 * @param updates - Partial user data to update
 * @returns Promise that resolves when document is updated
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<UserDocument, 'id' | 'created_at'>>
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    
    await updateDoc(userDocRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Update user's profile picture
 * @param userId - Firebase user ID (uid)
 * @param profilePictureUrl - URL of the new profile picture
 * @returns Promise that resolves when document is updated
 */
export async function updateUserProfilePicture(
  userId: string,
  profilePictureUrl: string
): Promise<void> {
  return updateUserProfile(userId, {
    profile_picture: profilePictureUrl,
  });
}

/**
 * Update user's phone number
 * @param userId - Firebase user ID (uid)
 * @param phoneNumber - New phone number
 * @returns Promise that resolves when document is updated
 */
export async function updateUserPhoneNumber(
  userId: string,
  phoneNumber: string
): Promise<void> {
  return updateUserProfile(userId, {
    phone_number: phoneNumber,
  });
}

// ============================================================================
// LOCATION MANAGEMENT
// ============================================================================

/**
 * Update user's location information
 * @param userId - Firebase user ID (uid)
 * @param latitude - Latitude coordinate
 * @param longitude - Longitude coordinate
 * @param accuracy - Location accuracy in meters
 * @returns Promise that resolves when document is updated
 */
export async function updateUserLocation(
  userId: string,
  latitude: number,
  longitude: number,
  accuracy: number | null
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    
    await updateDoc(userDocRef, {
      location_permission_granted: true,
      onboarding_completed:true,
      last_known_location: {
        latitude,
        longitude,
        accuracy,
      },
      location_permission_granted_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user location:', error);
    throw error;
  }
}

/**
 * Update location permission status without coordinates
 * @param userId - Firebase user ID (uid)
 * @param granted - Whether location permission is granted
 * @returns Promise that resolves when document is updated
 */
export async function updateLocationPermissionStatus(
  userId: string,
  granted: boolean
): Promise<void> {
  try {
    const userDocRef = doc(db, 'users', userId);
    
    const updateData: any = {
      location_permission_granted: granted,
      updated_at: serverTimestamp(),
    };

    if (granted) {
      updateData.location_permission_granted_at = serverTimestamp();
    }

    await updateDoc(userDocRef, updateData);
  } catch (error) {
    console.error('Error updating location permission status:', error);
    throw error;
  }
}

// ============================================================================
// ACCOUNT STATUS MANAGEMENT
// ============================================================================

/**
 * Deactivate user account
 * @param userId - Firebase user ID (uid)
 * @returns Promise that resolves when document is updated
 */
export async function deactivateUserAccount(userId: string): Promise<void> {
  return updateUserProfile(userId, {
    is_active: false,
  });
}

/**
 * Activate user account
 * @param userId - Firebase user ID (uid)
 * @returns Promise that resolves when document is updated
 */
export async function activateUserAccount(userId: string): Promise<void> {
  return updateUserProfile(userId, {
    is_active: true,
  });
}

// ============================================================================
// DISASTER REPORT MANAGEMENT
// ============================================================================

export type DisasterType = 'FLOOD' | 'EARTHQUAKE' | 'FIRE' | 'ACCIDENT' | 'LANDSLIDE' | 'OTHER';
export type ReportStatus = 'PENDING' | 'VERIFIED' | 'RESOLVED' | 'FALSE_ALARM';

export interface ReportMediaItem {
  type: 'image' | 'video';
  url: string;
  file_name: string;
  uploaded_at: Timestamp | Date;
}

export interface DisasterReportDocument {
  id: string;
  user_id: string;
  type: DisasterType;
  description: string;
  status: ReportStatus;
  latitude: number;
  longitude: number;
  address?: string;
  severity_level?: string;
  media?: ReportMediaItem[];
  created_at: Timestamp | Date;
  updated_at?: Timestamp | Date;
}

export type DisasterReportInput = Omit<DisasterReportDocument, 'id' | 'created_at' | 'updated_at'>;

/**
 * Create a new disaster report
 * @param reportData - Disaster report information
 * @returns Promise with the created report ID
 */
export async function createDisasterReport(
  reportData: DisasterReportInput
): Promise<string> {
  try {
    const reportId = generateUniqueId();
    const newReportRef = doc(db, 'disaster_reports', reportId);
    
    await setDoc(newReportRef, {
      id: reportId,
      ...reportData,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    return reportId;
  } catch (error) {
    console.error('Error creating disaster report:', error);
    throw error;
  }
}

/**
 * Get a specific disaster report
 * @param reportId - Disaster report ID
 * @returns Disaster report document or null if not found
 */
export async function getDisasterReport(reportId: string): Promise<DisasterReportDocument | null> {
  try {
    const reportDocRef = doc(db, 'disaster_reports', reportId);
    const reportDocSnap = await getDoc(reportDocRef);

    if (reportDocSnap.exists()) {
      return reportDocSnap.data() as DisasterReportDocument;
    }
    return null;
  } catch (error) {
    console.error('Error fetching disaster report:', error);
    throw error;
  }
}

/**
 * Update a disaster report
 * @param reportId - Disaster report ID
 * @param updates - Partial report data to update
 * @returns Promise that resolves when document is updated
 */
export async function updateDisasterReport(
  reportId: string,
  updates: Partial<Omit<DisasterReportDocument, 'id' | 'user_id' | 'created_at'>>
): Promise<void> {
  try {
    const reportDocRef = doc(db, 'disaster_reports', reportId);

    await updateDoc(reportDocRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating disaster report:', error);
    throw error;
  }
}

/**
 * Update disaster report status
 * @param reportId - Disaster report ID
 * @param status - New status
 * @returns Promise that resolves when document is updated
 */
export async function updateReportStatus(
  reportId: string,
  status: ReportStatus
): Promise<void> {
  return updateDisasterReport(reportId, { status });
}

/**
 * Fetch all disaster reports ordered by most recent first
 * @returns Array of disaster reports
 */
export async function getAllDisasterReports(): Promise<DisasterReportDocument[]> {
  try {
    const reportsCollectionRef = collection(db, 'disaster_reports');
    const q = query(reportsCollectionRef, orderBy('created_at', 'desc'));
    const querySnapshot = await getDocs(q);
    console.log('Fetched disaster reports:', querySnapshot.size);
    const reports: DisasterReportDocument[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      reports.push({
        ...data,
        created_at: data.created_at?.toDate?.() || new Date(),
        updated_at: data.updated_at?.toDate?.() || undefined,
      } as DisasterReportDocument);
    });

    return reports;
  } catch (error) {
    console.error('Error fetching disaster reports:', error);
    throw error;
  }
}

// ============================================================================
// PHONE NUMBER VALIDATION
// ============================================================================

/**
 * Validate phone number format
 * Accepts formats: +1234567890, 1234567890, 123-456-7890, (123) 456-7890
 * Minimum 10 digits required
 * @param phoneNumber - Phone number to validate
 * @returns Boolean indicating if phone number is valid
 */
export function isValidPhoneNumber(phoneNumber: string): boolean {
  // Remove all non-digit characters except +
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  // Must have at least 10 digits (with or without country code)
  const digitCount = cleaned.replace(/\+/g, '').length;
  return digitCount >= 10 && digitCount <= 15;
}

/**
 * Format phone number for storage (strip non-digit chars, keep +)
 * @param phoneNumber - Raw phone number input
 * @returns Cleaned phone number
 */
export function formatPhoneNumber(phoneNumber: string): string {
  return phoneNumber.replace(/[^\d+]/g, '');
}

// ============================================================================
// EMERGENCY CONTACTS MANAGEMENT
// ============================================================================

export interface EmergencyContactDocument {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone_number: string;
  is_active: boolean;
  created_at: Timestamp | Date;
}

export type EmergencyContactInput = Omit<EmergencyContactDocument, 'id' | 'created_at'>;

/**
 * Add a new emergency contact for a user
 * @param contactData - Emergency contact information
 * @returns Promise with the created contact ID
 */
export async function addEmergencyContact(
  contactData: EmergencyContactInput
): Promise<string> {
  try {
    const contactId = generateUniqueId();
    const contactRef = doc(db, 'emergency_contacts', contactId);

    await setDoc(contactRef, {
      id: contactId,
      ...contactData,
      phone_number: formatPhoneNumber(contactData.phone_number),
      created_at: serverTimestamp(),
    });

    return contactId;
  } catch (error) {
    console.error('Error adding emergency contact:', error);
    throw error;
  }
}

/**
 * Get all emergency contacts for a user
 * @param userId - Firebase user ID
 * @returns Array of emergency contacts
 */
export async function getEmergencyContacts(userId: string): Promise<EmergencyContactDocument[]> {
  try {
    const contactsRef = collection(db, 'emergency_contacts');
    const q = query(
      contactsRef,
      where('user_id', '==', userId)
    );
    const querySnapshot = await getDocs(q);

    const contacts: EmergencyContactDocument[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      contacts.push({
        ...data,
        created_at: data.created_at?.toDate?.() || new Date(),
      } as EmergencyContactDocument);
    });

    // Sort client-side (newest first) to avoid composite index requirement
    contacts.sort((a, b) => {
      const dateA = a.created_at instanceof Date ? a.created_at.getTime() : 0;
      const dateB = b.created_at instanceof Date ? b.created_at.getTime() : 0;
      return dateB - dateA;
    });

    return contacts;
  } catch (error) {
    console.error('Error fetching emergency contacts:', error);
    throw error;
  }
}

/**
 * Update an emergency contact
 * @param contactId - Emergency contact ID
 * @param updates - Partial contact data to update
 * @returns Promise that resolves when document is updated
 */
export async function updateEmergencyContact(
  contactId: string,
  updates: Partial<Omit<EmergencyContactDocument, 'id' | 'user_id' | 'created_at'>>
): Promise<void> {
  try {
    const contactRef = doc(db, 'emergency_contacts', contactId);
    const updateData: any = { ...updates };

    if (updates.phone_number) {
      updateData.phone_number = formatPhoneNumber(updates.phone_number);
    }

    await updateDoc(contactRef, updateData);
  } catch (error) {
    console.error('Error updating emergency contact:', error);
    throw error;
  }
}

/**
 * Delete an emergency contact
 * @param contactId - Emergency contact ID
 * @returns Promise that resolves when document is deleted
 */
export async function deleteEmergencyContact(contactId: string): Promise<void> {
  try {
    const contactRef = doc(db, 'emergency_contacts', contactId);
    await deleteDoc(contactRef);
  } catch (error) {
    console.error('Error deleting emergency contact:', error);
    throw error;
  }
}

// ============================================================================
// SOS ALERTS MANAGEMENT
// ============================================================================

export type SOSStatus = 'ACTIVE' | 'RESOLVED';

export interface SOSAlertDocument {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  status: SOSStatus;
  created_at: Timestamp | Date;
}

/**
 * Create a new SOS alert
 * @param userId - Firebase user ID
 * @param latitude - Current latitude
 * @param longitude - Current longitude
 * @returns Promise with the created SOS alert ID
 */
export async function createSOSAlert(
  userId: string,
  latitude: number,
  longitude: number
): Promise<string> {
  try {
    const alertId = generateUniqueId();
    const alertRef = doc(db, 'sos_alerts', alertId);

    await setDoc(alertRef, {
      id: alertId,
      user_id: userId,
      latitude,
      longitude,
      status: 'ACTIVE',
      created_at: serverTimestamp(),
    });

    return alertId;
  } catch (error) {
    console.error('Error creating SOS alert:', error);
    throw error;
  }
}

/**
 * Update the live location of an active SOS alert
 * @param alertId - SOS alert ID
 * @param latitude - Updated latitude
 * @param longitude - Updated longitude
 * @returns Promise that resolves when document is updated
 */
export async function updateSOSLocation(
  alertId: string,
  latitude: number,
  longitude: number
): Promise<void> {
  try {
    const alertRef = doc(db, 'sos_alerts', alertId);
    await updateDoc(alertRef, {
      latitude,
      longitude,
    });
  } catch (error) {
    console.error('Error updating SOS location:', error);
    throw error;
  }
}

/**
 * Deactivate an SOS alert
 * @param alertId - SOS alert ID
 * @returns Promise that resolves when document is updated
 */
export async function deactivateSOSAlert(alertId: string): Promise<void> {
  try {
    const alertRef = doc(db, 'sos_alerts', alertId);
    await updateDoc(alertRef, {
      status: 'RESOLVED',
    });
  } catch (error) {
    console.error('Error deactivating SOS alert:', error);
    throw error;
  }
}

/**
 * Get the active SOS alert for a user (if any)
 * @param userId - Firebase user ID
 * @returns Active SOS alert or null
 */
export async function getActiveSOSAlert(userId: string): Promise<SOSAlertDocument | null> {
  try {
    const alertsRef = collection(db, 'sos_alerts');
    const q = query(
      alertsRef,
      where('user_id', '==', userId)
    );
    const querySnapshot = await getDocs(q);

    // Filter for ACTIVE status client-side to avoid composite index
    const activeDoc = querySnapshot.docs.find(d => d.data().status === 'ACTIVE');
    if (!activeDoc) return null;

    const data = activeDoc.data();
    return {
      ...data,
      created_at: data.created_at?.toDate?.() || new Date(),
    } as SOSAlertDocument;
  } catch (error) {
    console.error('Error fetching active SOS alert:', error);
    throw error;
  }
}

