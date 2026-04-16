import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../lib/themeStore";

interface SportAttendance {
  sport_id: number;
  sport_name: string;
  days_attended: number;
  total_sessions?: number;
}

export default function StudentAttendance() {
  const { theme } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<SportAttendance[]>([]);

  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "STUDENT") { router.replace("/login"); return; }
      setTimeout(() => {
        setAttendanceData([
          { sport_id: 1, sport_name: "Basketball", days_attended: 12, total_sessions: 15 },
          { sport_id: 2, sport_name: "Football",   days_attended: 8,  total_sessions: 10 },
          { sport_id: 3, sport_name: "Cricket",    days_attended: 5,  total_sessions: 8  },
        ]);
        setLoading(false);
      }, 800);
    })();
  }, []);

  const getColor = (pct: number) => pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <Screen>
      <AppHeader title="My Attendance" subtitle="Track your sports attendance" />
      <ScrollView contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}>
        {loading ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={{ color: theme.textSub, marginTop: 12, fontSize: 14 }}>Loading attendance data...</Text>
          </View>
        ) : attendanceData.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 24 }}>
            <Ionicons name="calendar-outline" size={64} color={theme.border} />
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900", marginTop: 16 }}>No Attendance Records</Text>
            <Text style={{ color: theme.textSub, textAlign: "center", marginTop: 8, fontSize: 14, lineHeight: 20 }}>
              Your attendance records will appear here once you start attending sports sessions.
            </Text>
          </View>
        ) : (
          <>
            {/* Summary banner */}
            <View style={{ backgroundColor: theme.accent + "18", borderRadius: 14, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: theme.accent + "44" }}>
              <Text style={{ color: theme.accent, fontSize: 16, fontWeight: "900", marginBottom: 6 }}>Attendance Summary</Text>
              <Text style={{ color: theme.textSub, fontSize: 14, lineHeight: 20 }}>
                You have attended {attendanceData.reduce((s, x) => s + x.days_attended, 0)} days across {attendanceData.length} sports
              </Text>
            </View>

            {/* Cards */}
            {attendanceData.map((sport) => {
              const pct = sport.total_sessions ? Math.round((sport.days_attended / sport.total_sessions) * 100) : 0;
              const color = getColor(pct);
              return (
                <View key={sport.sport_id} style={{ backgroundColor: theme.bgCard, borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: theme.border }}>
                  {/* Header */}
                  <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: color + "22", alignItems: "center", justifyContent: "center" }}>
                      <Ionicons name="trophy" size={24} color={color} />
                    </View>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>{sport.sport_name}</Text>
                      <Text style={{ color: theme.textSub, fontSize: 13, marginTop: 2 }}>Track your attendance</Text>
                    </View>
                  </View>

                  {/* Stats */}
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginBottom: 16 }}>
                    <View style={{ alignItems: "center", flex: 1 }}>
                      <Text style={{ color: theme.text, fontSize: 24, fontWeight: "900" }}>{sport.days_attended}</Text>
                      <Text style={{ color: theme.textSub, fontSize: 12, marginTop: 4 }}>Days Attended</Text>
                    </View>
                    {sport.total_sessions && <>
                      <View style={{ width: 1, height: 40, backgroundColor: theme.border }} />
                      <View style={{ alignItems: "center", flex: 1 }}>
                        <Text style={{ color: theme.text, fontSize: 24, fontWeight: "900" }}>{sport.total_sessions}</Text>
                        <Text style={{ color: theme.textSub, fontSize: 12, marginTop: 4 }}>Total Sessions</Text>
                      </View>
                      <View style={{ width: 1, height: 40, backgroundColor: theme.border }} />
                      <View style={{ alignItems: "center", flex: 1 }}>
                        <Text style={{ color, fontSize: 24, fontWeight: "900" }}>{pct}%</Text>
                        <Text style={{ color: theme.textSub, fontSize: 12, marginTop: 4 }}>Attendance</Text>
                      </View>
                    </>}
                  </View>

                  {/* Progress */}
                  {sport.total_sessions && (
                    <View style={{ height: 8, backgroundColor: theme.border, borderRadius: 999, overflow: "hidden" }}>
                      <View style={{ width: `${pct}%` as any, height: "100%", borderRadius: 999, backgroundColor: color }} />
                    </View>
                  )}
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}
