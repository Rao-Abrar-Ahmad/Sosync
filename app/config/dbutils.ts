import { doc, setDoc, updateDoc, getDoc, deleteDoc, serverTimestamp, Timestamp, collection, query, getDocs, orderBy, where, onSnapshot, increment } from 'firebase/firestore';
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
  pushToken?: string;
  last_active?: Timestamp | Date;
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
  confirm_count?: number;
  dismiss_count?: number;
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
      confirm_count: 0,
      dismiss_count: 0,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    // Log a notification for the user
    await createNotification(
      reportData.user_id,
      `Your report for ${reportData.type} has been successfully submitted.`,
      'DISASTER_REPORT',
      reportId
    );

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
    
    // Check for changes that trigger notifications
    if (updates.severity_level || updates.status) {
      const currentReport = await getDisasterReport(reportId);
      if (currentReport) {
        // Severity Escalation Check
        if (updates.severity_level && currentReport.severity_level !== updates.severity_level) {
          const isEscalation = ['High', 'Critical'].includes(updates.severity_level) && 
                              !['High', 'Critical'].includes(currentReport.severity_level || '');
          
          if (isEscalation) {
            await createNotification(
              currentReport.user_id,
              `The severity of your report for ${currentReport.type} has been ESCALATED to ${updates.severity_level} by an administrator.`,
              'STATUS_UPDATE',
              reportId
            );
          }
        }

        // Status Change Check
        if (updates.status && currentReport.status !== updates.status) {
          await createNotification(
            currentReport.user_id,
            `The status of your report for ${currentReport.type} has been updated to ${updates.status}.`,
            'STATUS_UPDATE',
            reportId
          );
        }
      }
    }

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

/**
 * Subscribe to real-time disaster reports
 * @param callback - Function to handle the latest reports array
 * @returns Unsubscribe function to detach the listener
 */
