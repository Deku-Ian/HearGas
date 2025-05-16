import { StyleSheet, TouchableOpacity, View } from "react-native";
import React from "react";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { useRouter } from "expo-router";
import { colors, spacingx, spacingy } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import BackButton from "@/components/BackButton";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import Button from "@/components/Button";

const home = () => {
  const router = useRouter();
  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.buttonContainer}>
        <BackButton />
        <View style={styles.headerTitleContainer}>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push("/(modal)/pairing")}
          >
            <Typo fontweight={"500"}>Connect</Typo>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.IconContainer}>
        <View style={styles.iconGroup}>
          {/* bluetooth icon */}
          <View style={styles.iconBox}>
            <Animated.Image
              entering={FadeIn.duration(1000)}
              resizeMode="contain"
              style={[styles.icon, { tintColor: colors.white }]}
              source={require("@/assets/images/bluetooth.png")}
            />
          </View>

          {/* signal icon */}
          <View style={styles.iconBox}>
            <Animated.Image
              entering={FadeIn.duration(1000).delay(100)}
              resizeMode="contain"
              style={[styles.icon, { tintColor: colors.white }]}
              source={require("@/assets/images/signal.png")}
            />
          </View>

          {/* mask icon */}
          <View style={styles.iconBox}>
            <Animated.Image
              entering={FadeIn.duration(1000).delay(200)}
              resizeMode="contain"
              style={styles.icon}
              source={require("@/assets/images/mask.png")}
            />
          </View>
        </View>
      </View>
      <View style={styles.footer}>
        <Animated.View
          entering={FadeInDown.duration(1000).springify().damping(12)}
          style={{ alignItems: "flex-start" }}
        >
          <Typo size={24} fontweight={"800"} style={{ marginBottom: 8 }}>
            How to Connect Your Device
          </Typo>
          <View style={styles.instructionsList}>
            <Typo size={16} color={colors.textLight}>1. Turn on the switch on your mask device.</Typo>
            <Typo size={16} color={colors.textLight}>2. Wait for the prompt: <Typo fontweight={"700"} color={colors.primary}>“Pairing!”</Typo></Typo>
            <Typo size={16} color={colors.textLight}>3. Tap <Typo fontweight={"700"} color={colors.primary}>Connect</Typo> above to pair your device.</Typo>
            <Typo size={16} color={colors.textLight}>4. Once connected, tap <Typo fontweight={"700"} color={colors.primary}>Go to dashboard</Typo> to monitor readings.</Typo>
          </View>
        </Animated.View>
        <Animated.View
          entering={FadeInDown.duration(1000)
            .delay(200)
            .springify()
            .damping(12)}
          style={styles.buttonContainer}
        >
          <Button
            onPress={() => {
              router.push("../(tabs)/dashboard");
            }}
          >
            <Typo>Go to dashboard</Typo>
          </Button>
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
};

export default home;

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

  gotohome: {
    alignItems: "center",
    justifyContent: "flex-end",
  },
  IconContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacingy._5,
    marginTop: spacingy._5,
  },
  iconGroup: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: colors.neutral700,
    borderRadius: 16,
    padding: spacingx._15,

    width: "100%",
  },
  iconBox: {
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
  },
  icon: {
    width: 80,
    height: 80,
  },

  footer: {
    backgroundColor: colors.neutra1900,
    alignItems: "flex-start",
    paddingTop: verticalScale(30),
    paddingBottom: verticalScale(45),
    gap: spacingy._20,
    shadowColor: "white",
    shadowOffset: { width: 0, height: 4 },
    elevation: 10,
    shadowRadius: 25,
    shadowOpacity: 0.15,
  },
  buttonContainer: {
    width: "100%",
    paddingHorizontal: spacingx._25,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: spacingy._35,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  loginButton: {
    marginRight: spacingx._10,
    padding: 5,
  },
  instructionsList: {
    gap: 4,
    marginBottom: 12,
  },
});
