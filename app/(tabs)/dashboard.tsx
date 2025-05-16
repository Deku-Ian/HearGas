import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Platform, 
  Modal,
} from "react-native";
import { colors, radius, spacingx, spacingy } from "@/constants/theme";
import ScreenWrapper from "@/components/ScreenWrapper";
import BackButton from "@/components/BackButton";
import Typo from "@/components/Typo";
import { verticalScale } from "@/utils/styling";
import { WiFiNetworkService } from "@/services/WifiNetworkService";
import { ref, get, onValue } from "firebase/database";
import { database } from "@/config/firebase";
import { ArrowBendDownLeft, ArrowBendDownRight } from "phosphor-react-native";
import { useReadings } from "@/context/ReadingsContext";
import { MaterialIcons } from '@expo/vector-icons';

interface Reading {
  mq2_value: number;
  mq4_value: number;
  mq9_value: number;
  mq135_value: number;
  timestamp: number;
  alertLevel: string;
}

interface ConnectionStatus {
  isConnected: boolean;
  deviceName: string | null;
  lastUpdate: number | null;
}

const GAS_INFO = {
  LPG: "LPG (Liquefied Petroleum Gas): Used for heating and cooking. High levels can be explosive and harmful.",
  METHANE: "Methane: A flammable gas. High concentrations can cause suffocation and explosions.",
  "CARBON MONOXIDE": "Carbon Monoxide: A colorless, odorless gas. Dangerous even at low concentrations.",
  AMMONIA: "Ammonia: Used in cleaning and agriculture. High levels are toxic to humans.",
};