export function subscribeToDisasterReports(callback: (reports: DisasterReportDocument[]) => void): () => void {
  try {
    const reportsCollectionRef = collection(db, 'disaster_reports');
    const q = query(reportsCollectionRef, orderBy('created_at', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const reports: DisasterReportDocument[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          reports.push({
            ...data,
            created_at: data.created_at?.toDate?.() || new Date(),
            updated_at: data.updated_at?.toDate?.() || undefined,
          } as DisasterReportDocument);
        });
        callback(reports);
      },
      (error) => {
        console.log('[ERROR] in real-time disaster reports listener:', error.message);
        // Return empty array to stop loading states in UI
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error: any) {
    console.log('[ERROR] setting up disaster reports listener:', error.message);
    callback([]);
    return () => {};
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

// ============================================================================
// VOTING & VALIDATION
// ============================================================================

export type VoteType = 'CONFIRM' | 'DISMISS';

export async function getUserVoteOnReport(
  reportId: string,
  userId: string
): Promise<VoteType | null> {
  try {
    const votesRef = collection(db, 'votes');
    const q = query(
      votesRef,
      where('report_id', '==', reportId),
      where('user_id', '==', userId)
    );
    const voteSnap = await getDocs(q);

    if (voteSnap.empty) return null;
    return voteSnap.docs[0].data().vote as VoteType;
  } catch (error) {
    console.error('Error fetching user vote:', error);
    return null;
  }
}

export async function voteOnReport(
  reportId: string,
  userId: string,
  vote: VoteType
): Promise<void> {
  try {
    const votesRef = collection(db, 'votes');
    const q = query(
      votesRef,
      where('report_id', '==', reportId),
      where('user_id', '==', userId)
    );
    const voteSnap = await getDocs(q);
    const reportRef = doc(db, 'disaster_reports', reportId);
    const reportSnap = await getDoc(reportRef);
    
    if (!reportSnap.exists()) throw new Error('Report not found');
    const reportData = reportSnap.data();
    const currentConfirm = reportData.confirm_count || 0;
    const currentDismiss = reportData.dismiss_count || 0;

    let updates: any = {
      updated_at: serverTimestamp()
    };

    if (!voteSnap.empty) {
      const existingVoteDoc = voteSnap.docs[0];
      const existingVote = existingVoteDoc.data().vote as VoteType;

      if (existingVote === vote) return; // No change

      // Update vote record
      await updateDoc(doc(db, 'votes', existingVoteDoc.id), {
        vote,
        updated_at: serverTimestamp(),
      });

      // Update counts: decrement old, increment new
      if (vote === 'CONFIRM') {
        updates.confirm_count = increment(1);
        updates.dismiss_count = increment(-1);
        if (currentConfirm + 1 >= 5 && reportData.status === 'PENDING') {
          updates.status = 'VERIFIED';
          await createNotification(
            reportData.user_id,
            `Great news! Your report for ${reportData.type} has been VERIFIED by the community.`,
            'STATUS_UPDATE',
            reportId
          );
        }
      } else {
        updates.dismiss_count = increment(1);
        updates.confirm_count = increment(-1);
        if (currentDismiss + 1 >= 3 && reportData.status !== 'FALSE_ALARM') {
          updates.status = 'FALSE_ALARM';
          await createNotification(
            reportData.user_id,
            `Your report for ${reportData.type} has been marked as a FALSE ALARM by the community.`,
            'STATUS_UPDATE',
            reportId
          );
        }
      }
    } else {
      // New vote
      const newVoteRef = doc(collection(db, 'votes'));
      await setDoc(newVoteRef, {
        id: newVoteRef.id,
        report_id: reportId,
        user_id: userId,
        vote,
        created_at: serverTimestamp(),
      });

      if (vote === 'CONFIRM') {
        updates.confirm_count = increment(1);
        if (currentConfirm + 1 >= 5 && reportData.status === 'PENDING') {
          updates.status = 'VERIFIED';
        }
      } else {
        updates.dismiss_count = increment(1);
        if (currentDismiss + 1 >= 3 && reportData.status !== 'FALSE_ALARM') {
          updates.status = 'FALSE_ALARM';
        }
      }
    }

    await updateDoc(reportRef, updates);
  } catch (error) {
    console.error('Error voting on report:', error);
    throw error;
  }
}

/**
 * Undo a previously cast vote on a report
 */
export async function undoVoteOnReport(
  reportId: string,
  userId: string
): Promise<void> {
  try {
    const votesRef = collection(db, 'votes');
    const q = query(
      votesRef,
      where('report_id', '==', reportId),
      where('user_id', '==', userId)
    );
    const voteSnap = await getDocs(q);

    if (voteSnap.empty) return; // Nothing to undo

    const voteDoc = voteSnap.docs[0];
    const voteType = voteDoc.data().vote as VoteType;

    // Delete the vote record
    await deleteDoc(doc(db, 'votes', voteDoc.id));

    // Update the report counts
    const reportRef = doc(db, 'disaster_reports', reportId);
    await updateDoc(reportRef, {
      confirm_count: voteType === 'CONFIRM' ? increment(-1) : increment(0),
      dismiss_count: voteType === 'DISMISS' ? increment(-1) : increment(0),
      updated_at: serverTimestamp()
    });
  } catch (error) {
    console.error('Error undoing vote:', error);
    throw error;
  }
}

/**
 * Flag a report for administrative review
 */
export async function flagReport(
  reportId: string,
  userId: string,
  reason: string,
  description?: string
): Promise<void> {
  try {
    const flagRef = doc(collection(db, 'flags'));
    await setDoc(flagRef, {
      id: flagRef.id,
      report_id: reportId,
      user_id: userId,
      reason,
      description: description || '',
      status: 'PENDING',
      created_at: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error flagging report:', error);
    throw error;
  }
}

/**
 * Update user push token for notifications
 */
export async function updateUserPushToken(userId: string, token: string): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const data = userSnap.data();
      // Only update if token is different to avoid infinite loops with UserContext
      if (data.pushToken === token) return;
    }

    await updateDoc(userRef, {
      pushToken: token,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating push token:', error);
    throw error;
  }
}

/**
 * Subscribe to all active SOS alerts
 */
export function subscribeToActiveSOSAlerts(callback: (alerts: SOSAlertDocument[]) => void): () => void {
  try {
    const alertsRef = collection(db, 'sos_alerts');
    const q = query(alertsRef, where('status', '==', 'ACTIVE'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const alerts: SOSAlertDocument[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          alerts.push({
            ...data,
            created_at: data.created_at?.toDate?.() || new Date(),
          } as SOSAlertDocument);
        });
        callback(alerts);
      },
      (error) => {
        console.log('[ERROR] in SOS alerts listener:', error.message);
        // Return empty array to stop loading states in UI
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error: any) {
    console.log('[ERROR] setting up SOS alerts listener:', error.message);
    callback([]);
    return () => {};
  }
}

// ============================================================================
// NOTIFICATIONS MANAGEMENT
// ============================================================================

export type NotificationType = 'DISASTER_REPORT' | 'SOS_ALERT' | 'STATUS_UPDATE' | 'SYSTEM';

export interface NotificationDocument {
  id: string;
  user_id: string;
  report_id?: string;
  sos_id?: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  created_at: Timestamp | Date;
}

/**
 * Get all notifications for a user
 */
export async function getNotifications(userId: string): Promise<NotificationDocument[]> {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('user_id', '==', userId)
    );
    const querySnapshot = await getDocs(q);

    const notifications: NotificationDocument[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      notifications.push({
        ...data,
        created_at: data.created_at?.toDate?.() || new Date(),
      } as NotificationDocument);
    });

    // Sort client-side (newest first)
    notifications.sort((a, b) => {
      const dateA = a.created_at instanceof Date ? a.created_at.getTime() : 0;
      const dateB = b.created_at instanceof Date ? b.created_at.getTime() : 0;
      return dateB - dateA;
    });

    return notifications;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Subscribe to notifications for a user
 */
export function subscribeToNotifications(userId: string, callback: (notifications: NotificationDocument[]) => void): () => void {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('user_id', '==', userId));

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const notifications: NotificationDocument[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          notifications.push({
            ...data,
            created_at: data.created_at?.toDate?.() || new Date(),
          } as NotificationDocument);
        });

        notifications.sort((a, b) => {
          const dateA = a.created_at instanceof Date ? a.created_at.getTime() : 0;
          const dateB = b.created_at instanceof Date ? b.created_at.getTime() : 0;
          return dateB - dateA;
        });

        callback(notifications);
      },
      (error) => {
        console.log('[ERROR] in notifications listener:', error.message);
        callback([]);
      }
    );

    return unsubscribe;
  } catch (error: any) {
    console.log('[ERROR] setting up notifications listener:', error.message);
    callback([]);
    return () => {};
  }
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(notificationId: string): Promise<void> {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { is_read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Create a new notification
 */
export async function createNotification(
  userId: string,
  message: string,
  type: NotificationType,
  reportId?: string,
  sosId?: string
): Promise<string> {
  try {
    const notificationRef = doc(collection(db, 'notifications'));
    await setDoc(notificationRef, {
      id: notificationRef.id,
      user_id: userId,
      message,
      type,
      report_id: reportId || null,
      sos_id: sosId || null,
      is_read: false,
      created_at: serverTimestamp(),
    });
    return notificationRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

// ============================================================================
// ADMIN UTILITIES
// ============================================================================

/**
 * Get aggregated system statistics for admin dashboard
 */
export async function adminGetSystemStats() {
  try {
    const usersCount = (await getDocs(collection(db, 'users'))).size;
    const reportsCount = (await getDocs(collection(db, 'disaster_reports'))).size;
    
    const sosQuery = query(collection(db, 'sos_alerts'), where('status', '==', 'ACTIVE'));
    const activeSosCount = (await getDocs(sosQuery)).size;

    return {
      totalUsers: usersCount,
      totalReports: reportsCount,
      activeSOS: activeSosCount,
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    throw error;
  }
}

/**
 * Get all users for admin management
 */
export async function adminGetAllUsers(): Promise<UserDocument[]> {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      created_at: doc.data().created_at?.toDate?.() || new Date(),
    })) as UserDocument[];
  } catch (error) {
    console.error('Error fetching all users:', error);
    throw error;
  }
}

/**
 * Update a user's role
 */
export async function adminUpdateUserRole(userId: string, role: 'USER' | 'ADMIN' | 'RESPONDER'): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { role, updated_at: serverTimestamp() });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

