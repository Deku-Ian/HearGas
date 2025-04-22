import {
  BleManager,
  Device,
  Characteristic,
  Subscription,
} from "react-native-ble-plx";
import {
  Platform,
  PermissionsAndroid,
  NativeModules,
  NativeEventEmitter,
  AppState,
} from "react-native";
import { saveSensorData } from "../api/sensorApi";
import { detectGases, getAlertLevel } from "../constants/sensorThresholds";
import { Buffer } from "buffer"; // For decoding base64 values

import { collection, addDoc } from "firebase/firestore";
import { db } from "../config/firebase"; // adjust path if needed

export const logGasData = async (gasType: string, level: number) => {
  try {
    const docRef = await addDoc(collection(db, "gas_logs"), {
      gasType,
      level,
      timestamp: new Date(),
    });
    console.log("Logged gas data with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
};

class BluetoothService {
  manager: BleManager | null = null;
  device: Device | null = null;
  characteristic: Characteristic | null = null;
  isConnected: boolean = false;
  monitorSubscription: Subscription | null = null;
  initPromise: Promise<boolean> | null = null;
  appStateSubscription: any = null;

  DEVICE_NAME = "GasMask";
  SERVICE_UUID = "0000FFE0-0000-1000-8000-00805F9B34FB";
  CHARACTERISTIC_UUID = "0000FFE1-0000-1000-8000-00805F9B34FB";

  constructor() {
    // Don't initialize the manager in the constructor
    // Setup app state listener to handle app going to background/foreground
    this.setupAppStateListener();
  }

  setupAppStateListener() {
    // Handle app state changes to properly disconnect when app goes to background
    this.appStateSubscription = AppState.addEventListener(
      "change",
      (nextAppState) => {
        if (nextAppState === "background" || nextAppState === "inactive") {
          this.disconnect();
        }
      }
    );
  }

  async ensureInitialized(): Promise<boolean> {
    // If we already have an initialization promise, return it
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise<boolean>((resolve, reject) => {
      // Try multiple times with increasing delays
      let attempts = 0;
      const maxAttempts = 5;

      const tryInitialize = () => {
        attempts++;
        console.log(
          `Attempting to initialize BLE, attempt ${attempts}/${maxAttempts}`
        );

        // Check if BLE module is available
        if (NativeModules.BleClientManager) {
          try {
            console.log("BleClientManager found, creating BleManager...");
            this.manager = new BleManager();
            console.log("BLE Manager initialized successfully");
            resolve(true);
          } catch (error) {
            console.error("Failed to initialize BleManager:", error);
            reject(new Error(`BleManager initialization failed: ${error}`));
          }
        } else {
          console.log("BleClientManager not found yet");
          if (attempts < maxAttempts) {
            // Exponential backoff
            const delay = Math.min(1000 * Math.pow(1.5, attempts), 10000); // Cap at 10 seconds
            console.log(`Retrying in ${delay}ms...`);
            setTimeout(tryInitialize, delay);
          } else {
            const errorMsg =
              "BleClientManager native module not found after multiple attempts";
            console.error(errorMsg);
            reject(new Error(errorMsg));
          }
        }
      };

      // Start the initialization process
      tryInitialize();
    });

    return this.initPromise;
  }

  resetInitialization() {
    // Reset the initialization promise to allow retrying after a failure
    this.initPromise = null;
    if (this.manager) {
      try {
        this.manager.destroy();
      } catch (e) {
        console.warn("Error destroying BLE manager:", e);
      }
      this.manager = null;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      await this.ensureInitialized();

      if (!this.manager) {
        throw new Error("BleManager not initialized");
      }

      if (Platform.OS === "android" && Platform.Version >= 23) {
        const permissionsToRequest = [
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ];

        if (Platform.Version >= 31) {
          permissionsToRequest.push(
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
            PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
          );
        }

        const granted = await PermissionsAndroid.requestMultiple(
          permissionsToRequest
        );

        const allGranted = Object.values(granted).every(
          (status) => status === PermissionsAndroid.RESULTS.GRANTED
        );

        if (!allGranted) {
          console.log("Not all permissions were granted:", granted);
        }

        return allGranted;
      }

      return true;
    } catch (error) {
      console.error("Error requesting permissions:", error);
      return false;
    }
  }

  async scanForDevices(): Promise<Device[]> {
    try {
      await this.ensureInitialized();

      if (!this.manager) {
        throw new Error("BleManager not initialized");
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error("Bluetooth permissions not granted");
      }

      console.log("Starting device scan...");

      return new Promise((resolve, reject) => {
        const devices: Device[] = [];

        // First make sure any previous scan is stopped
        this.manager!.stopDeviceScan();

        // Start a new scan
        this.manager!.startDeviceScan(null, null, (error, device) => {
          if (error) {
            console.error("Scan error:", error);
            this.manager!.stopDeviceScan();
            reject(error);
            return;
          }

          if (
            device &&
            device.name &&
            !devices.some((d) => d.id === device.id)
          ) {
            console.log(`Found device: ${device.name} (${device.id})`);
            devices.push(device);
          }
        });

        setTimeout(() => {
          console.log(`Scan complete. Found ${devices.length} devices.`);
          this.manager!.stopDeviceScan();
          resolve(devices);
        }, 10000); // Stop after 10 seconds
      });
    } catch (error) {
      console.error("Scan error:", error);
      throw error;
    }
  }

  // Helper method to scan with proper delay and error handling
  async scanWithRetry(maxRetries = 3): Promise<Device[]> {
    let retries = 0;

    while (retries < maxRetries) {
      try {
        // If we've tried before and failed, reset the initialization
        if (retries > 0) {
          console.log(`Retry attempt ${retries}/${maxRetries}`);
          this.resetInitialization();
          // Wait a bit between retries
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        return await this.scanForDevices();
      } catch (error) {
        retries++;
        console.error(`Scan attempt ${retries} failed:`, error);

        if (retries >= maxRetries) {
          throw new Error(
            `Failed to scan after ${maxRetries} attempts: ${error}`
          );
        }
      }
    }

    // This should never be reached due to the throw above, but TypeScript requires a return
    return [];
  }

  async connectToDevice(device: Device): Promise<boolean> {
    try {
      await this.ensureInitialized();

      if (!this.manager) {
        throw new Error("BleManager not initialized");
      }

      // Disconnect from previous device if connected
      if (this.device && this.isConnected) {
        await this.disconnect();
      }

      console.log(`Connecting to device: ${device.name} (${device.id})`);
      const connectedDevice = await device.connect();
      this.device = connectedDevice;

      console.log("Discovering services and characteristics...");
      await connectedDevice.discoverAllServicesAndCharacteristics();

      const services = await connectedDevice.services();
      console.log(`Found ${services.length} services`);

      let foundCharacteristic = false;

      for (const service of services) {
        const characteristics = await service.characteristics();
        console.log(
          `Service ${service.uuid} has ${characteristics.length} characteristics`
        );

        for (const char of characteristics) {
          if (
            char.uuid.toLowerCase() === this.CHARACTERISTIC_UUID.toLowerCase()
          ) {
            console.log(`Found target characteristic: ${char.uuid}`);
            this.characteristic = char;
            await this.setupNotifications(char);
            foundCharacteristic = true;
            this.isConnected = true;
            break;
          }
        }

        if (foundCharacteristic) break;
      }

      if (!foundCharacteristic) {
        throw new Error(
          `Required characteristic ${this.CHARACTERISTIC_UUID} not found`
        );
      }

      return true;
    } catch (error) {
      console.error("Connection error:", error);
      this.isConnected = false;
      throw error;
    }
  }

  async setupNotifications(characteristic: Characteristic) {
    if (this.monitorSubscription) {
      this.monitorSubscription.remove();
      this.monitorSubscription = null;
    }

    console.log("Setting up notifications...");
    this.monitorSubscription = characteristic.monitor((error, char) => {
      if (error) {
        console.error("Notification error:", error);
        return;
      }

      if (char && char.value) {
        try {
          const decodedValue = this.decodeBase64Value(char.value);
          console.log("Received data:", decodedValue);
          this.processReceivedData(decodedValue);
        } catch (e) {
          console.error("Error processing data:", e);
        }
      }
    });
  }

  decodeBase64Value(value: string): string {
    try {
      return Buffer.from(value, "base64").toString("ascii");
    } catch (e) {
      console.error("Base64 decode error:", e);
      return "";
    }
  }

  processReceivedData(data: string) {
    try {
      const parts = data.trim().split(",");
      const readings: Record<string, number> = {};

      parts.forEach((part) => {
        const [sensor, valueStr] = part.split(":");
        if (sensor && valueStr) {
          const key = sensor.toLowerCase();

          // Parse as float instead of integer to preserve decimal values
          const value = parseFloat(valueStr);

          // Only add valid readings
          if (!isNaN(value)) {
            readings[key] = value;
          }
        }
      });

      // Validate all required sensors are present
      const requiredSensors = ["mq2", "mq4", "mq9", "mq135"];
      const hasAllSensors = requiredSensors.every(
        (sensor) => readings.hasOwnProperty(sensor) && !isNaN(readings[sensor])
      );

      if (hasAllSensors) {
        const detectedGases = detectGases({
          mq2_value: readings.mq2 || 0,
          mq4_value: readings.mq4 || 0,
          mq9_value: readings.mq9 || 0,
          mq135_value: readings.mq135 || 0,
        });

        const alertLevel = getAlertLevel({
          mq2: readings.mq2 || 0,
          mq4: readings.mq4 || 0,
          mq9: readings.mq9 || 0,
          mq135: readings.mq135 || 0,
        });

        saveSensorData("mask_device_1", readings, detectedGases, alertLevel);

        // Log high alert gases to Firebase
        if (Number(alertLevel) > 1 && detectedGases.length > 0) {
          detectedGases.forEach((gas) => {
            return logGasData(gas, Number(alertLevel));
          });
        }

        return { readings, detectedGases, alertLevel };
      } else {
        console.warn("Incomplete sensor data received:", readings);
        return null;
      }
    } catch (error) {
      console.error("Error processing data:", error);
      return null;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.manager) {
      return; // Nothing to disconnect
    }

    if (this.device && this.isConnected) {
      try {
        console.log(
          `Disconnecting from device: ${this.device.name} (${this.device.id})`
        );

        if (this.monitorSubscription) {
          this.monitorSubscription.remove();
          this.monitorSubscription = null;
        }

        await this.device.cancelConnection();
        console.log("Disconnected successfully");
      } catch (e) {
        console.warn("Disconnect error:", e);
      } finally {
        this.device = null;
        this.characteristic = null;
        this.isConnected = false;
      }
    }
  }

  cleanup() {
    // Call this when the app is being unmounted
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }

    this.disconnect();

    if (this.manager) {
      this.manager.destroy();
      this.manager = null;
    }

    this.initPromise = null;
  }
}

// Singleton instance
const instance = new BluetoothService();
export default instance;
