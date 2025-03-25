import { View, Text, Button } from "react-native";
import React from "react";
import { useRouter } from "expo-router";

export default function Page() {
  const router = useRouter();
  return (
    <View>
      <Text>This is Dashboard</Text>
      <Button title="Back" onPress={() => router.back()} />
    </View>
  );
}
