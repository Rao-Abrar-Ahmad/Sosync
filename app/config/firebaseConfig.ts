import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCI6JW9R235nTM2Okfg47vfsuBMUG1q55U",
  authDomain: "sosync-25185.firebaseapp.com",
  projectId: "sosync-25185",
  storageBucket: "sosync-25185.firebasestorage.app",
  messagingSenderId: "787034241329",
  appId: "1:787034241329:web:02b6f24c21abe178021810",
  measurementId: "G-53FPLRCWLK",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// getNative auth persistence for mobile apps
// for web view
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
export default app;
