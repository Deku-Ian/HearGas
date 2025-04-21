import { StyleSheet, View, Image, ImageBackground } from "react-native";
import ScreenWrapper from "@/components/ScreenWrapper";
import React, { useEffect } from "react";
import { colors } from "@/constants/theme";
import { useRouter } from "expo-router";

const index = () => {
  const router = useRouter();
  useEffect(() => {
    setTimeout(() => {
      router.push("../main/welcome");
    }, 2000);
  }, []);
  return (
    <ImageBackground
      style={styles.container}
      source={require("./../assets/images/bg.png")}
    >
      <Image
        style={styles.logo}
        resizeMode="contain"
        source={require("./../assets/images/logo.png")}
      />
    </ImageBackground>
  );
};

export default index;

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    flex: 1,
    alignItems: "center",
  },
  logo: {
    height: "50%",
    aspectRatio: 1,
  },
});
