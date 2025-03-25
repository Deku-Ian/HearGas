import { View, Text, Button } from "react-native";
import React from "react";
import { Link } from "expo-router";

export default function home() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 50 }}>Pair Devices</Text>
      <Link href={"/dashboard"} asChild>
        <Button title="Go to Home" />
      </Link>
    </View>
  );
}
