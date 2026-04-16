import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../lib/themeStore";

export default function AdminEvents() {
  const { theme } = useAppTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: "center", alignItems: "center", padding: 24 }}>
      <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: theme.accent + "22", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
        <Ionicons name="calendar-outline" size={32} color={theme.accent} />
      </View>
      <Text style={{ color: theme.text, fontSize: 26, fontWeight: "900" }}>Events</Text>
      <Text style={{ color: theme.textSub, marginTop: 10, textAlign: "center", lineHeight: 20 }}>
        Create competitions + divisions (UI coming next)
      </Text>
      <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border }}>
        <Text style={{ color: theme.textSub, fontWeight: "700" }}>← Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}
