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
            onPress={() => router.push("/modal/pairing")}
          >
            <Typo fontweight={"500"}>Connect</Typo>
          </TouchableOpacity>
        </View>
      </View>
      <View>
        <Animated.Image
          entering={FadeIn.duration(1000)}
          style={styles.welcomeImage}
          resizeMode="contain"
          source={require("@/assets/images/bluetooth.png")}
        />
      </View>

      {/* footer */}
      <View style={styles.footer}>
        <Animated.View
          entering={FadeInDown.duration(1000).springify().damping(12)}
          style={{ alignItems: "flex-start" }}
        >
          <Typo size={30} fontweight={"800"}>
            Intructions on how
          </Typo>
          <Typo size={30} fontweight={"800"}>
            to connect to device:
          </Typo>
        </Animated.View>
        <Animated.View
          entering={FadeInDown.duration(1000)
            .delay(100)
            .springify()
            .damping(12)}
          style={{ alignItems: "flex-start", gap: 2 }}
        >
          <Typo size={17} color={colors.textLight}>
            1. open the switch on the mask
          </Typo>
          <Typo size={17} color={colors.textLight}>
            2. wait for the prompt "pairing!"
          </Typo>
          <Typo size={17} color={colors.textLight}>
            3. Make sure to enabled your bluetooth
          </Typo>
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
            <Typo>Get Started</Typo>
          </Button>
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
};

export default home;

const styles = StyleSheet.create({
  container: {
    flex: 2,
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

  footer: {
    backgroundColor: colors.neutra1900,
    alignItems: "flex-start",
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
    flexDirection: "row",
    justifyContent: "space-between",
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
});
