import { StyleSheet, Text, View } from "react-native";
import React from "react";

const Page = () => {
  return (
    <View>
      <Text style={styles.NotFound}>Not Found!!!</Text>
    </View>
  );
};

export default Page;

const styles = StyleSheet.create({
  NotFound: {
    fontSize: 20,
    textAlign: "center",
    marginTop: 20,
    alignContent: "center",
    justifyContent: "center",
  },
});
