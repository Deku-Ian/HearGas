import { Platform, StyleSheet, Text, View } from "react-native";
import React from "react";
import { colors, spacingy } from "@/constants/theme";
import { ModalWrapperProps } from "@/types";

const isIos = Platform.OS == "ios";
const ModalWrapper = ({
  style,
  children,
  bg = colors.neutra1900,
}: ModalWrapperProps) => {
  return (
    <View style={[styles.container, { backgroundColor: bg }, style && style]}>
      {children}
    </View>
  );
};

export default ModalWrapper;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: isIos ? spacingy._15 : 50,
    paddingBottom: isIos ? spacingy._20 : 10,
  },
});
