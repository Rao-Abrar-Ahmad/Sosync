import { doc, setDoc, updateDoc, getDoc, serverTimestamp, Timestamp, collection, query, getDocs, orderBy } from 'firebase/firestore';
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

