import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState, useEffect } from "react";
import ModalWrapper from "@/components/ModalWrapper";
import { colors, spacingy } from "@/constants/theme";
import { WiFiNetworkService } from "@/services/WifiNetworkService";
import { verticalScale } from "@/utils/styling";
import Typo from "@/components/Typo";

interface WiFiDevice {
  name: string;
  id: string;
  ip: string;
}

export default function Page() {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<WiFiDevice[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [connectedDevice, setConnectedDevice] = useState<WiFiDevice | null>(
    null
  );
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Initialize the service when component mounts
    WiFiNetworkService.ensureInitialized()
      .then(() => {
        setInitializing(false);
      })
      .catch((error: Error) => {
        console.error("Failed to initialize WiFi:", error);
        Alert.alert(
          "WiFi Error",
          "Failed to initialize WiFi service. Please restart the app."
        );
        setInitializing(false);
      });

    // Cleanup on unmount
    return () => {
      WiFiNetworkService.disconnect().catch(console.error);
    };
  }, []);

  const startScan = async () => {
    try {
      setScanning(true);
      setDevices([]);
      const foundDevices = await WiFiNetworkService.scanForDevices();
      setDevices(foundDevices);
    } catch (error) {
      Alert.alert(
        "Scan Error",
        (error as Error)?.message ?? "An unknown error occurred"
      );
    } finally {
      setScanning(false);
    }
  };

  const connectToDevice = async (device: WiFiDevice) => {
    if (!device || !device.id) {
      Alert.alert("Connection Error", "Invalid device.");
      return;
    }

    try {
      setConnecting(true);
      const connected = await WiFiNetworkService.connectToDevice(device);

      if (connected) {
        setConnectedDevice(device);
        Alert.alert("Success", `Connected to ${device.name}`);
      }
    } catch (error) {
      Alert.alert(
        "Connection Error",
        (error as Error).message || "An unknown error occurred"
      );
    } finally {
      setConnecting(false);
    }
  };

  const disconnectDevice = async () => {
    try {
      await WiFiNetworkService.disconnect();
      setConnectedDevice(null);
    } catch (error) {
      Alert.alert(
        "Disconnect Error",
        (error as Error).message || "An unknown error occurred"
      );
    }
  };

  const renderDevice = ({ item }: { item: WiFiDevice }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => connectToDevice(item)}
      disabled={connecting}
    >
      <Text style={styles.deviceName}>{item.name}</Text>
      <Text style={styles.deviceId}>IP: {item.ip}</Text>
    </TouchableOpacity>
  );

  return (
    <ModalWrapper>
      <Typo style={styles.title}>Connect to Gas Mask</Typo>

      {initializing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryDark} />
          <Text style={styles.loadingText}>Initializing WiFi...</Text>
        </View>
      ) : connectedDevice ? (
        <View style={styles.connectedContainer}>
          <Text style={styles.connectedText}>
            Connected to: {connectedDevice.name}
          </Text>
          <TouchableOpacity
            style={styles.disconnectButton}
            onPress={disconnectDevice}
          >
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          <TouchableOpacity
            style={styles.scanButton}
            onPress={startScan}
            disabled={scanning}
          >
            <Text style={styles.buttonText}>
              {scanning ? "Scanning..." : "Scan for Devices"}
            </Text>
          </TouchableOpacity>

          {scanning ? (
            <ActivityIndicator
              size="large"
              color={colors.primaryDark}
              style={styles.loader}
            />
          ) : (
            <FlatList
              data={devices}
              renderItem={renderDevice}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  No devices found. Tap Scan to search for devices.
                </Text>
              }
            />
          )}

          {connecting && (
            <View style={styles.connectingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={styles.connectingText}>Connecting...</Text>
            </View>
          )}
        </View>
      )}
    </ModalWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacingy._20,
  },
  title: {
    fontWeight: "bold",
    marginBottom: spacingy._20,
    fontSize: 24,
  },
  scanButton: {
    backgroundColor: colors.primaryDark,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  disconnectButton: {
    backgroundColor: "#f44336",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  deviceItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  deviceName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  deviceId: {
    fontSize: 14,
    color: "#757575",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 30,
    fontSize: 16,
    color: "#757575",
  },
  loader: {
    marginTop: 20,
  },
  connectingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  connectingText: {
    color: "white",
    marginTop: 10,
    fontSize: 18,
  },
  connectedContainer: {
    padding: 20,
    backgroundColor: "#e0f7fa",
    borderRadius: 10,
    alignItems: "center",
  },
  connectedText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#00796b",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#757575",
  },
});
