import React, { useState } from "react";
import {
  View,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import ScreenWrapper from "@/components/ScreenWrapper";
import { colors } from "@/constants/theme";
import Typo from "@/components/Typo";
import Header from "@/components/Header";
import { useRouter } from "expo-router";

const Settings = () => {
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(false);

  const toggleAlerts = () => setAlertsEnabled(!alertsEnabled);
  const toggleVibration = () => setVibrationEnabled(!vibrationEnabled);

  const openPrivacyPolicy = () => {
    // Replace with your actual URL for privacy policy
    Linking.openURL("https://your-privacy-policy-link.com");
  };

  const router = useRouter();

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.header}>
        <Header title="Settings" />
      </View>

      {/* Alerts Setting */}
      <View style={styles.settingRow}>
        <Typo style={styles.settingLabel}>Enable Alerts</Typo>
        <Switch value={alertsEnabled} onValueChange={toggleAlerts} />
      </View>

      {/* Vibration Setting */}
      <View style={styles.settingRow}>
        <Typo style={styles.settingLabel}>Enable Vibration</Typo>
        <Switch value={vibrationEnabled} onValueChange={toggleVibration} />
      </View>

      {/* About This App Button */}
      <TouchableOpacity onPress={() => router.push("/(modal)/about")}>
        <Typo style={styles.aboutText}>About This App</Typo>
      </TouchableOpacity>

      {/* Privacy Policy Button */}
      <TouchableOpacity onPress={openPrivacyPolicy}>
        <Typo style={styles.privacyPolicyText}>Privacy Policy</Typo>
      </TouchableOpacity>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
    backgroundColor: colors.neutra1900,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  settingLabel: {
    fontSize: 18,
  },
  aboutText: {
    fontSize: 16,
    color: "#007BFF",
    marginTop: 20,
    textDecorationLine: "underline",
  },
  privacyPolicyText: {
    fontSize: 16,
    color: "#007BFF",
    marginTop: 10,
    textDecorationLine: "underline",
  },
});

export default Settings;
