import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Platform, 
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

const Dashboard = () => {
  const [currentReading, setCurrentReading] = useState<Reading | null>(null);
  const [recentReadings, setRecentReadings] = useState<Reading[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isConnected: false,
    deviceName: null,
    lastUpdate: null,
  });
  const [currentPage, setCurrentPage] = useState(0);
  const readingsPerPage = 3;
  const [deviceId, setDeviceId] = useState<string | null>(null);

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
        setCurrentReading(reading);
        setRecentReadings((prev) => {
          const newReadings = [reading, ...prev];
          return newReadings.slice(0, 30);
        });
      } else {
        console.log("No data available from Firebase");
      }
    }, (error) => {
      console.error("Firebase listener error:", error);
    });

    return () => {
      console.log("Cleaning up Firebase listener");
      unsubscribe();
    };
  }, [deviceId, connectionStatus.isConnected]);

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

  const GasCard = ({
    gas,
    value,
    timestamp,
  }: {
    gas: string;
    value: number;
    timestamp: number;
  }) => {
    // If value is 0 or undefined, show normal state
    const { level, color } = value ? getAlertLevelAndColor(value, gas) : { level: "Normal", color: colors.green };
    return (
      <View style={[styles.gasCard, { backgroundColor: color }]}>
        <Typo style={styles.gasCardTitle}>{gas}</Typo>
        <Typo style={styles.gasCardValue}>{value || 0}</Typo>
        <Typo style={styles.gasCardTimestamp}>
          {formatTimestamp(timestamp)}
        </Typo>
        <Typo style={styles.gasCardAlert}>{level}</Typo>
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
          {currentReading ? (
            <View style={styles.gasCardsContainer}>
              <GasCard gas="LPG" value={currentReading.mq2_value} timestamp={currentReading.timestamp} />
              <GasCard gas="METHANE" value={currentReading.mq4_value} timestamp={currentReading.timestamp} />
              <GasCard gas="CARBON MONOXIDE" value={currentReading.mq9_value} timestamp={currentReading.timestamp} />
              <GasCard gas="AMMONIA" value={currentReading.mq135_value} timestamp={currentReading.timestamp} />
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
                  <GasCard
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacingx._20,
    paddingVertical: spacingy._15, 
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
    paddingTop: Platform.OS === "ios" ? spacingy._10 : spacingy._10,
  },
  headerTitle: {
    fontSize: verticalScale(20),
    fontWeight: "bold",
    marginLeft: spacingx._10,
    alignItems: "center",
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
  gasCardsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: spacingy._10,
    gap: spacingx._10,
  },
  gasCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: radius._10,
    padding: spacingx._15,
    marginBottom: spacingy._10,
    alignItems: "center",
    elevation: 2,
    shadowColor: colors.neutral700,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  gasCardTitle: {
    fontSize: verticalScale(16),
    fontWeight: "bold",
    color: colors.white,
    marginBottom: spacingy._5,
  },
  gasCardValue: {
    fontSize: verticalScale(24),
    fontWeight: "bold",
    color: colors.white,
  },
  gasCardTimestamp: {
    fontSize: verticalScale(12),
    color: colors.white,
    marginTop: spacingy._5,
  },
  gasCardAlert: {
    fontSize: verticalScale(14),
    fontWeight: "bold",
    color: colors.white,
    marginTop: spacingy._5,
  },
});