const Dashboard = () => {
  const { currentReading, recentReadings, updateReadings } = useReadings();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    deviceName: null,
    lastUpdate: null,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const readingsPerPage = 3;
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [showGasInfo, setShowGasInfo] = useState<string | null>(null);
  const [localCurrentReading, setLocalCurrentReading] = useState<Reading | null>(null);
  const [pendingReadings, setPendingReadings] = useState<Reading[]>([]);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);

  // Function to check if enough time has passed since last update
  const canUpdateRecentReadings = () => {
    const now = Date.now();
    const twoMinutesInMs = 2 * 60 * 1000;
    return now - lastUpdateTime >= twoMinutesInMs;
  };

  // Function to add reading to recent readings after 10 minutes
  const scheduleReadingUpdate = (reading: Reading) => {
    console.log('Scheduling reading for update:', reading);
    console.log('Current time:', new Date().toLocaleString());
    console.log('Scheduled update time:', new Date(Date.now() + 10 * 60 * 1000).toLocaleString());
    
    setPendingReadings(prev => {
      console.log('Current pending readings:', prev);
      return [...prev, reading];
    });

    setTimeout(() => {
      console.log('Checking if can update recent readings...');
      if (canUpdateRecentReadings()) {
        console.log('Adding reading to recent readings:', reading);
        console.log('Current time:', new Date().toLocaleString());
        updateReadings(reading);
        setLastUpdateTime(Date.now());
        setPendingReadings(prev => {
          const updated = prev.filter(r => r.timestamp !== reading.timestamp);
          console.log('Updated pending readings:', updated);
          return updated;
        });
      } else {
        console.log('Not enough time passed since last update, rescheduling...');
        // Reschedule for 1 minute later
        setTimeout(() => {
          if (canUpdateRecentReadings()) {
            console.log('Adding reading to recent readings after delay:', reading);
            updateReadings(reading);
            setLastUpdateTime(Date.now());
            setPendingReadings(prev => prev.filter(r => r.timestamp !== reading.timestamp));
          }
        }, 60 * 1000); // Check again after 1 minute
      }
    }, 10 * 60 * 1000); // 10 minutes in milliseconds
  };

  useEffect(() => {
    const checkConnection = async () => {
      const status = WiFiNetworkService.getConnectionStatus();
      setConnectionStatus({
        isConnected: status.isConnected,
        deviceName: status.deviceName,
        lastUpdate: status.lastUpdate,
      });
      setDeviceId(status.deviceId);
    };

    checkConnection();
  }, []);

  useEffect(() => {
    if (!deviceId) {
      console.log("No device ID available");
      return;
    }

    if (!connectionStatus.isConnected) {
      console.log("Device not connected");
      return;
    }

    console.log("Setting up Firebase listener for device:", deviceId);
    const currentRef = ref(database, `sensors/${deviceId}/current`);
    
    const unsubscribe = onValue(currentRef, (snapshot) => {
      const data = snapshot.val();
      console.log("Received data from Firebase:", data);
      
      if (data) {
        const readings = data.readings || {};
        const reading: Reading = {
          mq2_value: readings.mq2_value || 0,
          mq4_value: readings.mq4_value || 0,
          mq9_value: readings.mq9_value || 0,
          mq135_value: readings.mq135_value || 0,
          timestamp: data.timestamp || Date.now(),
          alertLevel: data.alertLevel || "Low",
        };

        console.log("Processed reading:", reading);
        
        // Update current reading immediately
        setLocalCurrentReading(reading);
        
        // Schedule this reading to be added to recent readings after 10 minutes
        scheduleReadingUpdate(reading);

        // Update connection status with latest timestamp
        setConnectionStatus(prev => ({
          ...prev,
          lastUpdate: reading.timestamp
        }));
      } else {
        console.log("No data available from Firebase");
      }
    }, (error) => {
      console.error("Firebase listener error:", error);
    });

    // Set up an interval to check for connection status
    const connectionCheckInterval = setInterval(() => {
      const status = WiFiNetworkService.getConnectionStatus();
      setConnectionStatus(prev => ({
        ...prev,
        isConnected: status.isConnected,
        deviceName: status.deviceName
      }));
    }, 5000); // Check every 5 seconds

    return () => {
      console.log("Cleaning up Firebase listener");
      unsubscribe();
      clearInterval(connectionCheckInterval);
    };
  }, [deviceId, connectionStatus.isConnected]);

  // Add effect to monitor current reading changes
  useEffect(() => {
    console.log('Current reading updated:', localCurrentReading);
  }, [localCurrentReading]);

  // Add effect to monitor recent readings changes
  useEffect(() => {
    console.log('Recent readings updated:', recentReadings);
  }, [recentReadings]);

  // Add effect to monitor pending readings changes
  useEffect(() => {
    console.log('Pending readings updated:', pendingReadings);
  }, [pendingReadings]);

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return "No data";
    return new Date(timestamp).toLocaleString();
  };

  const paginatedReadings = recentReadings.slice(
    currentPage * readingsPerPage,
    (currentPage + 1) * readingsPerPage
  );

  const totalPages = Math.ceil(recentReadings.length / readingsPerPage);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const renderAlertColor = (level: string) => {
    const baseStyle = {
      fontSize: verticalScale(14),
      fontWeight: "bold" as const,
    };
    switch (level) {
      case "High":
        return { ...baseStyle, color: colors.rose };
      case "Medium":
        return { ...baseStyle, color: colors.primaryDark };
      case "Low":
        return { ...baseStyle, color: colors.green };
      default:
        return { ...baseStyle, color: colors.green };
    }
  };

  const renderRecentReading = ({ item }: { item: Reading }) => (
    <View style={styles.card}>
      <View style={styles.readingContainer}>
        <View style={styles.readingRow}>
          <Typo style={styles.readingLabel}>LPG:</Typo>
          <Typo style={styles.readingValue}>{item.mq2_value}</Typo>
        </View>
        <View style={styles.readingRow}>
          <Typo style={styles.readingLabel}>METHANE:</Typo>
          <Typo style={styles.readingValue}>{item.mq4_value}</Typo>
        </View>
        <View style={styles.readingRow}>
          <Typo style={styles.readingLabel}>CARBON MONOXIDE:</Typo>
          <Typo style={styles.readingValue}>{item.mq9_value}</Typo>
        </View>
        <View style={styles.readingRow}>
          <Typo style={styles.readingLabel}>AMMONIA:</Typo>
          <Typo style={styles.readingValue}>{item.mq135_value}</Typo>
        </View>
        <View style={styles.alertRow}>
          <Typo style={styles.alertLabel}>Alert Level:</Typo>
          <Typo style={renderAlertColor(item.alertLevel)}>
            {item.alertLevel}
          </Typo>
        </View>
        <Typo style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Typo>
      </View>
    </View>
  );

  // Helper to determine alert level and color for each gas type
  const getAlertLevelAndColor = (value: number, gas: string) => {
    let level = "Normal";
    let color = colors.green;

    switch (gas) {
      case "LPG":
        if (value >= 4000) {
          level = "Danger";
          color = colors.rose;
        } else if (value >= 800) {
          level = "Warning";
          color = "#FFA500"; // Orange
        }
        break;
      case "AMMONIA":
      case "METHANE":
      case "CARBON MONOXIDE":
        if (value >= 4000) {
          level = "Danger";
          color = colors.rose;
        } else if (value >= 1701) {
          level = "Warning";
          color = "#FFA500"; // Orange
        }
        break;
    }

    return { level, color };
  };

  // Modern Gas Card with Info Icon
  const GasCardModern = ({ gas, value, timestamp }: { gas: string, value: number, timestamp: number }) => {
    const { level, color } = value ? getAlertLevelAndColor(value, gas) : { level: "Normal", color: colors.green };
    return (
      <View style={[styles.gasCardModern, { backgroundColor: color }]}> 
        <View style={styles.gasCardHeader}>
          <Typo style={styles.gasCardTitleModern}>{gas}</Typo>
          <TouchableOpacity onPress={() => setShowGasInfo(gas)}>
            <MaterialIcons name="info-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
        <Typo style={styles.gasCardValueModern}>{value || 0}</Typo>
        <Typo style={styles.gasCardTimestampModern}>{formatTimestamp(timestamp)}</Typo>
        <Typo style={styles.gasCardAlertModern}>{level}</Typo>
      </View>
    );
  };

  // Helper to get the highest gas for a reading (already defined)
  const getHighestGas = (reading: Reading) => {
    const gases = [
      { gas: "LPG", value: reading.mq2_value },
      { gas: "METHANE", value: reading.mq4_value },
      { gas: "CARBON MONOXIDE", value: reading.mq9_value },
      { gas: "AMMONIA", value: reading.mq135_value },
    ];
    return gases.reduce((max, curr) => (curr.value > max.value ? curr : max), gases[0]);
  };

  // Transform paginatedReadings to show only the highest gas for each
  const paginatedHighestReadings = paginatedReadings.map((reading) => {
    const highest = getHighestGas(reading);
    return {
      gas: highest.gas,
      value: highest.value,
      timestamp: reading.timestamp,
    };
  });

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <BackButton />
        <Typo style={styles.headerTitle}>Gas Detection Dashboard</Typo>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          <View style={styles.deviceCard}>
            <View style={styles.deviceHeader}>
              <Typo style={styles.deviceTitle}>Device Status</Typo>
              <View
                style={[
                  styles.statusIndicator,
                  {
                    backgroundColor: connectionStatus.isConnected
                      ? colors.green
                      : colors.rose,
                  },
                ]}
              />
            </View>

            <View style={styles.deviceInfo}>
              <Typo style={styles.deviceLabel}>Device Name:</Typo>
              <Typo style={styles.deviceValue}>
                {connectionStatus.deviceName || "Not Connected"}
              </Typo>

              <Typo style={styles.deviceLabel}>Status:</Typo>
              <Typo style={styles.deviceValue}>
                {connectionStatus.isConnected ? "Connected" : "Disconnected"}
              </Typo>
            </View>
          </View>

          <Typo style={styles.sectionTitle}>Current Reading</Typo>
          {localCurrentReading ? (
            <View style={styles.gasGrid}>
              {["LPG", "METHANE", "CARBON MONOXIDE", "AMMONIA"].map((gas) => (
                <GasCardModern
                  key={gas}
                  gas={gas}
                  value={gas === "LPG"
                    ? localCurrentReading.mq2_value
                    : gas === "METHANE"
                    ? localCurrentReading.mq4_value
                    : gas === "CARBON MONOXIDE"
                    ? localCurrentReading.mq9_value
                    : localCurrentReading.mq135_value
                  }
                  timestamp={localCurrentReading.timestamp}
                />
              ))}
            </View>
          ) : (
            <Typo style={styles.emptyText}>
              Waiting for data from device...
            </Typo>
          )}

          <View style={styles.recentReadingsSection}>
            <View style={styles.sectionHeader}>
              <Typo style={styles.sectionTitle}>Recent Readings</Typo>
              {totalPages > 1 && (
                <View style={styles.paginationControls}>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      !currentPage && styles.disabledButton,
                    ]}
                    onPress={handlePrevPage}
                    disabled={!currentPage}
                  >
                    <ArrowBendDownLeft
                      size={24}
                      color={colors.white}
                      weight="bold"
                    />
                  </TouchableOpacity>
                  <Typo style={styles.pageInfo}>
                    {currentPage + 1} / {totalPages}
                  </Typo>
                  <TouchableOpacity
                    style={[
                      styles.paginationButton,
                      currentPage === totalPages - 1 && styles.disabledButton,
                    ]}
                    onPress={handleNextPage}
                    disabled={currentPage === totalPages - 1}
                  >
                    <ArrowBendDownRight
                      size={24}
                      color={colors.white}
                      weight="bold"
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {paginatedHighestReadings.length > 0 ? (
              <View style={styles.recentReadingsContainer}>
                {paginatedHighestReadings.map((item, index) => (
                  <GasCardModern
                    key={index}
                    gas={item.gas}
                    value={item.value}
                    timestamp={item.timestamp}
                  />
                ))}
              </View>
            ) : (
              <Typo style={styles.emptyText}>No recent readings available</Typo>
            )}
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={!!showGasInfo}
        transparent
        animationType="fade"
        onRequestClose={() => setShowGasInfo(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Typo style={styles.modalTitle}>{showGasInfo}</Typo>
            <Typo style={styles.modalBody}>
              {showGasInfo ? GAS_INFO[showGasInfo as keyof typeof GAS_INFO] : ""}
            </Typo>
            <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowGasInfo(null)}>
              <Typo style={styles.closeModalButtonText}>Close</Typo>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutra1900,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    paddingHorizontal: spacingx._20,
    paddingVertical: spacingy._5,
    gap: spacingy._10,
    paddingTop: spacingy._10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacingx._20,
    paddingVertical: spacingy._15, 
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: verticalScale(20),
    fontWeight: "bold",
    marginLeft: spacingx._25,
    alignItems: "center",
    justifyContent: "center",
  },
  recentReadingsSection: {
    marginBottom: spacingy._20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingy._10,
  },
  deviceCard: {
    backgroundColor: colors.white,
    borderRadius: radius._10,
    padding: spacingx._15,
    marginBottom: spacingy._12,
    elevation: 2,
    shadowColor: colors.neutral700,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  deviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingy._10,
  },
  deviceTitle: {
    fontSize: verticalScale(16),
    fontWeight: "bold",
    color: colors.black,
  },
  statusIndicator: {
    width: verticalScale(12),
    height: verticalScale(12),
    borderRadius: radius._6,
  },
  deviceInfo: {
    gap: spacingy._5,
  },
  deviceLabel: {
    fontSize: verticalScale(12),
    color: colors.neutral400,
  },
  deviceValue: {
    fontSize: verticalScale(14),
    color: colors.black,
    marginBottom: spacingy._5,
  },
  sectionTitle: {
    fontSize: verticalScale(18),
    fontWeight: "bold",
    marginTop: spacingy._10,
    marginBottom: spacingy._10,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius._10,
    padding: spacingx._15,
    marginBottom: spacingy._12,
    elevation: 2,
    shadowColor: colors.neutral700,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  readingContainer: {
    gap: spacingy._10,
  },
  readingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  readingLabel: {
    fontSize: verticalScale(14),
    color: colors.black,
  },
  readingValue: {
    fontSize: verticalScale(14),
    fontWeight: "bold",
    color: colors.primary,
  },
  alertRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacingy._10,
  },
  alertLabel: {
    fontSize: verticalScale(14),
    color: colors.black,
  },
  timestamp: {
    fontSize: verticalScale(12),
    color: colors.neutral400,
    marginTop: spacingy._10,
    textAlign: "right",
  },
  emptyText: {
    textAlign: "center",
    marginTop: verticalScale(20),
    fontSize: verticalScale(14),
    color: colors.neutral400,
  },
  recentReadingsContainer: {
    gap: spacingy._10,
  },
  paginationControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingx._10,
    marginTop: spacingy._5,
  },
  paginationButton: {
    padding: spacingx._10,
    backgroundColor: colors.primary,
    borderRadius: radius._6,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    backgroundColor: colors.neutral200,
  },
  pageInfo: {
    fontSize: verticalScale(14),
    color: colors.neutral400,
    fontWeight: "bold",
  },
  gasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    padding: spacingx._15,
    gap: spacingx._10,
  },
  gasCardModern: {
    flexBasis: "48%",
    backgroundColor: colors.green,
    borderRadius: radius._10,
    padding: spacingx._15,
    marginBottom: spacingy._10,
    minHeight: 140,
    justifyContent: "space-between",
    elevation: 2,
  },
  gasCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  gasCardTitleModern: {
    fontSize: verticalScale(15),
    fontWeight: "bold",
    color: "#fff",
  },
  gasCardValueModern: {
    fontSize: verticalScale(28),
    fontWeight: "bold",
    color: "#fff",
    marginVertical: 2,
  },
  gasCardTimestampModern: {
    fontSize: verticalScale(11),
    color: "#fff",
    marginBottom: 2,
  },
  gasCardAlertModern: {
    fontSize: verticalScale(13),
    fontWeight: "bold",
    color: "#fff",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 10,
    width: "80%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  modalBody: {
    fontSize: 14,
    color: "#444",
  },
  closeModalButton: {
    padding: spacingx._10,
    backgroundColor: colors.primary,
    borderRadius: radius._6,
    alignItems: "center",
    justifyContent: "center",
  },
  closeModalButtonText: {
    fontSize: verticalScale(14),
    fontWeight: "bold",
    color: "#fff",
  },
});
