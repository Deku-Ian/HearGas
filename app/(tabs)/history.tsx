import {
  StyleSheet,
  View,
  Text,
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
import { CalendarView } from "@/components/CalendarView";

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

  const handleDayPress = (day: string, dayReadings: ReadingData[]) => {
    // This function is called when a day is pressed in the calendar
    // The modal is handled by the CalendarView component
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
          <CalendarView readings={readings} onDayPress={handleDayPress} />
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
});
