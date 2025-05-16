import {
  Platform,
  StatusBar,
  StyleSheet,
  View,
  SafeAreaView,
} from "react-native";
import React from "react";
import { ScreenWrapperProps } from "@/types";
import { colors } from "@/constants/theme";

const ScreenWrapper = ({ style, children }: ScreenWrapperProps) => {
  return (
    <View
      style={[
        {
          flex: 1,
          backgroundColor: colors.neutra1900,
          paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
        },
        style,
      ]}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.neutra1900}
        translucent={true}
      />
      {Platform.OS === "ios" ? (
        <SafeAreaView style={{ flex: 1 }}>{children}</SafeAreaView>
      ) : (
        children
      )}
    </View>
  );
};

export default ScreenWrapper;

const styles = StyleSheet.create({});
