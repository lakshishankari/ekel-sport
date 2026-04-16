import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";
import { useAppTheme } from "../lib/themeStore";

export default function AdminDisplayQR() {
  const { theme } = useAppTheme();
  const sessionId = "SESSION-" + Date.now().toString().slice(-6);
  const sport = "Cricket";
  const location = "Main Ground";

  const rows = [
    { icon: "basketball-outline" as const, label: "Sport", value: sport },
    { icon: "location-outline"   as const, label: "Location", value: location },
    { icon: "time-outline"       as const, label: "Time", value: new Date().toLocaleTimeString() },
  ];

  return (
    <Screen>
      <AppHeader title="QR Code" subtitle="Students scan this code" />

      {/* QR Card */}
      <AppCard style={{ alignItems: "center", paddingVertical: 32, marginTop: 14 }}>
        <View style={{ width: 220, height: 220, backgroundColor: "white", borderRadius: 20, alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 4 }}>
          <Ionicons name="qr-code" size={190} color={theme.accent} />
        </View>
        <Text style={{ marginTop: 18, color: theme.text, fontSize: 14, fontWeight: "700" }}>Session: {sessionId}</Text>
      </AppCard>

      {/* Session Info Card */}
      <AppCard style={{ marginTop: 16 }}>
        {rows.map((r, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderBottomWidth: i < rows.length - 1 ? 1 : 0, borderBottomColor: theme.border }}>
            <Ionicons name={r.icon} size={20} color={theme.accent} />
            <Text style={{ color: theme.textSub, fontSize: 14, fontWeight: "600" }}>{r.label}:</Text>
            <Text style={{ flex: 1, color: theme.text, fontSize: 14, fontWeight: "700", textAlign: "right" }}>{r.value}</Text>
          </View>
        ))}
      </AppCard>

      {/* Hint */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 20, paddingHorizontal: 4 }}>
        <Ionicons name="information-circle-outline" size={18} color={theme.textSub} />
        <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "600" }}>Keep this screen open for students to scan</Text>
      </View>
    </Screen>
  );
}
