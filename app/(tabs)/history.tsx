import {
  StyleSheet,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import React, { useEffect, useState } from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { useRouter } from "expo-router";
import { spacingy, colors, spacingx, radius } from "@/constants/theme";
import { scale, verticalScale } from "@/utils/styling";
import Header from "@/components/Header";
import { BarChart } from "react-native-gifted-charts";
import Loading from "@/components/Loading";
import { getReadingHistory } from "@/api/sensorApi";
import Typo from "@/components/Typo";

// Define types
interface ReadingData {
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

interface ChartDataItem {
  value: number;
  label: string;
  spacing: number;
  labelweight: string;
  frontColor: string;
}

const History = () => {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [chartData, setChartData] = useState([
    {
      value: 40,
      label: "Mon",
      spacing: scale(4),
      labelweight: "scale(30)",
      frontColor: colors.primary,
    },
    {
      value: 20,
      frontColor: colors.rose,
    },
    {
      value: 50,
      label: "Tue",
      spacing: scale(4),
      labelweight: "scale(30)",
      frontColor: colors.primary,
    },
    {
      value: 40,
      frontColor: colors.rose,
    },
    {
      value: 75,
      label: "Wed",
      spacing: scale(4),
      labelweight: "scale(30)",
      frontColor: colors.primary,
    },
    {
      value: 25,
      frontColor: colors.rose,
    },
    {
      value: 30,
      label: "Thu",
      spacing: scale(4),
      labelweight: "scale(30)",
      frontColor: colors.primary,
    },
    {
      value: 20,
      frontColor: colors.rose,
    },
    {
      value: 60,
      label: "Fri",
      spacing: scale(4),
      labelweight: "scale(30)",
      frontColor: colors.primary,
    },
    {
      value: 40,
      frontColor: colors.rose,
    },
    {
      value: 65,
      label: "Sat",
      spacing: scale(4),
      labelweight: "scale(30)",
      frontColor: colors.primary,
    },
    {
      value: 30,
      frontColor: colors.rose,
    },
    {
      value: 65,
      label: "Sun",
      spacing: scale(4),
      labelweight: "scale(30)",
      frontColor: colors.primary,
    },
    {
      value: 30,
      frontColor: colors.rose,
    },
  ]);
  const [chartLoading, setChartLoading] = useState(false);

  // History list state
  const [readings, setReadings] = useState<ReadingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load readings data on initial load
  useEffect(() => {
    loadReadings();
  }, []);

  // Update chart data when segment changes
  useEffect(() => {
    if (activeIndex === 0) {
      getWeeklyStats();
    } else if (activeIndex === 1) {
      getMonthlyStats();
    } else if (activeIndex === 2) {
      getYearlyStats();
    }
  }, [activeIndex]);

  const loadReadings = async () => {
    try {
      setLoading(true);
      const data = await getReadingHistory();
      const formattedData = data.map((item: any) => ({
        id: item.id || Math.random().toString(),
        timestamp: new Date(item.timestamp),
        deviceId: item.deviceId || "Unknown Device",
        readings: item.readings || {},
        detectedGases: item.detectedGases || [],
        alertLevel: item.alertLevel || "Low",
      }));
      setReadings(formattedData);
    } catch (error) {
      console.error("Failed to load readings:", error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReadings();
    setRefreshing(false);
  };

  const getWeeklyStats = async () => {
    try {
      setChartLoading(true);
      // Get weekly stats from API
      // For now using the default chart data
    } catch (error) {
      console.error("Failed to load weekly stats:", error);
    } finally {
      setChartLoading(false);
    }
  };

  const getMonthlyStats = async () => {
    try {
      setChartLoading(true);
      // Get monthly stats from API
      // For now using the default chart data
    } catch (error) {
      console.error("Failed to load monthly stats:", error);
    } finally {
      setChartLoading(false);
    }
  };

  const getYearlyStats = async () => {
    try {
      setChartLoading(true);
      // Get yearly stats from API
      // For now using the default chart data
    } catch (error) {
      console.error("Failed to load yearly stats:", error);
    } finally {
      setChartLoading(false);
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const renderItem = ({ item }: { item: ReadingData }) => (
    <View style={styles.card}>
      <View style={styles.readingContainer}>
        <View style={styles.readingRow}>
          <Typo style={styles.readingLabel}>MQ2 (LPG):</Typo>
          <Typo style={styles.readingValue}>
            {item.readings.mq2_value || 0}
          </Typo>
        </View>
        <View style={styles.readingRow}>
          <Typo style={styles.readingLabel}>MQ4 (CH4):</Typo>
          <Typo style={styles.readingValue}>
            {item.readings.mq4_value || 0}
          </Typo>
        </View>
        <View style={styles.readingRow}>
          <Typo style={styles.readingLabel}>MQ9 (CO):</Typo>
          <Typo style={styles.readingValue}>
            {item.readings.mq9_value || 0}
          </Typo>
        </View>
        <View style={styles.readingRow}>
          <Typo style={styles.readingLabel}>MQ135 (NH3):</Typo>
          <Typo style={styles.readingValue}>
            {item.readings.mq135_value || 0}
          </Typo>
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

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Header title="History" />
        </View>

        <View style={styles.segmentControlContainer}>
          <SegmentedControl
            values={["Weekly", "Monthly", "Yearly"]}
            selectedIndex={activeIndex}
            onChange={(event) => {
              setActiveIndex(event.nativeEvent.selectedSegmentIndex);
            }}
            tintColor={colors.neutral200}
            backgroundColor={colors.neutral700}
            appearance="dark"
            activeFontStyle={styles.segmentFontStyle}
            style={styles.segmentStyle}
            fontStyle={{ ...styles.segmentFontStyle, color: colors.white }}
          />
        </View>

        <View style={styles.chartContainer}>
          {chartData.length > 0 ? (
            <BarChart
              data={chartData}
              barWidth={scale(12)}
              spacing={[1, 2].includes(activeIndex) ? scale(25) : scale(16)}
              roundedTop
              roundedBottom
              hideRules
              yAxisLabelPrefix=""
              yAxisThickness={0}
              xAxisThickness={0}
              yAxisLabelWidth={
                [1, 2].includes(activeIndex) ? scale(38) : scale(35)
              }
              yAxisTextStyle={{ color: colors.neutral350 }}
              xAxisLabelTextStyle={{
                color: colors.neutral350,
                fontSize: verticalScale(12),
              }}
              noOfSections={4}
              minHeight={5}
            />
          ) : (
            <View style={styles.noChart} />
          )}

          {chartLoading && (
            <View style={styles.chartLoadingContainer}>
              <Loading color={colors.white} />
            </View>
          )}
        </View>

        <Typo style={styles.historyTitle}>Previous Readings</Typo>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={colors.primary} />
        ) : (
          <FlatList
            data={readings}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            style={styles.list}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={
              <Text style={styles.emptyText}>No readings found</Text>
            }
            ListHeaderComponent={<View style={{ height: 10 }} />}
          />
        )}
      </View>
    </ScreenWrapper>
  );
};

export default History;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacingx._20,
    paddingVertical: spacingy._5,
    gap: spacingy._10,
    flex: 1,
    backgroundColor: colors.neutra1900,
  },
  segmentControlContainer: {
    marginTop: spacingy._5,
    marginBottom: spacingy._10,
  },
  listContainer: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  chartLoadingContainer: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: radius._12,
    backgroundColor: colors.neutral700,
  },
  chartContainer: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  header: {},
  segmentFontStyle: {
    fontSize: verticalScale(13),
    fontWeight: "bold",
    color: colors.white,
  },
  segmentStyle: {
    height: scale(37),
  },
  searchIcon: {
    backgroundColor: colors.neutral700,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 100,
    width: verticalScale(35),
    height: verticalScale(35),
    borderCurve: "continuous",
  },
  noChart: {
    backgroundColor: colors.neutral700,
    height: verticalScale(210),
  },
  historyTitle: {
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
    alignItems: "center",
  },
  readingLabel: {
    fontSize: verticalScale(12),
    fontWeight: "bold",
    marginRight: spacingx._10,
  },
  readingValue: {
    fontSize: verticalScale(12),
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  alertLabel: {
    fontSize: verticalScale(12),
    fontWeight: "bold",
    marginRight: spacingx._10,
  },
  timestamp: {
    fontSize: verticalScale(12),
  },
  emptyText: {
    textAlign: "center",
    marginTop: verticalScale(20),
    fontSize: verticalScale(14),
    color: colors.neutral400,
  },
});
