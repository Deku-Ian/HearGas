import React, { useState, useEffect } from "react";
import {
  View,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
} from "react-native";
import ScreenWrapper from "@/components/ScreenWrapper";
import { colors, radius, spacingx, spacingy } from "@/constants/theme";
import Typo from "@/components/Typo";
import Header from "@/components/Header";
import { useRouter } from "expo-router";
import { verticalScale } from "@/utils/styling";
import AlertService from "@/services/AlertService";

const Settings = () => {
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(false);

  useEffect(() => {
    // Load initial settings
    setAlertsEnabled(AlertService.isAlertsEnabled());
    setVibrationEnabled(AlertService.isVibrationEnabled());
  }, []);

  const toggleAlerts = async () => {
    const newValue = !alertsEnabled;
    setAlertsEnabled(newValue);
    await AlertService.setAlertsEnabled(newValue);
  };

  const toggleVibration = async () => {
    const newValue = !vibrationEnabled;
    setVibrationEnabled(newValue);
    await AlertService.setVibrationEnabled(newValue);
  };

  const openPrivacyPolicy = () => {
    // Replace with your actual URL for privacy policy
    Linking.openURL("https://your-privacy-policy-link.com");
  };

  const router = useRouter();

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Header title="Settings" />
      </View>

      <View style={styles.container}>
        <View style={styles.content}>
          {/* Alerts Setting */}
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <Typo style={styles.settingLabel}>Enable Alerts</Typo>
              <Switch 
                value={alertsEnabled} 
                onValueChange={toggleAlerts}
                trackColor={{ false: colors.neutral200, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          {/* Vibration Setting */}
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <Typo style={styles.settingLabel}>Enable Vibration</Typo>
              <Switch 
                value={vibrationEnabled} 
                onValueChange={toggleVibration}
                trackColor={{ false: colors.neutral200, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>

          {/* About This App Button */}
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.push("/(modal)/about")}
          >
            <Typo style={styles.buttonText}>About This App</Typo>
          </TouchableOpacity>

          {/* Privacy Policy Button */}
          <TouchableOpacity 
            style={styles.button}
            onPress={openPrivacyPolicy}
          >
            <Typo style={styles.buttonText}>Privacy Policy</Typo>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
    padding: spacingx._20,
  },
  header: {
    paddingHorizontal: spacingx._20,
    paddingVertical: spacingy._15,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
    paddingTop: Platform.OS === "ios" ? spacingy._10 : spacingy._10,
  },
  content: {
    gap: spacingy._15,
  },
  settingCard: {
    backgroundColor: colors.neutra1900,
    borderRadius: radius._10,
    padding: spacingx._15,
    elevation: 2,
    shadowColor: colors.neutral700,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: verticalScale(16),
    color: colors.white,
  },
  button: {
    backgroundColor: colors.neutra1900,
    borderRadius: radius._10,
    padding: spacingx._15,
    alignItems: "center",
    elevation: 2,
    shadowColor: colors.neutral700,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  buttonText: {
    fontSize: verticalScale(16),
    color: colors.white,
    fontWeight: "500",
  },
});

export default Settings;
