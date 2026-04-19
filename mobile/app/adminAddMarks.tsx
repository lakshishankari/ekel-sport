import React, { useEffect } from "react";
import { View, Text, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";
import { useAppTheme } from "../lib/themeStore";

const MODULES = [
  { label: "Match Performance", sub: "Event → Division → Team → Player entries + placing/points", icon: "trophy-outline" as const, route: "/adminMatchPerformance", color: "#C9A227" },
  { label: "Fitness Tests",     sub: "Batch entry for participants (performance_entries)",         icon: "barbell-outline" as const, route: "/adminFitnessPerformance", color: "#10B981" },
  { label: "Discipline",        sub: "Notes/metric/value entries per student",                    icon: "shield-checkmark-outline" as const, route: "/adminDisciplinePerformance", color: "#3B82F6" },
];

export default function AdminAddMarks() {
  const { theme } = useAppTheme();

  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "ADMIN") router.replace("/login");
    })();
  }, []);

  return (
    <Screen>
      <AppHeader title="Performance Module" subtitle="Match, fitness and discipline entries per student." showBack backRoute="/adminHome" />

      {/* Attendance info card */}
      <AppCard style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center", padding: 4 }}>
          <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border }}>
            <Ionicons name="calendar-outline" size={20} color={theme.textSub} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontSize: 14, fontWeight: "900" }}>Attendance (Manual)</Text>
            <Text style={{ marginTop: 2, color: theme.textSub, fontSize: 12.5, lineHeight: 17, fontWeight: "600" }}>
              Marked per session by admin. Manage sessions from the Attendance section.
            </Text>
          </View>
        </View>
      </AppCard>

      {/* Module cards */}
      <AppCard>
        <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900", marginBottom: 10 }}>Add / Update Performance</Text>
        {MODULES.map((m) => (
          <Pressable
            key={m.route}
            style={({ pressed }) => [{ marginTop: 10, padding: 14, borderRadius: 16, backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border, flexDirection: "row", gap: 12, alignItems: "center" }, pressed && { opacity: 0.85 }]}
            onPress={() => router.push(m.route as any)}
          >
            <View style={{ width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: m.color + "22" }}>
              <Ionicons name={m.icon} size={20} color={m.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontSize: 14.5, fontWeight: "900" }}>{m.label}</Text>
              <Text style={{ marginTop: 2, color: theme.textSub, fontSize: 12.5, lineHeight: 17, fontWeight: "600" }}>{m.sub}</Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={18} color={theme.textMuted} />
          </Pressable>
        ))}
      </AppCard>
    </Screen>
  );
}
