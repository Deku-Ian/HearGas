import React from "react";
import { View, Text, StyleSheet } from "react-native";
import ScreenWrapper from "@/components/ScreenWrapper";

const Dashboard = () => {
  const mockReading = {
    gas: "Carbon Monoxide",
    level: "High",
    time: "2025-04-05 10:30 AM",
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Text style={styles.title}>Gas Detected:</Text>
        <Text style={styles.gas}>{mockReading.gas}</Text>
        <Text style={styles.level}>Level: {mockReading.level}</Text>
        <Text style={styles.time}>Time: {mockReading.time}</Text>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "bold" },
  gas: { fontSize: 24, color: "red", marginVertical: 10 },
  level: { fontSize: 18 },
  time: { fontSize: 16, color: "gray" },
});

export default Dashboard;
