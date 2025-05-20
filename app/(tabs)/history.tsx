import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator,
  RefreshControl,
  Platform,
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
import { useReadings } from "@/context/ReadingsContext";

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

// Add gas level thresholds
const GAS_THRESHOLDS = {
  LPG: { warning: 800, danger: 4000 },
  METHANE: { warning: 1701, danger: 4000 },
  CARBON_MONOXIDE: { warning: 1701, danger: 4000 },
  AMMONIA: { warning: 1701, danger: 4000 }
} as const;

type GasType = keyof typeof GAS_THRESHOLDS;

const getGasLevel = (value: number, gasType: GasType): string => {
  const thresholds = GAS_THRESHOLDS[gasType];
  if (value >= thresholds.danger) return "Danger";
  if (value >= thresholds.warning) return "Warning";
  return "Normal";
};

const getGasColor = (level: string): string => {
  switch (level) {
    case "Danger":
      return colors.rose;
    case "Warning":
      return "#FFA500"; // Orange
    default:
      return colors.green;
  }
};

const History = () => {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [chartLoading, setChartLoading] = useState(false);

  const { recentReadings } = useReadings();

  // Map recentReadings to ReadingData shape for chart and calendar
  const readingDataList: ReadingData[] = recentReadings.map((r, idx) => ({
    id: String(r.timestamp) + '-' + idx,
    timestamp: new Date(r.timestamp),
    deviceId: 'Device',
    readings: {
      mq2_value: r.mq2_value,
      mq4_value: r.mq4_value,
      mq9_value: r.mq9_value,
      mq135_value: r.mq135_value,
    },
    detectedGases: [],
    alertLevel: r.alertLevel,
  }));

  // Debug: Log readings and chartData
  useEffect(() => {
    console.log('All readings:', recentReadings);
    console.log('Chart data:', chartData);
  }, [recentReadings, chartData]);

  // Update chart data when segment changes or readings change
  useEffect(() => {
    if (activeIndex === 0) {
      getWeeklyStats();
    } else if (activeIndex === 1) {
      getMonthlyStats();
    }
  }, [activeIndex, recentReadings]);

  const processReadingsForChart = (readings: ReadingData[]) => {
    if (!readings.length) return [];

    // Date filter: only include readings from the last 7 or 30 days
    const now = new Date();
    let filteredReadings = readings;
    
    if (activeIndex === 0) { // Weekly
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filteredReadings = readings.filter(reading => {
        const readingDate = new Date(reading.timestamp);
        return readingDate >= weekAgo && readingDate <= now;
      });
    } else if (activeIndex === 1) { // Monthly
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      filteredReadings = readings.filter(reading => {
        const readingDate = new Date(reading.timestamp);
        return readingDate >= monthAgo && readingDate <= now;
      });
    }

    // Sort readings by timestamp
    filteredReadings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // Define gases and levels
    const gases: GasType[] = ["LPG", "METHANE", "CARBON_MONOXIDE", "AMMONIA"];
    const levels: Array<'Normal' | 'Warning' | 'Danger'> = ["Normal", "Warning", "Danger"];
    const levelColors: Record<'Normal' | 'Warning' | 'Danger', string> = {
      Normal: colors.green,
      Warning: "#FFA500",
      Danger: colors.rose,
    };

    // Helper to get level for a value
    const getLevel = (value: number, gas: GasType) => {
      const thresholds = GAS_THRESHOLDS[gas];
      if (value >= thresholds.danger) return "Danger";
      if (value >= thresholds.warning) return "Warning";
      return "Normal";
    };

    // Group readings by gas and level
    const maxByGasAndLevel: { [gas in GasType]?: { [level: string]: number } } = {};
    
    // Initialize the structure for all gases and levels
    gases.forEach(gas => {
      maxByGasAndLevel[gas] = {
        Normal: 0,
        Warning: 0,
        Danger: 0
      };
    });

    // Process each reading
    filteredReadings.forEach(reading => {
      const { mq2_value, mq4_value, mq9_value, mq135_value } = reading.readings;
      const values = {
        LPG: mq2_value || 0,
        METHANE: mq4_value || 0,
        CARBON_MONOXIDE: mq9_value || 0,
        AMMONIA: mq135_value || 0,
      };

      gases.forEach(gas => {
        const value = values[gas];
        const level = getLevel(value, gas);
        if (value > maxByGasAndLevel[gas]![level]) {
          maxByGasAndLevel[gas]![level] = value;
        }
      });
    });

    // Build chart data: for each gas, show all three levels
    const chartData: ChartDataItem[] = [];
    const gasLabelMap: Record<string, string> = {
      LPG: 'LPG',
      METHANE: 'METHANE',
      CARBON_MONOXIDE: 'CARBON\nMONOXIDE',
      AMMONIA: 'AMMONIA',
    };
    gases.forEach((gas, gasIdx) => {
      // Add all three levels for each gas
      levels.forEach((level, levelIdx) => {
        const value = maxByGasAndLevel[gas]?.[level] ?? 0;
        chartData.push({
          value,
          label: levelIdx === 0 ? gasLabelMap[gas] : '', // Use mapped label with line breaks
          spacing: scale(4),
          labelweight: "scale(30)",
          frontColor: levelColors[level],
        });
      });

      // Add a spacer after each gas group except the last one
      if (gasIdx < gases.length - 1) {
        chartData.push({
          value: 0,
          label: '',
          spacing: scale(40), // Keep increased spacing for readability
          labelweight: '',
          frontColor: 'transparent',
        });
      }
    });

    return chartData;
  };

  const getWeeklyStats = async () => {
    try {
      setChartLoading(true);
      // Use all readings for the graph, not just the paginated ones
      const chartData = processReadingsForChart(readingDataList);
      setChartData(chartData);
    } catch (error) {
      console.error("Failed to load weekly stats:", error);
    } finally {
      setChartLoading(false);
    }
  };

  const getMonthlyStats = async () => {
    try {
      setChartLoading(true);
      // Use all readings for the graph, not just the paginated ones
      const chartData = processReadingsForChart(readingDataList);
      setChartData(chartData);
    } catch (error) {
      console.error("Failed to load monthly stats:", error);
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
            values={["Week", "Month"]}
            selectedIndex={activeIndex}
            onChange={(event) => {
              setActiveIndex(event.nativeEvent.selectedSegmentIndex);
            }}
            tintColor={colors.primary}
            backgroundColor={colors.neutral700}
            appearance="dark"
            activeFontStyle={styles.segmentFontStyle}
            style={styles.segmentStyle}
            fontStyle={{ ...styles.segmentFontStyle, color: colors.white }}
          />
        </View>

        <View style={styles.chartContainer}>
          {chartData.length > 0 ? (
            <>
              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: colors.green }]} />
                  <Typo style={styles.legendText}>Normal</Typo>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: "#FFA500" }]} />
                  <Typo style={styles.legendText}>Warning</Typo>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: colors.rose }]} />
                  <Typo style={styles.legendText}>Danger</Typo>
                </View>
              </View>
              <BarChart
                data={chartData}
                barWidth={scale(28)}
                spacing={scale(25)}
                hideRules
                yAxisLabelPrefix=""
                yAxisThickness={0}
                xAxisThickness={0}
                yAxisLabelWidth={scale(35)}
                yAxisTextStyle={{ color: colors.neutral350 }}
                xAxisLabelTextStyle={{
                  color: colors.neutral350,
                  fontSize: verticalScale(10), // Reduce font size for full names
                  flexWrap: 'wrap',
                  textAlign: 'center',
                }}
                noOfSections={3}
                barBorderRadius={4}
                initialSpacing={scale(20)}
                endSpacing={scale(20)}
              />
            </>
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

        <CalendarView readings={readingDataList} onDayPress={handleDayPress} />
      </View>
    </ScreenWrapper>
  );
};

export default History;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacingx._20,
    gap: spacingy._10,
    flex: 1,
    backgroundColor: colors.neutra1900,
  },
  segmentControlContainer: {
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
  header: {
    paddingTop: 0,
  },
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
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacingy._10,
    gap: spacingx._20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingx._5,
  },
  legendColor: {
    width: scale(12),
    height: scale(12),
    borderRadius: radius._3,
  },
  legendText: {
    fontSize: verticalScale(12),
    color: colors.neutral350,
  },
});
