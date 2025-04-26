import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
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
    const checkConnection = () => {
      const status = WiFiNetworkService.getConnectionStatus();
      setConnectionStatus({
        isConnected: status.isConnected,
        deviceName: status.deviceName,
        lastUpdate: status.lastUpdate,
      });
      setDeviceId(status.deviceId);
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (connectionStatus.isConnected) {
      if (deviceId) {
        const deviceRef = ref(database, `sensors/${deviceId}`);

        const unsubscribe = onValue(deviceRef, (snapshot) => {
          const data = snapshot.val();

          if (data && data.current) {
            const currentData = data.current;

            if (currentData) {
              const reading: Reading = {
                mq2_value: currentData.mq2_value || 0,
                mq4_value: currentData.mq4_value || 0,
                mq9_value: currentData.mq9_value || 0,
                mq135_value: currentData.mq135_value || 0,
                timestamp: currentData.timestamp || Date.now(),
                alertLevel: currentData.alertLevel || "Low",
              };

              setCurrentReading(reading);
              setRecentReadings((prev) => {
                const newReadings = [reading, ...prev];
                return newReadings.slice(0, 30);
              });
            }
          }
        });

        return () => unsubscribe();
      }
    }
  }, [connectionStatus.isConnected, deviceId]);

  useEffect(() => {
    if (!deviceId) return;

    const currentRef = ref(database, `sensors/${deviceId}/current`);
    const unsubscribe = onValue(currentRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setCurrentReading((prev) => ({
          ...prev,
          ...data,
          timestamp: data.timestamp,
        }));
      }
    });

    return () => unsubscribe();
  }, [deviceId]);

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
            <View style={styles.card}>
              <View style={styles.readingContainer}>
                <View style={styles.readingRow}>
                  <Typo style={styles.readingLabel}>LPG:</Typo>
                  <Typo style={styles.readingValue}>
                    {currentReading.mq2_value}
                  </Typo>
                </View>
                <View style={styles.readingRow}>
                  <Typo style={styles.readingLabel}>METHANE:</Typo>
                  <Typo style={styles.readingValue}>
                    {currentReading.mq4_value}
                  </Typo>
                </View>
                <View style={styles.readingRow}>
                  <Typo style={styles.readingLabel}>CARBON MONOXIDE:</Typo>
                  <Typo style={styles.readingValue}>
                    {currentReading.mq9_value}
                  </Typo>
                </View>
                <View style={styles.readingRow}>
                  <Typo style={styles.readingLabel}>AMMONIA:</Typo>
                  <Typo style={styles.readingValue}>
                    {currentReading.mq135_value}
                  </Typo>
                </View>
                <View style={styles.alertRow}>
                  <Typo style={styles.alertLabel}>Alert Level:</Typo>
                  <Typo style={renderAlertColor(currentReading.alertLevel)}>
                    {currentReading.alertLevel}
                  </Typo>
                </View>
                <Typo style={styles.timestamp}>
                  Data collected at: {formatTimestamp(currentReading.timestamp)}
                </Typo>
              </View>
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

            {paginatedReadings.length > 0 ? (
              <View style={styles.recentReadingsContainer}>
                {paginatedReadings.map((item, index) => (
                  <View key={index} style={styles.card}>
                    <View style={styles.readingContainer}>
                      <View style={styles.readingRow}>
                        <Typo style={styles.readingLabel}>LPG:</Typo>
                        <Typo style={styles.readingValue}>
                          {item.mq2_value}
                        </Typo>
                      </View>
                      <View style={styles.readingRow}>
                        <Typo style={styles.readingLabel}>METHANE:</Typo>
                        <Typo style={styles.readingValue}>
                          {item.mq4_value}
                        </Typo>
                      </View>
                      <View style={styles.readingRow}>
                        <Typo style={styles.readingLabel}>
                          CARBON MONOXIDE:
                        </Typo>
                        <Typo style={styles.readingValue}>
                          {item.mq9_value}
                        </Typo>
                      </View>
                      <View style={styles.readingRow}>
                        <Typo style={styles.readingLabel}>AMMONIA:</Typo>
                        <Typo style={styles.readingValue}>
                          {item.mq135_value}
                        </Typo>
                      </View>
                      <View style={styles.alertRow}>
                        <Typo style={styles.alertLabel}>Alert Level:</Typo>
                        <Typo style={renderAlertColor(item.alertLevel)}>
                          {item.alertLevel}
                        </Typo>
                      </View>
                      <Typo style={styles.timestamp}>
                        {formatTimestamp(item.timestamp)}
                      </Typo>
                    </View>
                  </View>
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
});
