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
import BluetoothService from "@/services/BluetoothService";
import Typo from "@/components/Typo";

interface BluetoothDevice {
  name: string;
  id: string;
}

export default function Page() {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState<BluetoothDevice[]>([]);
  const [connecting, setConnecting] = useState(false);
  const [connectedDevice, setConnectedDevice] =
    useState<BluetoothDevice | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    // Initialize the service when component mounts
    BluetoothService.ensureInitialized()
      .then(() => {
        setInitializing(false);
      })
      .catch((error) => {
        console.error("Failed to initialize Bluetooth:", error);
        Alert.alert(
          "Bluetooth Error",
          "Failed to initialize Bluetooth service. Please restart the app."
        );
        setInitializing(false);
      });

    // Cleanup on unmount
    return () => {
      BluetoothService.disconnect().catch(console.error);
    };
  }, []);

  const startScan = async () => {
    try {
      setScanning(true);
      setDevices([]);
      const foundDevices = await BluetoothService.scanForDevices();

      const uniqueDevices = foundDevices.map((device) => ({
        name: device.name ?? "Unnamed Device",
        id: device.id ?? Math.random().toString(),
      }));

      setDevices(uniqueDevices);
    } catch (error) {
      Alert.alert(
        "Scan Error",
        (error as Error)?.message ?? "An unknown error occurred"
      );
    } finally {
      setScanning(false);
    }
  };

  const connectToDevice = async (device: BluetoothDevice) => {
    if (!device || !device.id) {
      Alert.alert("Connection Error", "Invalid device.");
      return;
    }

    try {
      setConnecting(true);
      const connected = await BluetoothService.connectToDevice(device as any);

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
      await BluetoothService.disconnect();
      setConnectedDevice(null);
    } catch (error) {
      Alert.alert(
        "Disconnect Error",
        (error as Error).message || "An unknown error occurred"
      );
    }
  };

  const renderDevice = ({ item }: { item: BluetoothDevice }) => (
    <TouchableOpacity
      style={styles.deviceItem}
      onPress={() => connectToDevice(item)}
      disabled={connecting}
    >
      <Text style={styles.deviceName}>{item.name}</Text>
      <Text style={styles.deviceId}>{item.id}</Text>
    </TouchableOpacity>
  );

  return (
    <ModalWrapper>
      <Typo style={styles.title}>Connect to Gas Mask</Typo>

      {initializing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primaryDark} />
          <Text style={styles.loadingText}>Initializing Bluetooth...</Text>
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
