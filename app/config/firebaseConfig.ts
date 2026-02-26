import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDDonLwp2tLkewS7EgxGj2ogs8k83XZe7g",
  authDomain: "sosync-240222825.firebaseapp.com",
  projectId: "sosync-240222825",
  storageBucket: "sosync-240222825.firebasestorage.app",
  messagingSenderId: "112779917252",
  appId: "1:112779917252:web:2c64064a2144f42b4a5691",
  measurementId: "G-R9TBN612SQ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
export default app;
