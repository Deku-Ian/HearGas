import { Platform, PermissionsAndroid } from "react-native";
import { saveSensorData } from "../api/sensorApi";
import { detectGases, getAlertLevel } from "../constants/sensorThresholds";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { database } from "../config/firebase";
import { ref, onValue, off, get, set, remove } from "firebase/database";

export class WiFiNetworkService {
  private static isConnected: boolean = false;
  private static deviceId: string | null = null;
  private static deviceName: string | null = null;
  private static reconnectAttempts: number = 0;
  private static maxReconnectAttempts: number = 5;
  private static reconnectTimeout: number = 5000; // 5 seconds
  private static initialized: boolean = false;
  private static deviceListener: (() => void) | null = null;
  private static lastUpdate: number | null = null;
  private static dataListener: (() => void) | null = null;

  private static async verifyFirebaseConnection(): Promise<boolean> {
    try {
      console.log("Verifying Firebase connection...");
      const rootRef = ref(database);
      const snapshot = await get(rootRef);
      console.log("Firebase connection verified");
      return true;
    } catch (error) {
      console.error("Firebase connection error:", error);
      return false;
    }
  }

  private static setupNetworkListener() {
    NetInfo.addEventListener((state: NetInfoState) => {
      if (state.isConnected) {
        console.log("Network is connected");
        if (this.deviceId) {
          this.startListeningToDevice();
        }
      } else {
        console.log("Network is disconnected");
        this.handleDisconnect();
      }
    });
  }

