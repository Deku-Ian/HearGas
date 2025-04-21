import { Buffer } from "buffer";
global.Buffer = global.Buffer || Buffer;

import { Button } from "react-native";
import React from "react";
import { Stack, useRouter } from "expo-router";

export default function _layout() {
  const router = useRouter();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="main/welcome" />
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
        name="(modal)/pairing"
        options={{ presentation: "modal" }}
      />
      <Stack.Screen name="(modal)/about" options={{ presentation: "modal" }} />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="[missing]" options={{ title: "404" }} />
    </Stack>
  );
}
