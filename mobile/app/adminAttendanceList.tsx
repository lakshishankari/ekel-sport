import React from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";
import { useAppTheme } from "../lib/themeStore";

type AttendanceSession = { id: string; sport: string; date: string; location: string; attendees: number; total: number };

const MOCK: AttendanceSession[] = [
  { id: "1", sport: "Cricket",    date: "2026-01-27", location: "Main Ground",  attendees: 18, total: 22 },
  { id: "2", sport: "Basketball", date: "2026-01-26", location: "Indoor Court", attendees: 15, total: 15 },
];

export default function AdminAttendanceList() {
  const { theme } = useAppTheme();

  const getColor = (pct: number) => pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppHeader
          title="Attendance Sessions"
          subtitle="View all sessions"
          rightSlot={
            <Pressable style={{ padding: 6 }}>
              <Ionicons name="add-circle" size={28} color={theme.accent} />
            </Pressable>
          }
        />

        <View style={{ marginTop: 14 }}>
          {MOCK.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 60 }}>
              <Ionicons name="clipboard-outline" size={48} color={theme.border} />
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "700", marginTop: 12 }}>No sessions yet</Text>
              <Text style={{ color: theme.textSub, fontSize: 14, fontWeight: "600", marginTop: 6 }}>Create a session to get started</Text>
            </View>
          ) : MOCK.map((session) => {
            const rate = Math.round((session.attendees / session.total) * 100);
            const color = getColor(rate);
            return (
              <AppCard key={session.id} style={{ marginTop: 12 }}>
                {/* Header row */}
                <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 17, fontWeight: "800" }}>{session.sport}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                      <Ionicons name="calendar-outline" size={14} color={theme.textMuted} />
                      <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "600" }}>{session.date}</Text>
                    </View>
                  </View>
                  <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: color + "22" }}>
                    <Text style={{ color, fontSize: 16, fontWeight: "900" }}>{rate}%</Text>
                  </View>
                </View>

                {/* Details */}
                <View style={{ gap: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: theme.border }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="location-outline" size={16} color={theme.textMuted} />
                    <Text style={{ color: theme.textSub, fontSize: 14, fontWeight: "600" }}>{session.location}</Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Ionicons name="people-outline" size={16} color={theme.textMuted} />
                    <Text style={{ color: theme.textSub, fontSize: 14, fontWeight: "600" }}>{session.attendees} / {session.total} students</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={{ height: 4, backgroundColor: theme.border, borderRadius: 2, overflow: "hidden", marginTop: 10, marginBottom: 2 }}>
                  <View style={{ width: `${rate}%` as any, height: "100%", borderRadius: 2, backgroundColor: color }} />
                </View>

                <Pressable style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12, padding: 10 }}>
                  <Text style={{ color: theme.accent, fontSize: 14, fontWeight: "700" }}>View Attendees</Text>
                  <Ionicons name="chevron-forward" size={16} color={theme.accent} />
                </Pressable>
              </AppCard>
            );
          })}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </Screen>
  );
}
