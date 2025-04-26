import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBy4FbJ8e1Ys2rrKZmAfpDDyU3H5uZ2R5c",
  authDomain: "rtmask-cf652.firebaseapp.com",
  databaseURL: "https://rtmask-cf652-default-rtdb.firebaseio.com",
  projectId: "rtmask-cf652",
  storageBucket: "rtmask-cf652.firebasestorage.app",
  messagingSenderId: "651507857116",
  appId: "1:651507857116:web:875758863db103bc62e619",
  measurementId: "G-MFWE06RJ3B",
};

// Device configuration
export const DEVICE_ID = "mask001";

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { app, database };
