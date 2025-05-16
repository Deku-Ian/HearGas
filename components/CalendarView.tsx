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
    <View style={styles.modalOverlay}>
      <ModalWrapper style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Typo style={styles.backButtonText}>← Back</Typo>
          </TouchableOpacity>
          <Typo style={styles.modalTitle}>{formatDate(day)}</Typo>
          <View style={styles.spacer} />
        </View>
        <View style={styles.modalBody}>
          {readings.length > 0 ? (
            readings.map((reading, index) => (
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
    backgroundColor: colors.neutral700,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingy._20,
  },
  backButton: {
    padding: spacingx._5,
  },
  backButtonText: {
    fontSize: verticalScale(16),
    color: colors.primary,
    fontWeight: "bold",
  },
  modalTitle: {
    fontSize: verticalScale(18),
    fontWeight: "bold",
    color: colors.white,
    textAlign: "center",
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
  spacer: {
    width: scale(50),
  },
}); 