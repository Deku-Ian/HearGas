import { StyleSheet, Text, View, Image } from "react-native";
import React, { useEffect } from "react";
import { router, useRouter } from "expo-router";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingx, spacingy } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import Button from "@/components/Button";
import Animated, { FadeIn } from "react-native-reanimated";

const welcome = () => {
  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.container}>
        <Animated.Image
          entering={FadeIn.duration(1000)}
          style={styles.welcomeImage}
          resizeMode="contain"
          source={require("@/assets/images/logo.png")}
        />
      </View>
      {/* footer */}
      <View style={styles.footer}>
        <View style={{ alignItems: "center" }}>
          <Typo size={30} fontweight={"800"}>
            HearGas
          </Typo>
          <Typo size={30} fontweight={"800"}>
            Air Quality Monitor
          </Typo>
        </View>
        <View style={{ alignItems: "center", gap: 2 }}>
          <Typo size={17} color={colors.textLight}>
            Be aware of the air you breathe
          </Typo>
          <Typo size={17} color={colors.textLight}>
            and protect your health
          </Typo>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            onPress={() => {
              router.push("/main");
            }}
          >
            <Typo>Login</Typo>
          </Button>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: spacingy._7,
  },

  welcomeImage: {
    width: "100%",
    height: verticalScale(300),
    alignSelf: "center",
    marginTop: verticalScale(100),
  },

  loginButton: {
    alignSelf: "flex-end",
    marginRight: spacingx._20,
  },
  footer: {
    backgroundColor: colors.neutra1900,
    alignItems: "center",
    paddingTop: verticalScale(30),
    paddingBottom: verticalScale(45),
    gap: spacingy._20,
    shadowColor: "white",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 10,
    shadowRadius: 25,
    shadowOpacity: 0.15,
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: spacingx._25,
  },
});
