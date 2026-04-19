import React from "react";
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAppTheme } from "../lib/themeStore";

type Props = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  /** Fallback route when there is no stack to go back to (e.g. reached via router.replace) */
  backRoute?: string;
  rightSlot?: React.ReactNode;
};

export default function AppHeader({ title, subtitle, showBack = true, backRoute, rightSlot }: Props) {
  const router = useRouter();
  const { theme } = useAppTheme();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else if (backRoute) {
      router.replace(backRoute as any);
    }
  };

  return (
    <View style={{ paddingTop: 6, paddingBottom: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
          {showBack ? (
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                {
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  alignItems: "center" as const,
                  justifyContent: "center" as const,
                  backgroundColor: theme.bgInput,
                  borderWidth: 1,
                  borderColor: theme.border,
                },
                pressed && { opacity: 0.7 },
              ]}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={22} color={theme.text} />
            </Pressable>
          ) : (
            <View style={{ width: 38 }} />
          )}

          <View style={{ flexShrink: 1 }}>
            <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900", letterSpacing: 0.2 }} numberOfLines={1}>
              {title}
            </Text>
            {!!subtitle && (
              <Text style={{ marginTop: 2, color: theme.textSub, fontSize: 13, lineHeight: 18, fontWeight: "600" }} numberOfLines={2}>
                {subtitle}
              </Text>
            )}
          </View>
        </View>

        <View>{rightSlot}</View>
      </View>
    </View>
  );
}
