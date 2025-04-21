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
} from "react-native";
import { saveSensorData } from "../api/sensorApi";
import { detectGases, getAlertLevel } from "../constants/sensorThresholds";
import { Buffer } from "buffer"; // For decoding base64 values

class BluetoothService {
  manager: BleManager | null = null;
  device: Device | null = null;
  characteristic: Characteristic | null = null;
  isConnected: boolean = false;
  monitorSubscription: Subscription | null = null;
  initPromise: Promise<boolean> | null = null;

  DEVICE_NAME = "GasMask";
  SERVICE_UUID = "0000FFE0-0000-1000-8000-00805F9B34FB";
  CHARACTERISTIC_UUID = "0000FFE1-0000-1000-8000-00805F9B34FB";

  constructor() {
    // Don't initialize the manager in the constructor
  }

  async ensureInitialized(): Promise<boolean> {
    // If we already have an initialization promise, return it
    if (this.initPromise) {
      return this.initPromise;
    }

    // Create a new initialization promise
    this.initPromise = new Promise<boolean>((resolve, reject) => {
      // Check if BLE module is available
      if (NativeModules.BleClientManager) {
        try {
          this.manager = new BleManager();
          resolve(true);
        } catch (error) {
          console.error("Failed to initialize BleManager:", error);
          reject(error);
        }
      } else {
        // If BLE module is not available yet, wait for AppRegistry to be ready
        // This is a common pattern when the native modules aren't loaded yet
        setTimeout(() => {
          try {
            if (NativeModules.BleClientManager) {
              this.manager = new BleManager();
              resolve(true);
            } else {
              reject(new Error("BleClientManager native module not found"));
            }
          } catch (error) {
            console.error(
              "Failed to initialize BleManager after delay:",
              error
            );
            reject(error);
          }
        }, 1000); // Try again after 1 second
      }
    });

    return this.initPromise;
  }

  async requestPermissions(): Promise<boolean> {
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

      return Object.values(granted).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );
    }

    return true;
  }

  async scanForDevices(): Promise<Device[]> {
    await this.ensureInitialized();

    if (!this.manager) {
      throw new Error("BleManager not initialized");
    }

    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error("Bluetooth permissions not granted");
      }

      return new Promise((resolve, reject) => {
        const devices: Device[] = [];
        this.manager!.startDeviceScan(null, null, (error, device) => {
          if (error) {
            this.manager!.stopDeviceScan();
            reject(error);
            return;
          }

          if (
            device &&
            device.name &&
            !devices.some((d) => d.id === device.id)
          ) {
            devices.push(device);
          }
        });

        setTimeout(() => {
          this.manager!.stopDeviceScan();
          resolve(devices);
        }, 10000); // Stop after 10 seconds
      });
    } catch (error) {
      console.error("Scan error:", error);
      throw error;
    }
  }

  async connectToDevice(device: Device): Promise<boolean> {
    await this.ensureInitialized();

    if (!this.manager) {
      throw new Error("BleManager not initialized");
    }

    try {
      const connectedDevice = await device.connect();
      this.device = connectedDevice;

      await connectedDevice.discoverAllServicesAndCharacteristics();

      const services = await connectedDevice.services();

      for (const service of services) {
        const characteristics = await service.characteristics();
        for (const char of characteristics) {
          if (
            char.uuid.toLowerCase() === this.CHARACTERISTIC_UUID.toLowerCase()
          ) {
            this.characteristic = char;
            await this.setupNotifications(char);

            this.isConnected = true;
            return true;
          }
        }
      }

      throw new Error("Required characteristic not found");
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
          const value = parseInt(valueStr, 10);
          readings[key] = value;
        }
      });

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

      return { readings, detectedGases, alertLevel };
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
        if (this.monitorSubscription) {
          this.monitorSubscription.remove();
          this.monitorSubscription = null;
        }

        await this.device.cancelConnection();
      } catch (e) {
        console.warn("Disconnect error:", e);
      } finally {
        this.device = null;
        this.characteristic = null;
        this.isConnected = false;
      }
    }
  }
}

// Singleton instance
const instance = new BluetoothService();
export default instance;
