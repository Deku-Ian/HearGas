import { Platform, PermissionsAndroid } from "react-native";
import { saveSensorData } from "../api/sensorApi";
import { detectGases, getAlertLevel } from "../constants/sensorThresholds";
import NetInfo, { NetInfoState } from "@react-native-community/netinfo";

export class WiFiNetworkService {
  private static isConnected: boolean = false;
  private static deviceIP: string | null = null;
  private static socket: WebSocket | null = null;
  private static reconnectAttempts: number = 0;
  private static maxReconnectAttempts: number = 5;
  private static reconnectTimeout: number = 5000; // 5 seconds
  private static initialized: boolean = false;

  private static setupNetworkListener() {
    NetInfo.addEventListener((state: NetInfoState) => {
      if (state.isConnected) {
        console.log("Network is connected");
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
    return true; // WiFi is always available if the device has network capabilities
  }

  static async requestPermissions(): Promise<boolean> {
    if (Platform.OS === "android" && Platform.Version >= 23) {
      const permissionsToRequest = [
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_NETWORK_STATE,
        PermissionsAndroid.PERMISSIONS.INTERNET,
      ];

      const granted = await PermissionsAndroid.requestMultiple(
        permissionsToRequest
      );
      return Object.values(granted).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true;
  }

  static async scanForDevices(): Promise<
    { id: string; name: string; ip: string }[]
  > {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        throw new Error("Network permissions not granted");
      }

      // In a real implementation, you would scan the local network for devices
      // For now, we'll return a mock device
      return [
        {
          id: "wifi_device_1",
          name: "GasMask WiFi",
          ip: "192.168.1.100", // This would be discovered through network scanning
        },
      ];
    } catch (error) {
      console.error("Scan error:", error);
      throw error;
    }
  }

  static async connectToDevice(device: {
    id: string;
    ip: string;
  }): Promise<boolean> {
    try {
      this.deviceIP = device.ip;
      await this.establishWebSocketConnection();
      this.isConnected = true;
      return true;
    } catch (error) {
      console.error("Connection error:", error);
      this.isConnected = false;
      throw error;
    }
  }

  private static async establishWebSocketConnection() {
    if (!this.deviceIP) {
      throw new Error("No device IP specified");
    }

    const wsUrl = `ws://${this.deviceIP}:8080`; // Adjust port as needed

    return new Promise<boolean>((resolve, reject) => {
      // Set a connection timeout
      const connectionTimeout = setTimeout(() => {
        if (this.socket) {
          this.socket.close();
        }
        reject(new Error("Connection timeout - device not responding"));
      }, 5000); // 5 second timeout

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log("WebSocket connection established");
        clearTimeout(connectionTimeout);
        this.reconnectAttempts = 0;
        resolve(true);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.processReceivedData(data);
        } catch (e) {
          console.error("Error processing data:", e);
        }
      };

      this.socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        clearTimeout(connectionTimeout);
        reject(
          new Error(
            "Failed to connect to device. Make sure it's powered on and connected to the same network."
          )
        );
      };

      this.socket.onclose = () => {
        console.log("WebSocket connection closed");
        clearTimeout(connectionTimeout);
        this.handleDisconnect();
        reject(new Error("Connection closed"));
      };
    });
  }

  private static handleDisconnect() {
    this.isConnected = false;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        if (this.deviceIP) {
          this.establishWebSocketConnection();
        }
      }, this.reconnectTimeout);
    }
  }

  private static processReceivedData(data: any) {
    try {
      const readings: Record<string, number> = {
        mq2: data.mq2 || 0,
        mq4: data.mq4 || 0,
        mq9: data.mq9 || 0,
        mq135: data.mq135 || 0,
      };

      const detectedGases = detectGases({
        mq2_value: readings.mq2,
        mq4_value: readings.mq4,
        mq9_value: readings.mq9,
        mq135_value: readings.mq135,
      });

      const alertLevel = getAlertLevel(readings);

      saveSensorData("wifi_device_1", readings, detectedGases, alertLevel);

      return { readings, detectedGases, alertLevel };
    } catch (error) {
      console.error("Error processing data:", error);
      return null;
    }
  }

  static async disconnect(): Promise<void> {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.deviceIP = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
  }
}
