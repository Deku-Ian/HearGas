import React from "react";
import { View, ScrollView, StyleSheet, Platform } from "react-native";
import ScreenWrapper from "@/components/ScreenWrapper";
import { colors, radius, spacingx, spacingy } from "@/constants/theme";
import Typo from "@/components/Typo";
import Header from "@/components/Header";
import { verticalScale } from "@/utils/styling";

const About = () => {
  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <Header title="About HearGas" />
      </View>

      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.section}>
            <Typo style={styles.title}>What is HearGas?</Typo>
            <Typo style={styles.text}>
              HearGas is a comprehensive gas monitoring application designed to help you stay informed about the air quality in your environment. The app provides real-time monitoring of various gas levels and alerts you when dangerous conditions are detected.
            </Typo>
          </View>

          <View style={styles.section}>
            <Typo style={styles.title}>Key Features</Typo>
            <View style={styles.featureList}>
              <Typo style={styles.featureItem}>• Real-time gas level monitoring</Typo>
              <Typo style={styles.featureItem}>• Multiple gas type detection (CO, CO2, CH4, etc.)</Typo>
              <Typo style={styles.featureItem}>• Customizable alert thresholds</Typo>
              <Typo style={styles.featureItem}>• Visual and vibration notifications</Typo>
              <Typo style={styles.featureItem}>• Historical data tracking</Typo>
              <Typo style={styles.featureItem}>• User-friendly interface</Typo>
            </View>
          </View>

          <View style={styles.section}>
            <Typo style={styles.title}>Alert System</Typo>
            <Typo style={styles.text}>
              The app uses a sophisticated alert system that monitors gas levels in real-time. When gas concentrations exceed safe thresholds, you'll receive:
            </Typo>
            <View style={styles.featureList}>
              <Typo style={styles.featureItem}>• Visual notifications on your device</Typo>
              <Typo style={styles.featureItem}>• Optional vibration alerts</Typo>
              <Typo style={styles.featureItem}>• Detailed information about the detected gas</Typo>
              <Typo style={styles.featureItem}>• Current concentration levels</Typo>
            </View>
          </View>

          <View style={styles.section}>
            <Typo style={styles.title}>Safety Thresholds</Typo>
            <Typo style={styles.text}>
              The app uses industry-standard safety thresholds for different gases:
            </Typo>
            <View style={styles.featureList}>
              <Typo style={styles.featureItem}>• Carbon Monoxide (CO): Alert at 35 ppm</Typo>
              <Typo style={styles.featureItem}>• Carbon Dioxide (CO2): Alert at 1000 ppm</Typo>
              <Typo style={styles.featureItem}>• Methane (CH4): Alert at 1000 ppm</Typo>
              <Typo style={styles.featureItem}>• Hydrogen Sulfide (H2S): Alert at 10 ppm</Typo>
            </View>
          </View>

          <View style={styles.section}>
            <Typo style={styles.title}>Settings</Typo>
            <Typo style={styles.text}>
              Customize your experience through the Settings menu:
            </Typo>
            <View style={styles.featureList}>
              <Typo style={styles.featureItem}>• Enable/disable alerts</Typo>
              <Typo style={styles.featureItem}>• Toggle vibration notifications</Typo>
              <Typo style={styles.featureItem}>• Adjust notification preferences</Typo>
            </View>
          </View>

          <View style={styles.section}>
            <Typo style={styles.title}>Version Information</Typo>
            <Typo style={styles.text}>
              Current Version: 1.0.0
            </Typo>
            <Typo style={styles.text}>
              Last Updated: {new Date().toLocaleDateString()}
            </Typo>
          </View>

          <View style={styles.section}>
            <Typo style={styles.title}>Disclaimer</Typo>
            <Typo style={styles.text}>
              This app is designed to provide supplementary information about gas levels in your environment. It should not be used as the sole means of detecting dangerous gas conditions. Always follow proper safety procedures and consult with safety professionals when dealing with potentially hazardous environments.
            </Typo>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  header: {
    paddingHorizontal: spacingx._20,
    paddingVertical: spacingy._15,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral200,
    paddingTop: Platform.OS === "ios" ? spacingy._10 : spacingy._10,
  },
  content: {
    padding: spacingx._20,
  },
  section: {
    marginBottom: spacingy._20,
  },
  title: {
    fontSize: verticalScale(18),
    fontWeight: "bold",
    color: colors.white,
    marginBottom: spacingy._10,
  },
  text: {
    fontSize: verticalScale(16),
    color: colors.white,
    lineHeight: verticalScale(24),
    marginBottom: spacingy._10,
  },
  featureList: {
    marginLeft: spacingx._10,
  },
  featureItem: {
    fontSize: verticalScale(16),
    color: colors.white,
    marginBottom: spacingy._5,
  },
});

export default About;
