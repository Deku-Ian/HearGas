import { ref, get, set, push } from "firebase/database";
import { database } from "@/config/firebase";

// Save sensor data to Firebase Realtime Database
export const saveSensorData = async (deviceId, readings) => {
  try {
    const timestamp = Date.now();
    const readingRef = ref(database, `readings/${deviceId}`);
    const newReadingRef = push(readingRef);

    await set(newReadingRef, {
      ...readings,
      timestamp,
      deviceId,
    });

    // Also update the current reading
    const currentRef = ref(database, `sensors/${deviceId}/current`);
    await set(currentRef, {
      ...readings,
      timestamp,
    });

    console.log("Data saved successfully");
    return true;
  } catch (error) {
    console.error("Error saving sensor data:", error);
    return false;
  }
};

// Get reading history from Firebase Realtime Database
export const getReadingHistory = async (limit = 50) => {
  try {
    const readingsRef = ref(database, "readings");
    const snapshot = await get(readingsRef);
    const readings = [];

    if (snapshot.exists()) {
      const data = snapshot.val();

      // Convert the data to array and add timestamps
      Object.keys(data).forEach((deviceId) => {
        const deviceReadings = data[deviceId];
        if (deviceReadings) {
          Object.keys(deviceReadings).forEach((key) => {
            readings.push({
              id: key,
              ...deviceReadings[key],
              timestamp: deviceReadings[key].timestamp || Date.now(),
            });
          });
        }
      });

      // Sort by timestamp manually (newest first) and limit results
      return readings.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
    }

    return [];
  } catch (error) {
    console.error("Error fetching reading history:", error);
    return [];
  }
};
