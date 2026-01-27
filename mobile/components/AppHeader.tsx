import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

type Props = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightSlot?: React.ReactNode;
};

export default function AppHeader({ title, subtitle, showBack = true, rightSlot }: Props) {
  const router = useRouter();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.leftRow}>
          {showBack ? (
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
              hitSlop={10}
            >
              <Ionicons name="chevron-back" size={22} color="#E5E7EB" />
            </Pressable>
          ) : (
            <View style={{ width: 38 }} />
          )}

          <View style={{ flexShrink: 1 }}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            {!!subtitle && (
              <Text style={styles.subtitle} numberOfLines={2}>
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

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 6,
    paddingBottom: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  leftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  title: {
    color: "#F9FAFB",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  subtitle: {
    marginTop: 2,
    color: "rgba(229,231,235,0.75)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
  },
});
