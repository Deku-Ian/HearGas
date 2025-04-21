import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD1_a76blhel8Z4njI9jrsFELehquIWx44",
  authDomain: "heargas-ad61a.firebaseapp.com",
  projectId: "heargas-ad61a",
  storageBucket: "heargas-ad61a.firebasestorage.app",
  messagingSenderId: "642823438145",
  appId: "1:642823438145:web:67cc685638a0d79d5a6bc0",
  measurementId: "G-47B3Q6BPR2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Try to get existing auth instance first
let auth;
try {
  auth = getAuth(app);
} catch (error) {
  // If auth doesn't exist yet, initialize it with persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
}

export { db, auth };
