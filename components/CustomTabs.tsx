import { View, Platform, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "@react-navigation/elements";
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from "@react-navigation/bottom-tabs";
import { colors, spacingy } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import { useIsFocused } from "@react-navigation/native";
import * as Icons from "phosphor-react-native";
import dashboard from "@/app/(tabs)/dashboard";

export default function CustomTabs({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const tabBarIcons: any = {
    dashboard: (IsFocused: boolean) => (
      <Icons.House
        size={verticalScale(30)}
        weight={IsFocused ? "fill" : "regular"}
        color={IsFocused ? colors.primary : colors.neutral400}
      />
    ),
    history: (IsFocused: boolean) => (
      <Icons.ClockCounterClockwise
        size={verticalScale(30)}
        weight={IsFocused ? "fill" : "regular"}
        color={IsFocused ? colors.primary : colors.neutral400}
      />
    ),
  };
  return (
    <View style={styles.tabBar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label: any =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            // href={buildHref(route.name, route.params)}
            key={route.name}
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabBarItem}
          >
            {tabBarIcons[route.name] && tabBarIcons[route.name](isFocused)}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    width: "100%",
    height: Platform.OS == "ios" ? verticalScale(73) : verticalScale(55),
    backgroundColor: colors.neutral700,
    justifyContent: "space-around",
    alignItems: "center",
    borderTopColor: colors.neutral700,
    borderTopWidth: 1,
  },
  tabBarItem: {
    marginBottom: Platform.OS == "ios" ? spacingy._10 : spacingy._5,
    justifyContent: "center",
    alignItems: "center",
  },
});
