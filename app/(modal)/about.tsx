import { StyleSheet, Text, View } from "react-native";
import React from "react";
import ModalWrapper from "@/components/ModalWrapper";
import Typo from "@/components/Typo";
import Header from "@/components/Header";
import { colors, spacingx, spacingy } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import BackButton from "@/components/BackButton";

const about = () => {
  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title="About This App"
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingy._10 }}
        />

        <View style={styles.devicesContainer}>
          <Typo color={colors.neutra1300}>info</Typo>
        </View>
      </View>
    </ModalWrapper>
  );
};

export default about;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacingy._7,
  },

  devicesContainer: {
    marginTop: spacingy._15,
  },
});
