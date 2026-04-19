import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import { apiGet } from "../lib/api";
import StudentScreen from "../components/StudentScreen";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../lib/themeStore";

// ─── Types ────────────────────────────────────────────────────
interface SportAttendance {
  sport_id: number;
  sport_name: string;
  days_attended: number;
  total_sessions?: number;
}

interface SessionRecord {
  session_id: number;
  session_date: string;
  location: string;
  session_name: string | null;
  sport_name: string;
  sport_id: number;
  status: "PRESENT" | "ABSENT" | "NOT_MARKED";
  attended_at: string | null;
}

type TabKey = "summary" | "sessions";

// ─── Helpers ──────────────────────────────────────────────────
function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return d; }
}

function getAttendanceColor(pct: number) {
  if (pct >= 80) return "#10B981";
  if (pct >= 60) return "#F59E0B";
  return "#EF4444";
}

const STATUS_CFG = {
  PRESENT:    { color: "#10B981", bg: "#10B98115", border: "#10B98133", icon: "checkmark-circle"   as const, label: "Present"    },
  ABSENT:     { color: "#EF4444", bg: "#EF444415", border: "#EF444433", icon: "close-circle"        as const, label: "Absent"     },
  NOT_MARKED: { color: "#6B7280", bg: "#6B728015", border: "#6B728033", icon: "help-circle-outline" as const, label: "Not Marked" },
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function StudentAttendance() {
  const { theme } = useAppTheme();

  const [activeTab, setActiveTab] = useState<TabKey>("summary");

  // Summary tab state
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [attendanceData, setAttendanceData] = useState<SportAttendance[]>([]);
  const [error, setError]             = useState<string | null>(null);

  // Sessions tab state
  const [sessions, setSessions]         = useState<SessionRecord[]>([]);
  const [loadingSess, setLoadingSess]   = useState(false);
  const [sessionsFetched, setSessionsFetched] = useState(false);

  // ── Load summary
  const fetchSummary = useCallback(async (isRefresh = false) => {
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

  // ── Load sessions history
  const fetchSessions = useCallback(async (isRefresh = false) => {
    try {
      setLoadingSess(true);
      const { token } = await loadAuth();
      const data = await apiGet<SessionRecord[]>("/api/student/attendance/sessions", token!);
      setSessions(Array.isArray(data) ? data : []);
      setSessionsFetched(true);
    } catch {
      setSessions([]);
      setSessionsFetched(true);
    } finally {
      setLoadingSess(false);
    }
  }, []);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  // Lazy-load sessions when tab switches
  useEffect(() => {
    if (activeTab === "sessions" && !sessionsFetched) fetchSessions();
  }, [activeTab, sessionsFetched, fetchSessions]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSummary(true);
    if (activeTab === "sessions") {
      setSessionsFetched(false);
      fetchSessions();
    }
  }, [fetchSummary, fetchSessions, activeTab]);

  // ── Render ────────────────────────────────────────────────
  return (
    <StudentScreen activeRoute="/studentAttendance">
      {/* Header */}
      <AppHeader title="My Attendance" subtitle="Track your sports attendance" backRoute="/studentHome" />

      {/* Tab bar */}
      <View style={{
        flexDirection: "row", gap: 8, paddingHorizontal: 16,
        paddingVertical: 10, backgroundColor: theme.bgCard,
        borderBottomWidth: 1, borderBottomColor: theme.border,
      }}>
        {(["summary", "sessions"] as const).map((tab) => {
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              activeOpacity={0.8}
              onPress={() => setActiveTab(tab)}
              style={{
                flex: 1, paddingVertical: 9, borderRadius: 12,
                alignItems: "center", borderWidth: 1,
                backgroundColor: active ? theme.accent + "18" : theme.bgInput,
                borderColor: active ? theme.accent : theme.border,
              }}
            >
              <Text style={{
                color: active ? theme.accent : theme.textSub,
                fontSize: 13, fontWeight: active ? "800" : "600",
              }}>
                {tab === "summary" ? "📊 Summary" : "📋 Session History"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingTop: 14, paddingBottom: 32, paddingHorizontal: 14 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        {/* ══════════════ SUMMARY TAB ══════════════ */}
        {activeTab === "summary" && (
          loading && !refreshing ? (
            <View style={{ alignItems: "center", paddingTop: 60 }}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={{ color: theme.textSub, marginTop: 12, fontSize: 14 }}>
                Loading attendance data...
              </Text>
            </View>
          ) : error ? (
            <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 24 }}>
              <Ionicons name="wifi-outline" size={56} color="#EF4444" />
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", marginTop: 16, textAlign: "center" }}>
                Connection Error
              </Text>
              <Text style={{ color: theme.textSub, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
                {error}
              </Text>
              <TouchableOpacity
                style={{ marginTop: 20, backgroundColor: theme.accent, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 }}
                onPress={() => fetchSummary()}
              >
                <Text style={{ color: "#111827", fontWeight: "900", fontSize: 15 }}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : attendanceData.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 24 }}>
              <Ionicons name="calendar-outline" size={64} color={theme.border} />
              <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900", marginTop: 16 }}>
                No Attendance Yet
              </Text>
              <Text style={{ color: theme.textSub, textAlign: "center", marginTop: 8, fontSize: 14, lineHeight: 20 }}>
                Attend training sessions to see your attendance records here.
              </Text>
            </View>
          ) : (
            <>
              {/* Summary banner */}
              <View style={{
                backgroundColor: theme.accent + "18", borderRadius: 16,
                padding: 16, marginBottom: 14, borderWidth: 1, borderColor: theme.accent + "44",
              }}>
                <Text style={{ color: theme.accent, fontSize: 16, fontWeight: "900", marginBottom: 6 }}>
                  Attendance Summary
                </Text>
                <Text style={{ color: theme.textSub, fontSize: 14, lineHeight: 20 }}>
                  You have attended{" "}
                  <Text style={{ color: theme.text, fontWeight: "800" }}>
                    {attendanceData.reduce((s, x) => s + x.days_attended, 0)} days
                  </Text>{" "}
                  across{" "}
                  <Text style={{ color: theme.text, fontWeight: "800" }}>
                    {attendanceData.length} sport{attendanceData.length !== 1 ? "s" : ""}
                  </Text>
                </Text>
              </View>

              {/* Per-sport cards */}
              {attendanceData.map((sport) => {
                const pct = sport.total_sessions
                  ? Math.round((sport.days_attended / sport.total_sessions) * 100)
                  : 0;
                const color = getAttendanceColor(pct);
                return (
                  <View key={sport.sport_id} style={{
                    backgroundColor: theme.bgCard, borderRadius: 18,
                    padding: 18, marginBottom: 14, borderWidth: 1, borderColor: theme.border,
                  }}>
                    {/* Header */}
                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
                      <View style={{
                        width: 48, height: 48, borderRadius: 14,
                        backgroundColor: color + "22", alignItems: "center", justifyContent: "center",
                      }}>
                        <Ionicons name="trophy" size={24} color={color} />
                      </View>
                      <View style={{ marginLeft: 12, flex: 1 }}>
                        <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>
                          {sport.sport_name}
                        </Text>
                        <Text style={{ color: theme.textSub, fontSize: 13, marginTop: 2 }}>
                          Training attendance
                        </Text>
                      </View>
                      {/* Rate badge */}
                      {sport.total_sessions ? (
                        <View style={{
                          paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12,
                          backgroundColor: color + "22", borderWidth: 1, borderColor: color + "55",
                        }}>
                          <Text style={{ color, fontSize: 16, fontWeight: "900" }}>{pct}%</Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Stats row */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around", marginBottom: 14 }}>
                      <View style={{ alignItems: "center", flex: 1 }}>
                        <Text style={{ color: theme.text, fontSize: 24, fontWeight: "900" }}>
                          {sport.days_attended}
                        </Text>
                        <Text style={{ color: theme.textSub, fontSize: 12, marginTop: 4 }}>Sessions Attended</Text>
                      </View>
                      {sport.total_sessions ? (
                        <>
                          <View style={{ width: 1, height: 40, backgroundColor: theme.border }} />
                          <View style={{ alignItems: "center", flex: 1 }}>
                            <Text style={{ color: theme.text, fontSize: 24, fontWeight: "900" }}>
                              {sport.total_sessions}
                            </Text>
                            <Text style={{ color: theme.textSub, fontSize: 12, marginTop: 4 }}>Total Sessions</Text>
                          </View>
                          <View style={{ width: 1, height: 40, backgroundColor: theme.border }} />
                          <View style={{ alignItems: "center", flex: 1 }}>
                            <Text style={{ color, fontSize: 24, fontWeight: "900" }}>{pct}%</Text>
                            <Text style={{ color: theme.textSub, fontSize: 12, marginTop: 4 }}>Rate</Text>
                          </View>
                        </>
                      ) : null}
                    </View>

                    {/* Progress bar */}
                    {sport.total_sessions ? (
                      <View style={{ height: 8, backgroundColor: theme.border, borderRadius: 999, overflow: "hidden" }}>
                        <View style={{ width: `${pct}%` as any, height: "100%", borderRadius: 999, backgroundColor: color }} />
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </>
          )
        )}

        {/* ══════════════ SESSION HISTORY TAB ══════════════ */}
        {activeTab === "sessions" && (
          loadingSess ? (
            <View style={{ alignItems: "center", paddingTop: 60, gap: 12 }}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={{ color: theme.textSub, fontSize: 14, fontWeight: "600" }}>
                Loading session history…
              </Text>
            </View>
          ) : sessions.length === 0 ? (
            <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 24 }}>
              <Ionicons name="clipboard-outline" size={64} color={theme.border} />
              <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900", marginTop: 16 }}>
                No Sessions Yet
              </Text>
              <Text style={{ color: theme.textSub, textAlign: "center", marginTop: 8, fontSize: 14, lineHeight: 20 }}>
                Your attendance history will appear here once the admin marks sessions.
              </Text>
            </View>
          ) : (
            <>
              {/* Section label */}
              <Text style={{
                color: theme.textSub, fontSize: 11, fontWeight: "900",
                letterSpacing: 1, marginBottom: 10,
              }}>
                SESSION HISTORY ({sessions.length})
              </Text>

              {sessions.map((sess) => {
                const cfg = STATUS_CFG[sess.status] ?? STATUS_CFG.NOT_MARKED;
                return (
                  <View
                    key={sess.session_id}
                    style={{
                      backgroundColor: theme.bgCard, borderRadius: 16,
                      padding: 14, marginBottom: 10, borderWidth: 1,
                      borderColor: sess.status === "PRESENT"
                        ? "#10B98133"
                        : sess.status === "ABSENT"
                        ? "#EF444433"
                        : theme.border,
                    }}
                  >
                    {/* Top row: sport + status badge */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                      <Text style={{ color: theme.text, fontSize: 15, fontWeight: "900", flex: 1 }} numberOfLines={1}>
                        {sess.sport_name}
                        {sess.session_name ? `  ·  ${sess.session_name}` : ""}
                      </Text>
                      <View style={{
                        flexDirection: "row", alignItems: "center", gap: 4,
                        backgroundColor: cfg.bg, paddingHorizontal: 8, paddingVertical: 4,
                        borderRadius: 8, borderWidth: 1, borderColor: cfg.border, marginLeft: 8,
                      }}>
                        <Ionicons name={cfg.icon} size={12} color={cfg.color} />
                        <Text style={{ color: cfg.color, fontSize: 11, fontWeight: "800" }}>
                          {cfg.label}
                        </Text>
                      </View>
                    </View>

                    {/* Meta row: date + location */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                        <Ionicons name="calendar-outline" size={13} color={theme.textMuted} />
                        <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "600" }}>
                          {formatDate(sess.session_date)}
                        </Text>
                      </View>
                      {sess.location ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                          <Ionicons name="location-outline" size={13} color={theme.textMuted} />
                          <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "600" }}>
                            {sess.location}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </>
          )
        )}
      </ScrollView>
    </StudentScreen>
  );
}
