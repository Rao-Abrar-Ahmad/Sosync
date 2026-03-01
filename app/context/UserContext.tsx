import React, { createContext, useContext, useEffect, useReducer, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebaseConfig';

// Complete user data combining Firebase auth + Firestore document
interface UserData {
  // Firebase Auth Fields
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  
  // Firestore Document Fields
  id?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  profile_picture?: string;
  role?: string;
  is_active?: boolean;
  auth_provider?: string;
  location_permission_granted?: boolean;
  last_known_location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  location_permission_granted_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface UserState {
  user: UserData | null;
  loading: boolean;
  error: string | null;
}


type UserAction =
  | { type: 'SET_USER'; payload: UserData }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'UPDATE_USER'; payload: Partial<UserData> };

const initialState: UserState = {
  user: null,
  loading: true,
  error: null,
};

function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        loading: false,
        error: null,
      };

    case 'CLEAR_USER':
      return {
        ...state,
        user: null,
        loading: false,
        error: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };

    default:
      return state;
  }
}

const UserContext = createContext<UserState | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(userReducer, initialState);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        if (firebaseUser) {
          // Firebase user exists, now fetch their Firestore document
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          let userData: UserData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          };

          // Merge Firestore data if it exists
          if (userDocSnap.exists()) {
            const firestoreData = userDocSnap.data();
            userData = {
              ...userData,
              ...firestoreData,
              // Convert Firestore timestamps to Date objects if they exist
              created_at: firestoreData.created_at?.toDate?.() || undefined,
              updated_at: firestoreData.updated_at?.toDate?.() || undefined,
              location_permission_granted_at: firestoreData.location_permission_granted_at?.toDate?.() || undefined,
            };
          }

          dispatch({
            type: 'SET_USER',
            payload: userData,
          });
        } else {
          dispatch({ type: 'CLEAR_USER' });
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load user data' });
      }
    });

    return unsubscribe;
  }, []);

  return (
    <UserContext.Provider value={{ ...state }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
