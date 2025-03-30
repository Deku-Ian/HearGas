import { Button } from "react-native";
import React from "react";
import { Stack, useRouter } from "expo-router";

export default function _layout() {
  const router = useRouter();
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "gray",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="main/welcome" options={{ headerShown: false }} />
      <Stack.Screen
        name="main/index"
        options={{
          headerShown: false,
          headerRight: () => (
            <Button
              title="Connect"
              onPress={() => router.push("/(modal)/pairing")}
            />
          ),
        }}
      />
      <Stack.Screen
        name="modal/pairing"
        options={{ title: "Connect to device", presentation: "modal" }}
      />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="[missing]" options={{ title: "404" }} />
    </Stack>
  );
}
