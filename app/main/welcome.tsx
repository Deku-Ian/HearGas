import { StyleSheet, View, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";
import { colors, spacingx, spacingy } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import Button from "@/components/Button";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";

const welcome = () => {
  const router = useRouter();
  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.container}>
        <ImageBackground
          style={styles.container}
          source={require("@/assets/images/bg.png")}
        >
          <Animated.Image
            entering={FadeIn.duration(1000)}
            style={styles.welcomeImage}
            resizeMode="contain"
            source={require("@/assets/images/welcomemask.png")}
          />
        </ImageBackground>
      </View>
      {/* footer */}
      <View style={styles.footer}>
        <Animated.View
          entering={FadeInDown.duration(1000).springify().damping(12)}
          style={{ alignItems: "center" }}
        >
          <Typo size={30} fontweight={"800"}>
            HearGas
          </Typo>
          <Typo size={30} fontweight={"800"}>
            Air Quality Monitor
          </Typo>
        </Animated.View>
        <Animated.View
          entering={FadeInDown.duration(1000)
            .delay(100)
            .springify()
            .damping(12)}
          style={{ alignItems: "center", gap: 2 }}
        >
          <Typo size={17} color={colors.textLight}>
            Be aware of the air you breathe
          </Typo>
          <Typo size={17} color={colors.textLight}>
            and protect your health
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
              router.push("/main");
            }}
          >
            <Typo>Get Started</Typo>
          </Button>
        </Animated.View>
      </View>
    </ScreenWrapper>
  );
};

export default welcome;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingTop: spacingy._5,
  },

  welcomeImage: {
    width: "100%",
    height: verticalScale(300),
    alignSelf: "center",
    marginTop: verticalScale(100),
  },

  footer: {
    backgroundColor: colors.neutra1900,
    alignItems: "center",
    paddingTop: verticalScale(30),
    paddingBottom: verticalScale(45),
    gap: spacingy._20,
    shadowColor: "black",
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
    alignItems: "center",
  },
});