  static async ensureInitialized(): Promise<boolean> {
    if (!this.initialized) {
      this.setupNetworkListener();
      this.initialized = true;
    }
    return true;
  }

  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === "android") {
      try {
        const permissionsToRequest = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
          PermissionsAndroid.PERMISSIONS.ACCESS_WIFI_STATE,
          PermissionsAndroid.PERMISSIONS.CHANGE_WIFI_STATE,
          PermissionsAndroid.PERMISSIONS.ACCESS_NETWORK_STATE,
          PermissionsAndroid.PERMISSIONS.INTERNET,
        ];

        // First check if we already have the permissions
        const hasPermissions = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );

        if (hasPermissions) {
          return true;
        }

        // If we don't have permissions, request them
        const granted = await PermissionsAndroid.requestMultiple(
          permissionsToRequest
        );

        // Check if all required permissions are granted
        const allGranted = Object.values(granted).every(
          (result) => result === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          console.log("Some permissions were denied:", granted);
          // Even if some permissions are denied, we can still proceed with basic functionality
          return true;
        }

        return true;
      } catch (err) {
        console.warn("Error requesting permissions:", err);
        // Even if permission request fails, we can still proceed with basic functionality
        return true;
      }
    }
    return true; // On iOS, return true as permissions are handled differently
  }

  static async scanForDevices(): Promise<{ id: string; name: string }[]> {
    try {
      console.log("Starting device scan...");
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log("Permissions not granted");
        throw new Error("Network permissions not granted");
      }

      // Verify Firebase connection
      const isConnected = await this.verifyFirebaseConnection();
      if (!isConnected) {
        throw new Error("Failed to connect to Firebase");
      }

      // Listen to Firebase for active devices
      return new Promise((resolve) => {
        console.log("Setting up Firebase listener for devices...");
        const sensorsRef = ref(database, "sensors");

        // First, let's check what data exists in Firebase
        get(sensorsRef)
          .then((snapshot) => {
            console.log("All Firebase data:", snapshot.val());
          })
          .catch((error) => {
            console.error("Error reading Firebase data:", error);
          });

        const listener = onValue(
          sensorsRef,
          (snapshot) => {
            const data = snapshot.val();
            console.log(
              "Raw sensors data from Firebase:",
              JSON.stringify(data, null, 2)
            );

            const devices: { id: string; name: string }[] = [];

            if (data) {
              Object.keys(data).forEach((deviceId) => {
                const deviceData = data[deviceId];
                console.log(`Checking device ${deviceId}:`, deviceData);

                // Check if device has any data
                if (deviceData) {
                  devices.push({
                    id: deviceId,
                    name: `GasMask ${deviceId.substring(0, 8)}`,
                  });
                  console.log(`Added device: ${deviceId}`);
                }
              });
            }

            console.log("Found devices:", devices);
            resolve(devices);

            // Clean up listener after we get the data
            off(sensorsRef);
          },
          (error) => {
            console.error("Firebase listener error:", error);
            resolve([]);
          }
        );
      });
    } catch (error) {
      console.error("Scan error:", error);
      throw error;
    }
  }

  static async testFirebaseConnection(): Promise<void> {
    try {
      console.log("Testing Firebase connection...");

      // Test reading from sensors node
      const sensorsRef = ref(database, "sensors");
      const snapshot = await get(sensorsRef);
      console.log(
        "Current data in Firebase:",
        JSON.stringify(snapshot.val(), null, 2)
      );

      // Test writing test data
      const testData = {
        mq2_value: 100,
        mq4_value: 200,
        mq9_value: 300,
        mq135_value: 400,
        timestamp: Date.now(),
        alertLevel: "Low",
      };

      const testDeviceId = "test_device";
      const testRef = ref(database, `sensors/${testDeviceId}/current`);
      await set(testRef, testData);
      console.log("Test data written successfully");

      // Verify the test data
      const verifySnapshot = await get(testRef);
      console.log("Verified test data:", verifySnapshot.val());

      // Clean up test data
      await remove(testRef);
      console.log("Test data cleaned up");
    } catch (error) {
      console.error("Firebase test failed:", error);
    }
  }

  static async connectToDevice(device: {
    id: string;
    name: string;
  }): Promise<boolean> {
    try {
      console.log("Attempting to connect to device:", device);

      // Test Firebase connection first
      await this.testFirebaseConnection();

      this.deviceId = device.id;
      this.deviceName = device.name;
      console.log("Device ID and name set:", {
        deviceId: this.deviceId,
        deviceName: this.deviceName,
      });

      this.startListeningToDevice();
      this.isConnected = true;
      this.lastUpdate = Date.now();

      // Verify we can read the device's data
      const deviceRef = ref(database, `sensors/${device.id}`);
      const snapshot = await get(deviceRef);
      console.log("Initial device data:", snapshot.val());

      return true;
    } catch (error) {
      console.error("Connection error:", error);
      this.isConnected = false;
      this.deviceId = null;
      this.deviceName = null;
      throw error;
    }
  }

  private static startListeningToDevice() {
    if (!this.deviceId) {
      console.log("No device ID available for listening");
      return;
    }

    console.log("Starting to listen to device:", this.deviceId);

    // Remove existing listeners
    if (this.deviceListener) {
      console.log("Removing existing device listener");
      this.deviceListener();
    }
    if (this.dataListener) {
      console.log("Removing existing data listener");
      this.dataListener();
    }

    // Listen for device status
    const deviceRef = ref(database, `sensors/${this.deviceId}`);
    this.deviceListener = onValue(deviceRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Device status data:", data);
      if (data && data.current) {
        this.lastUpdate = data.current.timestamp;
        this.isConnected = true;
        console.log(
          "Device connected, last update:",
          this.lastUpdate
            ? new Date(this.lastUpdate).toLocaleString()
            : "No timestamp"
        );
      } else {
        this.isConnected = false;
        console.log("Device disconnected");
      }
    });

    // Listen for current readings
    const currentRef = ref(database, `sensors/${this.deviceId}/current`);
    this.dataListener = onValue(currentRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Current readings data:", data);
      if (data) {
        this.lastUpdate = data.timestamp;
        this.processReceivedData(data, false);
      }
    });
  }

  private static handleDisconnect() {
    this.isConnected = false;
    if (this.deviceListener) {
      this.deviceListener();
      this.deviceListener = null;
    }
    if (this.dataListener) {
      this.dataListener();
      this.dataListener = null;
    }
  }

  private static processReceivedData(data: any, shouldSave: boolean = false) {
    try {
      console.log("Processing received data:", data);
      const readings = {
        mq2_value: data.mq2_value || 0,
        mq4_value: data.mq4_value || 0,
        mq9_value: data.mq9_value || 0,
        mq135_value: data.mq135_value || 0,
        alertLevel: data.alertLevel || "Low",
        detectedGases: data.detectedGases || [],
        timestamp: data.timestamp, // Use the timestamp from the data
      };
      console.log("Processed readings:", readings);

      // Only save to history if explicitly requested
      if (shouldSave) {
        console.log("Saving readings to history");
        saveSensorData(this.deviceId || "unknown", readings);
      }
    } catch (error) {
      console.error("Error processing data:", error);
    }
  }

  static async disconnect(): Promise<void> {
    if (this.deviceListener) {
      this.deviceListener();
      this.deviceListener = null;
    }
    if (this.dataListener) {
      this.dataListener();
      this.dataListener = null;
    }
    this.deviceId = null;
    this.deviceName = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }

  static async testConnection(): Promise<boolean> {
    try {
      if (!this.deviceId) return false;

      const deviceRef = ref(database, `sensors/${this.deviceId}/current`);
      const snapshot = await get(deviceRef);
      const data = snapshot.val();

      if (data) {
        this.lastUpdate = Date.now();
        return true;
      }
      return false;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  }

  static async testWriteSensorData(): Promise<boolean> {
    try {
      console.log("Testing sensor data write...");
      const currentTimestamp = Date.now();

      const testData = {
        deviceId: "mask001",
        readings: {
          mq2_value: 100,
          mq4_value: 200,
          mq9_value: 300,
          mq135_value: 400,
        },
        timestamp: currentTimestamp,
        alertLevel: "Low",
        detectedGases: [],
      };

      const sensorRef = ref(database, "sensors/mask001/current");
      await set(sensorRef, testData);

      // Update last update time
      this.lastUpdate = currentTimestamp;
      console.log(
        "Test sensor data written successfully with timestamp:",
        new Date(currentTimestamp).toLocaleString()
      );

      return true;
    } catch (error) {
      console.error("Failed to write test sensor data:", error);
      return false;
    }
  }

  static getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      lastUpdate: this.lastUpdate,
    };
  }
}
