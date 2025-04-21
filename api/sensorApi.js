import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

// Save sensor data to Firestore
export const saveSensorData = async (
  deviceId,
  readings,
  detectedGases,
  alertLevel
) => {
  try {
    const readingData = {
      timestamp: serverTimestamp(),
      deviceId,
      readings: {
        mq2_value: readings.mq2 || 0,
        mq4_value: readings.mq4 || 0, // Added MQ-4 sensor
        mq9_value: readings.mq9 || 0,
        mq135_value: readings.mq135 || 0,
      },
      detectedGases,
      alertLevel,
      // Add userId if you have user authentication
      // userId: currentUser.uid,
    };

    const docRef = await addDoc(collection(db, "readings"), readingData);
    console.log("Reading saved with ID: ", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error saving reading:", error);
    throw error;
  }
};

// Get sensor reading history (most recent first)
export const getReadingHistory = async (limitCount = 50) => {
  try {
    const q = query(
      collection(db, "readings"),
      orderBy("timestamp", "desc"),
      limit(limitCount) // Use the renamed parameter here
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || null,
    }));
  } catch (error) {
    console.error("Error fetching reading history:", error);
    throw error;
  }
};

// Do the same for getDeviceReadings
export const getDeviceReadings = async (deviceId, limitCount = 50) => {
  try {
    const q = query(
      collection(db, "readings"),
      where("deviceId", "==", deviceId),
      orderBy("timestamp", "desc"),
      limit(limitCount) // Use the renamed parameter here
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate() || null,
    }));
  } catch (error) {
    console.error("Error fetching device readings:", error);
    throw error;
  }
};
