import { View, Text } from "react-native";
import React from "react";
import { Tabs, Stack } from "expo-router";

export default function _layout() {
  return (
    <Tabs>
      <Tabs.Screen
        name="dashboard"
        options={{
          headerTitle: "DashBoard",
          tabBarLabel: "DashBoard",
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          headerTitle: "History",
          tabBarLabel: "History",
        }}
      />
    </Tabs>
  );
}
