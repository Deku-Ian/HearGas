import { StyleSheet, Text } from "react-native";
import React, { Children } from "react";
import { colors } from "@/constants/theme";
import { TypoProps } from "@/types";
import { verticalScale } from "@/utils/styling";

const Typo = ({
  size,
  color = colors.text,
  fontweight = "400",
  children,
  style,
  textProps = {},
}: TypoProps) => {
  const textStyles = {
    fontSize: size ? verticalScale(size) : verticalScale(18),
    color,
    fontWeight: fontweight,
  };
  return (
    <Text style={[textStyles, style]} {...textProps}>
      {children}
    </Text>
  );
};

export default Typo;

const styles = StyleSheet.create({});
