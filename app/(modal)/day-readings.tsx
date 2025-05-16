import React from "react";
import { StyleSheet, View, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { colors, radius, spacingx, spacingy } from "@/constants/theme";
import { scale, verticalScale } from "@/utils/styling";
import Typo from "@/components/Typo";
import ScreenWrapper from "@/components/ScreenWrapper";
import BackButton from "@/components/BackButton";

interface Reading {
  id: string;
  timestamp: Date;
  deviceId: string;
  readings: {
    mq2_value?: number;
    mq4_value?: number;
    mq9_value?: number;
    mq135_value?: number;
  };
  detectedGases?: string[];
  alertLevel: string;
}

const DayReadings = () => {
  const router = useRouter();
  const { day, readings } = useLocalSearchParams<{ day: string; readings: string }>();
  const parsedReadings: Reading[] = readings ? JSON.parse(readings) : [];

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case "Danger":
      case "Super Danger":
        return colors.rose;
      case "Warning":
        return "#FFA500";
      default:
        return colors.green;
    }
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <BackButton />
          <Typo style={styles.headerTitle}>{formatDate(day)}</Typo>
          <View style={styles.spacer} />
        </View>

        <ScrollView style={styles.content}>
          {parsedReadings.length > 0 ? (
            parsedReadings.map((reading, index) => (
              <View key={index} style={styles.readingItem}>
                <View style={styles.readingHeader}>
                  <Typo style={styles.readingTime}>
                    {formatTimestamp(reading.timestamp)}
                  </Typo>
                  <View style={[styles.alertBadge, { backgroundColor: getAlertColor(reading.alertLevel) }]}>
                    <Typo style={styles.alertText}>{reading.alertLevel}</Typo>
                  </View>
                </View>
                <View style={styles.readingGrid}>
                  <View style={styles.readingCell}>
                    <Typo style={styles.readingLabel}>LPG</Typo>
                    <Typo style={styles.readingValue}>
                      {reading.readings.mq2_value || 0}
                    </Typo>
                  </View>
                  <View style={styles.readingCell}>
                    <Typo style={styles.readingLabel}>METHANE</Typo>
                    <Typo style={styles.readingValue}>
                      {reading.readings.mq4_value || 0}
                    </Typo>
                  </View>
                  <View style={styles.readingCell}>
                    <Typo style={styles.readingLabel}>CO</Typo>
                    <Typo style={styles.readingValue}>
                      {reading.readings.mq9_value || 0}
                    </Typo>
                  </View>
                  <View style={styles.readingCell}>
                    <Typo style={styles.readingLabel}>AMMONIA</Typo>
                    <Typo style={styles.readingValue}>
                      {reading.readings.mq135_value || 0}
                    </Typo>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Typo style={styles.noReadings}>No readings for this day</Typo>
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default DayReadings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutra1900,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacingx._20,
    paddingVertical: spacingy._15,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
  },
  headerTitle: {
    fontSize: verticalScale(18),
    fontWeight: "bold",
    color: colors.white,
  },
  spacer: {
    width: scale(50),
  },
  content: {
    flex: 1,
    padding: spacingx._20,
  },
  readingItem: {
    backgroundColor: colors.neutral700,
    borderRadius: radius._10,
    padding: spacingx._15,
    marginBottom: spacingy._10,
  },
  readingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingy._10,
  },
  readingTime: {
    fontSize: verticalScale(14),
    color: colors.neutral400,
  },
  alertBadge: {
    paddingHorizontal: spacingx._10,
    paddingVertical: spacingy._5,
    borderRadius: radius._6,
  },
  alertText: {
    fontSize: verticalScale(12),
    color: colors.white,
    fontWeight: "bold",
  },
  readingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacingx._10,
  },
  readingCell: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: colors.neutral700,
    padding: spacingx._10,
    borderRadius: radius._10,
    alignItems: "center",
  },
  readingLabel: {
    fontSize: verticalScale(12),
    color: colors.neutral400,
    marginBottom: spacingy._5,
  },
  readingValue: {
    fontSize: verticalScale(16),
    color: colors.white,
    fontWeight: "bold",
  },
  noReadings: {
    textAlign: "center",
    color: colors.neutral400,
    fontSize: verticalScale(14),
  },
}); 