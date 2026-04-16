import React from "react";
import { View, ViewStyle } from "react-native";
import { useAppTheme } from "../lib/themeStore";

type Props = {
  children: React.ReactNode;
  style?: ViewStyle;
};

export default function AppCard({ children, style }: Props) {
  const { theme } = useAppTheme();
  return (
    <View
      style={[
        {
          borderRadius: 18,
          padding: 16,
          backgroundColor: theme.bgCard,
          borderWidth: 1,
          borderColor: theme.border,
          shadowColor: "#000",
          shadowOpacity: 0.15,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 6 },
          elevation: 3,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
