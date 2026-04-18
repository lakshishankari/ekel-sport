import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import { apiGet } from "../lib/api";
import StudentScreen from "../components/StudentScreen";
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
  const [refreshing, setRefreshing] = useState(false);
  const [attendanceData, setAttendanceData] = useState<SportAttendance[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const { token, role } = await loadAuth();
      if (!token || role !== "STUDENT") { router.replace("/login"); return; }
      const data = await apiGet<SportAttendance[]>("/api/student/attendance", token);
      setAttendanceData(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load attendance");
      setAttendanceData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAttendance(); }, [fetchAttendance]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchAttendance(true); }, [fetchAttendance]);

  const getColor = (pct: number) => pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444";

  return (
    <StudentScreen activeRoute="/studentAttendance">
      {/* Header row with scan button */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ flex: 1 }}>
          <AppHeader title="My Attendance" subtitle="Track your sports attendance" />
        </View>
        <TouchableOpacity
          onPress={() => router.push("/studentScanAttendance")}
          style={{
            marginRight: 16,
            marginTop: 4,
            width: 48,
            height: 48,
            borderRadius: 14,
            backgroundColor: theme.accent + "22",
            borderWidth: 1,
            borderColor: theme.accent + "55",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="qr-code-outline" size={26} color={theme.accent} />
        </TouchableOpacity>
      </View>
      <ScrollView
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} />}
      >
        {loading && !refreshing ? (
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={{ color: theme.textSub, marginTop: 12, fontSize: 14 }}>Loading attendance data...</Text>
          </View>
        ) : error ? (
          <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 24 }}>
            <Ionicons name="wifi-outline" size={56} color="#EF4444" />
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", marginTop: 16, textAlign: "center" }}>Connection Error</Text>
            <Text style={{ color: theme.textSub, textAlign: "center", marginTop: 8, lineHeight: 20 }}>{error}</Text>
            <TouchableOpacity
              style={{ marginTop: 20, backgroundColor: theme.btnPrimary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 }}
              onPress={() => fetchAttendance()}
            >
              <Text style={{ color: theme.btnPrimaryText, fontWeight: "900", fontSize: 15 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : attendanceData.length === 0 ? (
          <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 24 }}>
            <Ionicons name="calendar-outline" size={64} color={theme.border} />
            <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900", marginTop: 16 }}>No Attendance Yet</Text>
            <Text style={{ color: theme.textSub, textAlign: "center", marginTop: 8, fontSize: 14, lineHeight: 20 }}>
              Attend QR-scanned training sessions to see your attendance records here.
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
    </StudentScreen>
  );
}
