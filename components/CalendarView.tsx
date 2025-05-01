import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { colors, radius, spacingx, spacingy } from "@/constants/theme";
import { scale, verticalScale } from "@/utils/styling";
import Typo from "@/components/Typo";
import ModalWrapper from "@/components/ModalWrapper";

interface CalendarViewProps {
  readings: any[];
  onDayPress: (day: string, readings: any[]) => void;
}

interface DayModalProps {
  visible: boolean;
  onClose: () => void;
  day: string;
  readings: any[];
}

const DayModal = ({ visible, onClose, day, readings }: DayModalProps) => {
  if (!visible) return null;

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <View style={styles.modalOverlay}>
      <ModalWrapper style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Typo style={styles.modalTitle}>Readings for {day}</Typo>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Typo style={styles.closeButtonText}>×</Typo>
          </TouchableOpacity>
        </View>
        <View style={styles.modalBody}>
          {readings.length > 0 ? (
            readings.map((reading, index) => (
              <View key={index} style={styles.readingItem}>
                <View style={styles.readingRow}>
                  <Typo style={styles.readingLabel}>MQ2 (LPG):</Typo>
                  <Typo style={styles.readingValue}>
                    {reading.readings.mq2_value || 0}
                  </Typo>
                </View>
                <View style={styles.readingRow}>
                  <Typo style={styles.readingLabel}>MQ4 (CH4):</Typo>
                  <Typo style={styles.readingValue}>
                    {reading.readings.mq4_value || 0}
                  </Typo>
                </View>
                <View style={styles.readingRow}>
                  <Typo style={styles.readingLabel}>MQ9 (CO):</Typo>
                  <Typo style={styles.readingValue}>
                    {reading.readings.mq9_value || 0}
                  </Typo>
                </View>
                <View style={styles.readingRow}>
                  <Typo style={styles.readingLabel}>MQ135 (NH3):</Typo>
                  <Typo style={styles.readingValue}>
                    {reading.readings.mq135_value || 0}
                  </Typo>
                </View>
                <Typo style={styles.timestamp}>
                  {formatTimestamp(reading.timestamp)}
                </Typo>
              </View>
            ))
          ) : (
            <Typo style={styles.noReadings}>No readings for this day</Typo>
          )}
        </View>
      </ModalWrapper>
    </View>
  );
};

export const CalendarView = ({ readings, onDayPress }: CalendarViewProps) => {
  const [selectedDay, setSelectedDay] = React.useState<string | null>(null);
  const [modalVisible, setModalVisible] = React.useState(false);

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        date: date.toISOString().split("T")[0],
      });
    }
    return days;
  };

  const handleDayPress = (day: string) => {
    const dayReadings = readings.filter(
      (reading) =>
        new Date(reading.timestamp).toISOString().split("T")[0] === day
    );
    setSelectedDay(day);
    setModalVisible(true);
    onDayPress(day, dayReadings);
  };

  return (
    <View style={styles.container}>
      <View style={styles.calendar}>
        {getLast7Days().map(({ day, date }) => {
          const dayReadings = readings.filter(
            (reading) =>
              new Date(reading.timestamp).toISOString().split("T")[0] === date
          );
          const hasReadings = dayReadings.length > 0;
          
          return (
            <TouchableOpacity
              key={date}
              style={[
                styles.dayContainer,
                hasReadings && styles.dayWithReadings,
              ]}
              onPress={() => handleDayPress(date)}
            >
              <Typo style={styles.dayText}>{day}</Typo>
              <Typo style={styles.dateText}>
                {new Date(date).getDate()}
              </Typo>
              {hasReadings && <View style={styles.readingIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
      <DayModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        day={selectedDay || ""}
        readings={
          selectedDay
            ? readings.filter(
                (reading) =>
                  new Date(reading.timestamp).toISOString().split("T")[0] ===
                  selectedDay
              )
            : []
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacingy._20,
  },
  calendar: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.neutral700,
    borderRadius: radius._10,
    padding: spacingx._10,
  },
  dayContainer: {
    alignItems: "center",
    padding: spacingx._10,
    borderRadius: radius._10,
    width: scale(40),
  },
  dayWithReadings: {
    backgroundColor: colors.primary + "20",
  },
  dayText: {
    fontSize: verticalScale(12),
    color: colors.white,
    marginBottom: spacingy._5,
  },
  dateText: {
    fontSize: verticalScale(14),
    fontWeight: "bold",
    color: colors.white,
  },
  readingIndicator: {
    width: scale(6),
    height: scale(6),
    borderRadius: radius._6,
    backgroundColor: colors.primary,
    marginTop: spacingy._5,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    borderRadius: radius._12,
    padding: spacingx._20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingy._20,
  },
  modalTitle: {
    fontSize: verticalScale(18),
    fontWeight: "bold",
  },
  closeButton: {
    padding: spacingx._5,
  },
  closeButtonText: {
    fontSize: verticalScale(24),
    color: colors.neutral400,
  },
  modalBody: {
    maxHeight: "80%",
  },
  readingItem: {
    backgroundColor: colors.neutral700,
    borderRadius: radius._10,
    padding: spacingx._15,
    marginBottom: spacingy._10,
  },
  readingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacingy._5,
  },
  readingLabel: {
    fontSize: verticalScale(12),
    color: colors.neutral400,
  },
  readingValue: {
    fontSize: verticalScale(12),
    color: colors.white,
    fontWeight: "bold",
  },
  timestamp: {
    fontSize: verticalScale(12),
    color: colors.neutral400,
    textAlign: "right",
    marginTop: spacingy._5,
  },
  noReadings: {
    textAlign: "center",
    color: colors.neutral400,
    fontSize: verticalScale(14),
  },
}); 