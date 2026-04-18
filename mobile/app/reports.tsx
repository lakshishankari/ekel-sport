import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import { apiGet } from "../lib/api";
import Screen from "../components/Screen";
import { useAppTheme } from "../lib/themeStore";

// ─── Types ────────────────────────────────────────────────────────────────────
type AttendanceStat = {
  sport_id: number;
  sport_name: string;
  days_attended: number;
  total_sessions: number;
};

type TypeEntry = {
  avg_score: number;
  entry_count: number;
  best_score: number;
  lowest_score: number;
};

type SportPerformance = {
  sport_id: number;
  sport_name: string;
  squad_level: "NONE" | "POOL" | "SQUAD";
  types: {
    MATCH?: TypeEntry;
    FITNESS?: TypeEntry;
    DISCIPLINE?: TypeEntry;
  };
};

type Tab = "overview" | "attendance" | "performance";

function scoreColor(v: number) {
  if (v >= 80) return "#10B981";
  if (v >= 60) return "#C9A227";
  return "#EF4444";
}

function squadLabel(level: string) {
  if (level === "SQUAD") return { text: "Squad 🏆", color: "#D4AF37" };
  if (level === "POOL")  return { text: "Pool ⭐",  color: "#60A5FA" };
  return { text: "Developing", color: "#9CA3AF" };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Reports() {
  const { theme } = useAppTheme();
  const [tab, setTab] = useState<Tab>("overview");

  const [attendance, setAttendance] = useState<AttendanceStat[]>([]);
  const [performance, setPerformance] = useState<SportPerformance[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const { token, role } = await loadAuth();
      if (!token) { router.replace("/login"); return; }
      if (role !== "STUDENT") { router.replace("/login"); return; }

      const [att, perf] = await Promise.all([
        apiGet<AttendanceStat[]>("/api/student/attendance", token),
        apiGet<SportPerformance[]>("/api/student/performance", token),
      ]);
      setAttendance(Array.isArray(att) ? att : []);
      setPerformance(Array.isArray(perf) ? perf : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load reports");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(true); }, [load]);

  // ── Derived stats
  const totalSports = attendance.length;
  const totalAttended = attendance.reduce((sum, a) => sum + (a.days_attended || 0), 0);
  const totalSessions = attendance.reduce((sum, a) => sum + (a.total_sessions || 0), 0);
  const overallAttendance = totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : 0;

  const allScores: number[] = [];
  performance.forEach((sp) => {
    (["MATCH", "FITNESS", "DISCIPLINE"] as const).forEach((k) => {
      const e = sp.types[k];
      if (e && e.entry_count > 0) allScores.push(e.avg_score);
    });
  });
  const overallScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : null;

  const inSquad = performance.some((s) => s.squad_level === "SQUAD" || s.squad_level === "POOL");

  const OVERVIEW_CARDS = [
    { label: "Sports Enrolled", value: String(totalSports), sub: "Approved", icon: "football-outline" as const, color: "#C9A227" },
    { label: "Sessions Attended", value: String(totalAttended), sub: `of ${totalSessions} total`, icon: "checkmark-circle-outline" as const, color: "#10B981" },
    { label: "Attendance Rate", value: totalSessions > 0 ? `${overallAttendance}%` : "—", sub: "Overall", icon: "calendar-outline" as const, color: "#6366F1" },
    { label: "Avg Score", value: overallScore != null ? String(overallScore) : "—", sub: "Across all sports", icon: "bar-chart-outline" as const, color: "#F59E0B" },
  ];

  return (
    <Screen>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>My Reports</Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSub }]}>Your personal sports statistics</Text>
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabRow}>
        {(["overview", "attendance", "performance"] as Tab[]).map((t) => (
          <Pressable key={t} style={[styles.tab, { backgroundColor: theme.bgInput, borderColor: theme.border }, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, { color: theme.textMuted }, tab === t && styles.tabTextActive]}>
              {t === "overview" ? "Overview" : t === "attendance" ? "Attendance" : "Performance"}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.textMuted, marginTop: 12, fontWeight: "600" }}>Loading your reports...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Ionicons name="wifi-outline" size={52} color="#EF4444" />
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900", marginTop: 16, textAlign: "center" }}>Connection Error</Text>
          <Text style={{ color: theme.textSub, textAlign: "center", marginTop: 8, lineHeight: 20 }}>{error}</Text>
          <TouchableOpacity style={{ marginTop: 20, backgroundColor: theme.accent, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 }} onPress={() => load()}>
            <Text style={{ color: theme.accentText, fontWeight: "900", fontSize: 15 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A227" colors={["#C9A227"]} />}
        >

          {/* ══ OVERVIEW ══ */}
          {tab === "overview" && (
            <>
              {/* KPI grid */}
              <View style={styles.grid}>
                {OVERVIEW_CARDS.map((card) => (
                  <View key={card.label} style={[styles.reportCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                    <View style={[styles.iconBox, { backgroundColor: `${card.color}20` }]}>
                      <Ionicons name={card.icon} size={22} color={card.color} />
                    </View>
                    <Text style={[styles.reportTitle, { color: theme.textSub }]}>{card.label}</Text>
                    <Text style={[styles.reportValue, { color: card.color }]}>{card.value}</Text>
                    <Text style={[styles.reportSub, { color: theme.textMuted }]}>{card.sub}</Text>
                  </View>
                ))}
              </View>

              {/* Eligibility card */}
              <View style={[styles.eligibilityCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                <View style={styles.eligibilityIconBox}>
                  <Ionicons name="trophy" size={22} color="#C9A227" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eligibilityTitle, { color: theme.text }]}>Colours Eligibility</Text>
                  <Text style={[styles.eligibilityStatus, { color: inSquad ? "#10B981" : theme.textMuted }]}>
                    {inSquad ? "✓ On Track — You're in the Squad or Pool" : "Keep Training — Work towards Pool / Squad selection"}
                  </Text>
                </View>
              </View>

              {/* Sport breakdown */}
              {attendance.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Sport Breakdown</Text>
                  {attendance.map((a) => {
                    const rate = a.total_sessions > 0 ? Math.round((a.days_attended / a.total_sessions) * 100) : 0;
                    const perf = performance.find((p) => p.sport_id === a.sport_id);
                    const sq = squadLabel(perf?.squad_level ?? "NONE");
                    return (
                      <View key={a.sport_id} style={[styles.sportCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                        <View style={styles.sportHeader}>
                          <Text style={[styles.sportName, { color: theme.text }]}>{a.sport_name}</Text>
                          <View style={[styles.squadPill, { backgroundColor: sq.color + "22" }]}>
                            <Text style={[styles.squadPillText, { color: sq.color }]}>{sq.text}</Text>
                          </View>
                        </View>
                        <View style={styles.sportStats}>
                          <View style={styles.statItem}>
                            <Ionicons name="calendar-outline" size={13} color={theme.textMuted} />
                            <Text style={[styles.statText, { color: theme.textSub }]}>{a.days_attended}/{a.total_sessions} sessions</Text>
                          </View>
                          <View style={[styles.scoreBadge, { backgroundColor: `${scoreColor(rate)}20` }]}>
                            <Text style={[styles.scoreText, { color: scoreColor(rate) }]}>{rate}%</Text>
                          </View>
                        </View>
                        <View style={[styles.progressBar, { backgroundColor: theme.bgInput }]}>
                          <View style={[styles.progressFill, { width: `${rate}%` as any, backgroundColor: scoreColor(rate) }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {attendance.length === 0 && (
                <View style={{ alignItems: "center", paddingVertical: 60 }}>
                  <Ionicons name="football-outline" size={48} color={theme.border} />
                  <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900", marginTop: 16 }}>No Sports Yet</Text>
                  <Text style={{ color: theme.textSub, fontSize: 13, textAlign: "center", marginTop: 6 }}>Enroll in a sport to start seeing your stats here.</Text>
                </View>
              )}
            </>
          )}

          {/* ══ ATTENDANCE ══ */}
          {tab === "attendance" && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Attendance by Sport</Text>
              {attendance.length > 0 ? attendance.map((a) => {
                const rate = a.total_sessions > 0 ? Math.round((a.days_attended / a.total_sessions) * 100) : 0;
                return (
                  <View key={a.sport_id} style={[styles.attendCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                    <View style={styles.attendCardHeader}>
                      <Text style={[styles.attendSportName, { color: theme.text }]}>{a.sport_name}</Text>
                      <Text style={[styles.attendEnrolled, { color: theme.textMuted }]}>{a.days_attended}/{a.total_sessions} sessions</Text>
                    </View>
                    <View style={styles.attendRow}>
                      <Text style={[styles.attendLabel, { color: theme.textSub }]}>Attended</Text>
                      <View style={[styles.attendBarBg, { backgroundColor: theme.bgInput }]}>
                        <View style={[styles.attendBarFill, { width: `${rate}%` as any, backgroundColor: scoreColor(rate) }]} />
                      </View>
                      <Text style={[styles.attendPct, { color: scoreColor(rate) }]}>{rate}%</Text>
                    </View>
                    <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "600", marginTop: 4 }}>
                      {a.days_attended} attended · {a.total_sessions} total sessions
                    </Text>
                  </View>
                );
              }) : (
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Ionicons name="calendar-outline" size={40} color={theme.border} />
                  <Text style={{ color: theme.textSub, fontWeight: "600", marginTop: 12 }}>No attendance data yet.</Text>
                </View>
              )}
            </View>
          )}

          {/* ══ PERFORMANCE ══ */}
          {tab === "performance" && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Performance by Sport</Text>
              {performance.length > 0 ? performance.map((sp) => {
                const sq = squadLabel(sp.squad_level);
                const hasData = (["MATCH", "FITNESS", "DISCIPLINE"] as const).some(k => sp.types[k] && sp.types[k]!.entry_count > 0);
                return (
                  <View key={sp.sport_id} style={[styles.perfCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                    <View style={styles.perfCardHeader}>
                      <Text style={[styles.perfSportName, { color: theme.text }]}>{sp.sport_name}</Text>
                      <View style={[styles.squadPill, { backgroundColor: sq.color + "22" }]}>
                        <Text style={[styles.squadPillText, { color: sq.color }]}>{sq.text}</Text>
                      </View>
                    </View>
                    {!hasData ? (
                      <Text style={{ color: theme.textSub, fontSize: 12, fontStyle: "italic" }}>No performance entries recorded yet.</Text>
                    ) : (
                      ([
                        { key: "MATCH" as const, label: "Match",     color: "#C9A227" },
                        { key: "FITNESS" as const, label: "Fitness",  color: "#6366F1" },
                        { key: "DISCIPLINE" as const, label: "Discipline", color: "#10B981" },
                      ]).map(({ key, label, color }) => {
                        const entry = sp.types[key];
                        if (!entry || entry.entry_count === 0) return null;
                        return (
                          <View key={key} style={styles.perfMetricRow}>
                            <Text style={[styles.perfMetricLabel, { color: theme.textSub }]}>{label}</Text>
                            <View style={[styles.perfBarBg, { backgroundColor: theme.bgInput }]}>
                              <View style={[styles.perfBarFill, { width: `${Math.min(100, entry.avg_score)}%` as any, backgroundColor: color }]} />
                            </View>
                            <Text style={[styles.perfMetricVal, { color }]}>{entry.avg_score > 0 ? entry.avg_score.toFixed(1) : "—"}</Text>
                          </View>
                        );
                      })
                    )}
                  </View>
                );
              }) : (
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <Ionicons name="bar-chart-outline" size={40} color={theme.border} />
                  <Text style={{ color: theme.textSub, fontWeight: "600", marginTop: 12 }}>No performance data yet.</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: "center", marginTop: 4 }}>Performance entries will appear once the admin records marks.</Text>
                </View>
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  headerTitle: { fontSize: 24, fontWeight: "900" },
  headerSubtitle: { fontSize: 13, fontWeight: "600", marginTop: 4 },

  tabRow: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginVertical: 12 },
  tab: {
    flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center",
    borderWidth: 1,
  },
  tabActive: { backgroundColor: "rgba(201,162,39,0.14)", borderColor: "#C9A227" },
  tabText:   { fontSize: 12, fontWeight: "700" },
  tabTextActive: { color: "#C9A227", fontSize: 12, fontWeight: "800" },

  scrollView: { flex: 1, paddingHorizontal: 20 },
  section: { marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: "900", marginBottom: 12 },

  // Overview KPI grid
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 14 },
  reportCard: {
    width: "47.5%",
    borderRadius: 14, padding: 16,
    borderWidth: 1,
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  reportTitle: { fontSize: 12, fontWeight: "700", marginBottom: 4 },
  reportValue: { fontSize: 24, fontWeight: "900" },
  reportSub:   { fontSize: 10, fontWeight: "600", marginTop: 2 },

  // Eligibility card
  eligibilityCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 14,
    padding: 16, borderWidth: 1, marginBottom: 14,
  },
  eligibilityIconBox: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "rgba(201,162,39,0.14)",
    alignItems: "center", justifyContent: "center",
  },
  eligibilityTitle:  { fontSize: 14, fontWeight: "800", marginBottom: 4 },
  eligibilityStatus: { fontSize: 12, fontWeight: "600", lineHeight: 17 },

  // Sport card
  sportCard: {
    borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1,
  },
  sportHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  sportName: { fontSize: 15, fontWeight: "800" },
  squadPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  squadPillText: { fontSize: 11, fontWeight: "800" },
  sportStats: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { fontSize: 12, fontWeight: "600" },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  scoreText: { fontSize: 12, fontWeight: "900" },
  progressBar: { width: "100%", height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },

  // Attendance
  attendCard: {
    borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1,
  },
  attendCardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  attendSportName: { fontSize: 14, fontWeight: "800" },
  attendEnrolled: { fontSize: 12, fontWeight: "600" },
  attendRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  attendLabel: { fontSize: 12, fontWeight: "700", width: 56 },
  attendBarBg: { flex: 1, height: 7, borderRadius: 3, overflow: "hidden" },
  attendBarFill: { height: 7, borderRadius: 3 },
  attendPct: { fontSize: 12, fontWeight: "800", width: 36, textAlign: "right" },

  // Performance
  perfCard: {
    borderRadius: 14, padding: 16,
    marginBottom: 12, borderWidth: 1,
  },
  perfCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  perfSportName: { fontSize: 14, fontWeight: "800" },
  perfMetricRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  perfMetricLabel: { fontSize: 12, fontWeight: "600", width: 70 },
  perfBarBg: { flex: 1, height: 7, borderRadius: 3, overflow: "hidden" },
  perfBarFill: { height: 7, borderRadius: 3 },
  perfMetricVal: { fontSize: 13, fontWeight: "900", width: 36, textAlign: "right" },
});
