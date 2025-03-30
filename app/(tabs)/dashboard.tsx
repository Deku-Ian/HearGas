import { Button, StyleSheet, Text, View } from "react-native";
import React from "react";
import { useRouter } from "expo-router";
import ScreenWrapper from "@/components/ScreenWrapper";
import Typo from "@/components/Typo";

const dashboard = () => {
  const router = useRouter();
  return (
    <ScreenWrapper>
      <Typo>dashboard</Typo>
      <Button title="Back" onPress={() => router.back()} />
    </ScreenWrapper>
  );
};

export default dashboard;

const styles = StyleSheet.create({});
