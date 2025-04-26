import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import ModalWrapper from "@/components/ModalWrapper";
import { WiFiNetworkService } from "@/services/WifiNetworkService";
import { colors, spacingx, spacingy, radius } from "@/constants/theme";
import { scale, verticalScale } from "@/utils/styling";
import { Stack, router } from "expo-router";
import Typo from "@/components/Typo";
import BackButton from "@/components/BackButton";

interface WiFiDevice {
  id: string;
  name: string;
}

export default function PairingScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [devices, setDevices] = useState<WiFiDevice[]>([]);
  const [error, setError] = useState<string | null>(null);

  const startScan = async () => {
    try {
      setIsScanning(true);
      setError(null);

      // Request permissions first
      const permissionsGranted = await WiFiNetworkService.requestPermissions();

      if (!permissionsGranted) {
        Alert.alert(
          "Permission Required",
          "This app needs location and Bluetooth permissions to scan for devices. Please grant these permissions in your device settings.",
          [{ text: "OK", onPress: () => setIsScanning(false) }]
        );
        return;
      }

      // Start scanning for devices
      const foundDevices = await WiFiNetworkService.scanForDevices();
      setDevices(foundDevices);
    } catch (err: any) {
      console.error("Scan error:", err);
      setError(err.message || "Failed to scan for devices");
      Alert.alert(
        "Scan Error",
        "Failed to scan for devices. Please make sure Bluetooth and Location services are enabled.",
        [{ text: "OK" }]
      );
    } finally {
      setIsScanning(false);
    }
  };

  const connectToDevice = async (device: WiFiDevice) => {
    try {
      await WiFiNetworkService.connectToDevice(device);
      Alert.alert("Success", "Connected to device successfully!", [
        {
          text: "OK",
          onPress: () => {
            router.back();
            router.replace("/(tabs)/dashboard");
          },
        },
      ]);
    } catch (err: any) {
      Alert.alert(
        "Connection Error",
        err.message || "Failed to connect to device"
      );
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: colors.neutra1900 },
          headerShadowVisible: false,
          headerTitle: "Pair Device",
        }}
      />

      <View style={styles.header}>
        <BackButton />
        <Typo style={styles.headerTitle}>Pair Device</Typo>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanningButton]}
          onPress={startScan}
          disabled={isScanning}
        >
          {isScanning ? (
            <View style={styles.scanningContainer}>
              <ActivityIndicator color={colors.white} />
              <Text style={styles.buttonText}>Scanning...</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Scan for Devices</Text>
          )}
        </TouchableOpacity>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.deviceList}>
          {devices.map((device) => (
            <TouchableOpacity
              key={device.id}
              style={styles.deviceItem}
              onPress={() => connectToDevice(device)}
            >
              <Text style={styles.deviceText}>{device.name}</Text>
            </TouchableOpacity>
          ))}
          {devices.length === 0 && !isScanning && (
            <Typo style={styles.noDevicesText}>
              No devices found. Tap "Scan for Devices" to search.
            </Typo>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutra1900,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacingx._20,
    paddingVertical: spacingy._15,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
  },
  headerTitle: {
    fontSize: verticalScale(20),
    fontWeight: "bold",
    marginLeft: spacingx._10,
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: spacingx._15,
  },
  scanButton: {
    backgroundColor: colors.primary,
    padding: spacingy._15,
    borderRadius: radius._10,
    alignItems: "center",
    marginBottom: spacingy._20,
  },
  scanningButton: {
    opacity: 0.7,
  },
  scanningContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: spacingx._7,
  },
  deviceList: {
    flex: 1,
  },
  deviceItem: {
    backgroundColor: colors.white,
    padding: spacingy._15,
    borderRadius: radius._6,
    marginBottom: spacingy._10,
    borderWidth: 1,
    borderColor: colors.neutral200,
  },
  deviceText: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.primary,
  },
  errorText: {
    color: colors.rose,
    marginBottom: spacingy._10,
    fontWeight: "500",
  },
  noDevicesText: {
    textAlign: "center",
    color: colors.neutral400,
    fontWeight: "normal",
    marginTop: spacingy._20,
  },
});