/**
 * Update user details (Admin action)
 */
export async function adminUpdateUserDetails(
  userId: string,
  updates: { first_name?: string; last_name?: string; phone_number?: string }
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating user details:', error);
    throw error;
  }
}

/**
 * Update a report's status (Admin override)
 */
export async function adminUpdateReportStatus(reportId: string, status: ReportStatus): Promise<void> {
  try {
    const reportRef = doc(db, 'disaster_reports', reportId);
    await updateDoc(reportRef, { status, updated_at: serverTimestamp() });
  } catch (error) {
    console.error('Error overriding report status:', error);
    throw error;
  }
}

/**
 * Subscribe to pending flags for admin review
 */
export function adminSubscribeToFlags(callback: (flags: any[]) => void): () => void {
  try {
    const flagsRef = collection(db, 'flags');
    const q = query(flagsRef, where('status', '==', 'PENDING'), orderBy('created_at', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const flags = snapshot.docs.map(doc => ({
        ...doc.data(),
        created_at: doc.data().created_at?.toDate?.() || new Date(),
      }));
      callback(flags);
    }, (error) => {
      console.error('Error in flags listener:', error);
      callback([]);
    });
  } catch (error) {
    console.error('Error setting up flags listener:', error);
    callback([]);
    return () => {};
  }
}

