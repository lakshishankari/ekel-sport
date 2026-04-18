import React from "react";
import { SafeAreaView, View, ViewStyle, StatusBar } from "react-native";
import { useAppTheme } from "../lib/themeStore";
import StudentBottomNav from "./StudentBottomNav";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
  activeRoute?: string;
};

export default function StudentScreen({ children, style, activeRoute }: Props) {
  const { theme, isDark } = useAppTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.bg}
      />
      <View style={[{ flex: 1, paddingHorizontal: 18, paddingTop: 12 }, style]}>
        {children}
      </View>
      <StudentBottomNav activeRoute={activeRoute} />
    </SafeAreaView>
  );
}