/**
 * Update the status of a flag (e.g., RESOLVED, DISMISSED)
 */
export async function adminResolveFlag(flagId: string, status: 'RESOLVED' | 'DISMISSED'): Promise<void> {
  try {
    const flagRef = doc(db, 'flags', flagId);
    await updateDoc(flagRef, { status, updated_at: serverTimestamp() });
  } catch (error) {
    console.error('Error resolving flag:', error);
    throw error;
  }
}

/**
 * Get all votes for a report including user names
 */
export async function adminGetReportVotes(reportId: string) {
  try {
    const votesRef = collection(db, 'votes');
    const q = query(votesRef, where('report_id', '==', reportId));
    const snapshot = await getDocs(q);

    const votes = [];
    for (const voteDoc of snapshot.docs) {
      const data = voteDoc.data();
      // Fetch user info for each vote
      const userDoc = await getDoc(doc(db, 'users', data.user_id));
      const userData = userDoc.exists() ? userDoc.data() : null;
      
      votes.push({
        ...data,
        user_name: userData ? `${userData.first_name} ${userData.last_name}` : 'Unknown User',
        created_at: data.created_at?.toDate?.() || new Date(),
      });
    }
    
    // Sort by date (descending)
    votes.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
    
    return votes;
  } catch (error) {
    console.error('Error fetching report votes:', error);
    throw error;
  }
}

/**
 * Remove a media item from a report
 */
export async function adminRemoveReportMedia(reportId: string, fileName: string): Promise<void> {
  try {
    const reportRef = doc(db, 'disaster_reports', reportId);
    const reportSnap = await getDoc(reportRef);
    if (reportSnap.exists()) {
      const data = reportSnap.data() as DisasterReportDocument;
      const updatedMedia = (data.media || []).filter(m => m.file_name !== fileName);
      await updateDoc(reportRef, { 
        media: updatedMedia,
        updated_at: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error removing report media:', error);
    throw error;
  }
}

/**
 * Admin: Update the status of an SOS alert
 */
export async function adminUpdateSOSStatus(
  sosId: string, 
  status: 'ACTIVE' | 'RESPONDED' | 'RESOLVED'
): Promise<void> {
  try {
    const sosRef = doc(db, 'sos_alerts', sosId);
    await updateDoc(sosRef, {
      status,
      updated_at: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating SOS status:', error);
    throw error;
  }
}

/**
 * Admin: Update user active status (Suspend/Activate)
 */
export async function adminUpdateUserStatus(
  userId: string,
  isActive: boolean
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      is_active: isActive,
      updated_at: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    throw error;
  }
}

