import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Share, Alert, ActivityIndicator, RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { loadAuth } from "../lib/authStore";
import { apiGet } from "../lib/api";
import Screen from "../components/Screen";
import { useAppTheme } from "../lib/themeStore";

type Tab = "overview" | "attendance" | "performance";

type SportStat = {
  sport: string; enrolled: number;
  avgMatch: number; avgFitness: number; avgDisc: number; eligible: number;
};
type TopStudent = { name: string; sport: string; avgScore: number; squadLevel: string };
type KPI = { totalStudents: number; totalSports: number; totalSessions: number; eligibleCount: number };
type ReportData = { kpi: KPI; sportStats: SportStat[]; topStudents: TopStudent[] };

function scoreColor(v: number) {
  if (v >= 80) return "#10B981";
  if (v >= 60) return "#C9A227";
  return "#EF4444";
}

export default function AdminReports() {
  const { theme } = useAppTheme();
  const [tab, setTab]           = useState<Tab>("overview");
  const [data, setData]         = useState<ReportData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const { token, role } = await loadAuth();
      if (!token || role !== "ADMIN") { router.replace("/login"); return; }
      const result = await apiGet<ReportData>("/api/admin/reports/summary", token);
      setData(result);
    } catch { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = () => { setRefreshing(true); load(true); };

  const handleExport = async () => {
    if (!data) return;
    const lines = [
      "Sport,Enrolled,Avg Match,Avg Fitness,Avg Discipline,Eligible",
      ...data.sportStats.map(
        (s) => `${s.sport},${s.enrolled},${s.avgMatch},${s.avgFitness},${s.avgDisc},${s.eligible}`
      ),
    ].join("\n");
    try {
      await Share.share({ message: lines, title: "EKEL-Sport Report" });
    } catch {
      Alert.alert("Export failed", "Unable to share the report.");
    }
  };

  const KPI_CARDS = data ? [
    { label: "Total Students",  value: String(data.kpi.totalStudents),  sub: "Registered",       color: "#C9A227" },
    { label: "Active Sports",   value: String(data.kpi.totalSports),    sub: "Modules running",  color: "#10B981" },
    { label: "Sessions Held",   value: String(data.kpi.totalSessions),  sub: "QR sessions",      color: "#6366F1" },
    { label: "Colors Eligible", value: String(data.kpi.eligibleCount),  sub: "Pool + Squad",     color: "#F59E0B" },
  ] : [];

  return (
    <Screen>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#F9FAFB" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Reports & Analytics</Text>
          <Text style={styles.headerSub}>Live data · Academic Year 2025/26</Text>
        </View>
        <Pressable onPress={handleExport} style={styles.exportBtn} hitSlop={10}>
          <Ionicons name="share-outline" size={19} color="#C9A227" />
        </Pressable>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabRow}>
        {(["overview", "attendance", "performance"] as Tab[]).map((t) => (
          <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "overview" ? "Overview" : t === "attendance" ? "Attendance" : "Performance"}
            </Text>
          </Pressable>
        ))}
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.textMuted, marginTop: 12, fontWeight: "600" }}>Loading live data...</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A227" colors={["#C9A227"]} />}
        >

          {/* ══ OVERVIEW ══ */}
          {tab === "overview" && (
            <>
              {/* KPI grid */}
              <View style={styles.kpiGrid}>
                {KPI_CARDS.map((k) => (
                  <View key={k.label} style={[styles.kpiCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                    <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
                    <Text style={[styles.kpiLabel, { color: theme.text }]}>{k.label}</Text>
                    <Text style={[styles.kpiSub, { color: theme.textMuted }]}>{k.sub}</Text>
                  </View>
                ))}
              </View>

              {/* Enrollment by sport */}
              {data && data.sportStats.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Enrollment by Sport</Text>
                  {data.sportStats.map((s) => (
                    <View key={s.sport} style={styles.enrollRow}>
                      <Text style={[styles.enrollSport, { color: theme.textSub }]}>{s.sport}</Text>
                      <View style={[styles.enrollBarBg, { backgroundColor: theme.bgInput }]}>
                        <View style={[styles.enrollBarFill, { width: `${Math.min(100, (s.enrolled / Math.max(...data.sportStats.map((x) => x.enrolled), 1)) * 100)}%` as any }]} />
                      </View>
                      <Text style={[styles.enrollCount, { color: theme.text }]}>{s.enrolled}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Top performers */}
              {data && data.topStudents.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Top Performers</Text>
                  <View style={[styles.table, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                    <View style={[styles.tableRow, styles.tableHead, { backgroundColor: theme.bgInput }]}>
                      <Text style={[styles.tableCell, styles.tableHeadText, { flex: 2, color: theme.textMuted }]}>Student</Text>
                      <Text style={[styles.tableCell, styles.tableHeadText, { color: theme.textMuted }]}>Sport</Text>
                      <Text style={[styles.tableCell, styles.tableHeadText, { textAlign: "right", color: theme.textMuted }]}>Score</Text>
                    </View>
                    {data.topStudents.slice(0, 8).map((s, i) => (
                      <View key={i} style={[styles.tableRow, i < data.topStudents.length - 1 && styles.tableRowBorder, { borderTopColor: theme.border }]}>
                        <Text style={[styles.tableCell, styles.tableName, { flex: 2, color: theme.text }]}>{s.name}</Text>
                        <Text style={[styles.tableCell, styles.tableSport, { color: theme.textSub }]}>{s.sport}</Text>
                        <Text style={[styles.tableCell, { textAlign: "right", color: scoreColor(s.avgScore), fontWeight: "900", fontSize: 14 }]}>
                          {s.avgScore > 0 ? `${s.avgScore}` : "—"}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {data && data.sportStats.length === 0 && (
                <View style={{ alignItems: "center", paddingVertical: 60 }}>
                  <Ionicons name="bar-chart-outline" size={48} color={theme.border} />
                  <Text style={{ color: theme.textSub, marginTop: 12, fontWeight: "700", fontSize: 15 }}>No data yet</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 13, marginTop: 4 }}>Add students, sports, and performance entries to see reports.</Text>
                </View>
              )}
            </>
          )}

          {/* ══ ATTENDANCE by sport ══ */}
          {tab === "attendance" && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Enrollment & Eligibility</Text>
                <Text style={styles.sectionSub}>Students per sport · Pool + Squad = Eligible</Text>
                {data && data.sportStats.length > 0 ? (
                  data.sportStats.map((s, i) => {
                    const rate = s.enrolled > 0 ? Math.round((s.eligible / s.enrolled) * 100) : 0;
                    return (
                      <View key={s.sport} style={styles.attendCard}>
                        <View style={styles.attendCardHeader}>
                          <Text style={styles.attendSportName}>{s.sport}</Text>
                          <Text style={styles.attendEnrolled}>{s.enrolled} enrolled</Text>
                        </View>
                        <View style={styles.attendRow}>
                          <Text style={styles.attendMonth}>Eligible</Text>
                          <View style={styles.attendBarBg}>
                            <View style={[styles.attendBarFill, { width: `${rate}%` as any, backgroundColor: scoreColor(rate) }]} />
                          </View>
                          <Text style={[styles.attendPct, { color: scoreColor(rate) }]}>{rate}%</Text>
                        </View>
                        <Text style={{ color: "#9CA3AF", fontSize: 11, fontWeight: "600", marginTop: 6 }}>
                          {s.eligible} eligible (Pool + Squad) / {s.enrolled} enrolled
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <View style={{ alignItems: "center", paddingVertical: 40 }}>
                    <Text style={{ color: "#9CA3AF", fontWeight: "600" }}>No sport data available yet.</Text>
                  </View>
                )}
              </View>
            </>
          )}

          {/* ══ PERFORMANCE ══ */}
          {tab === "performance" && (
            <>
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Average Scores by Sport</Text>
                <Text style={[styles.sectionSub, { color: theme.textMuted }]}>Match · Fitness · Discipline (from performance entries)</Text>
                {data && data.sportStats.length > 0 ? (
                  data.sportStats.map((s) => (
                    <View key={s.sport} style={[styles.perfCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                      <View style={styles.perfCardHeader}>
                        <Text style={[styles.perfSportName, { color: theme.text }]}>{s.sport}</Text>
                        <View style={styles.eligibleBadge}>
                          <Text style={styles.eligibleText}>{s.eligible} eligible</Text>
                        </View>
                      </View>
                      {[
                        { label: "Match Performance", value: s.avgMatch,   color: "#C9A227" },
                        { label: "Fitness Tests",     value: s.avgFitness, color: "#6366F1" },
                        { label: "Discipline",        value: s.avgDisc,    color: "#10B981" },
                      ].map((m) => (
                        <View key={m.label} style={styles.perfMetricRow}>
                          <Text style={[styles.perfMetricLabel, { color: theme.textSub }]}>{m.label}</Text>
                          <View style={[styles.perfBarBg, { backgroundColor: theme.bgInput }]}>
                            <View style={[styles.perfBarFill, { width: `${Math.min(100, m.value)}%` as any, backgroundColor: m.color }]} />
                          </View>
                          <Text style={[styles.perfMetricVal, { color: m.color }]}>{m.value > 0 ? m.value : "—"}</Text>
                        </View>
                      ))}
                    </View>
                  ))
                ) : (
                  <View style={{ alignItems: "center", paddingVertical: 40 }}>
                    <Text style={{ color: theme.textSub, fontWeight: "600" }}>No performance data yet. Add marks via the admin tools.</Text>
                  </View>
                )}
              </View>

              {/* Eligibility summary table */}
              {data && data.sportStats.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: theme.text }]}>Eligibility Summary</Text>
                  <View style={[styles.table, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                    <View style={[styles.tableRow, styles.tableHead, { backgroundColor: theme.bgInput }]}>
                      <Text style={[styles.tableCell, styles.tableHeadText, { flex: 1.5, color: theme.textMuted }]}>Sport</Text>
                      <Text style={[styles.tableCell, styles.tableHeadText, { textAlign: "right", color: theme.textMuted }]}>Enrolled</Text>
                      <Text style={[styles.tableCell, styles.tableHeadText, { textAlign: "right", color: theme.textMuted }]}>Eligible</Text>
                      <Text style={[styles.tableCell, styles.tableHeadText, { textAlign: "right", color: theme.textMuted }]}>Rate</Text>
                    </View>
                    {data.sportStats.map((s, i) => {
                      const rate = s.enrolled > 0 ? Math.round((s.eligible / s.enrolled) * 100) : 0;
                      return (
                        <View key={s.sport} style={[styles.tableRow, i < data.sportStats.length - 1 && styles.tableRowBorder, { borderTopColor: theme.border }]}>
                          <Text style={[styles.tableCell, styles.tableName, { flex: 1.5, color: theme.text }]}>{s.sport}</Text>
                          <Text style={[styles.tableCell, { textAlign: "right", color: theme.textSub, fontSize: 13 }]}>{s.enrolled}</Text>
                          <Text style={[styles.tableCell, { textAlign: "right", color: "#10B981", fontWeight: "800", fontSize: 13 }]}>{s.eligible}</Text>
                          <Text style={[styles.tableCell, { textAlign: "right", color: scoreColor(rate), fontWeight: "900", fontSize: 13 }]}>{rate}%</Text>
                        </View>
                      );
                    })}
                  </View>
                </View>
              )}
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 10, gap: 10 },
  backBtn: { padding: 2 },
  headerTitle: { fontSize: 20, fontWeight: "900" },
  headerSub:   { fontSize: 12, fontWeight: "600", marginTop: 2 },
  exportBtn: { borderRadius: 10, padding: 8, borderWidth: 1 },
  tabRow: { flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 4 },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: "center", borderWidth: 1 },
  tabActive: { backgroundColor: "rgba(201,162,39,0.14)", borderColor: "#C9A227" },
  tabText: { fontSize: 12, fontWeight: "700" },
  tabTextActive: { color: "#C9A227", fontSize: 12, fontWeight: "800" },
  scroll: { paddingHorizontal: 20, paddingTop: 16 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  kpiCard: { width: "47.5%", borderRadius: 14, padding: 16, borderWidth: 1, gap: 3 },
  kpiValue: { fontSize: 26, fontWeight: "900" },
  kpiLabel: { fontSize: 12, fontWeight: "700" },
  kpiSub:   { fontSize: 10, fontWeight: "600" },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "900", marginBottom: 4 },
  sectionSub:   { fontSize: 11, fontWeight: "600", marginBottom: 14 },
  enrollRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
  enrollSport: { fontSize: 13, fontWeight: "700", width: 80 },
  enrollBarBg: { flex: 1, height: 8, borderRadius: 4, overflow: "hidden" },
  enrollBarFill: { height: 8, borderRadius: 4, backgroundColor: "#C9A227" },
  enrollCount: { fontSize: 13, fontWeight: "800", width: 26, textAlign: "right" },
  table: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginTop: 10 },
  tableRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
  tableHead: {},
  tableRowBorder: { borderTopWidth: 1 },
  tableCell: { flex: 1, fontSize: 13 },
  tableHeadText: { fontSize: 11, fontWeight: "700" },
  tableName: { fontSize: 13, fontWeight: "700" },
  tableSport: { fontSize: 12, fontWeight: "600" },
  attendCard: { borderRadius: 14, padding: 16, marginTop: 12, borderWidth: 1 },
  attendCardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  attendSportName: { fontSize: 14, fontWeight: "800" },
  attendEnrolled: { fontSize: 12, fontWeight: "600" },
  attendRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  attendMonth: { fontSize: 12, fontWeight: "700", width: 50 },
  attendBarBg: { flex: 1, height: 7, borderRadius: 3, overflow: "hidden" },
  attendBarFill: { height: 7, borderRadius: 3 },
  attendPct: { fontSize: 12, fontWeight: "800", width: 36, textAlign: "right" },
  perfCard: { borderRadius: 14, padding: 16, marginTop: 12, borderWidth: 1 },
  perfCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  perfSportName: { fontSize: 14, fontWeight: "800" },
  eligibleBadge: { backgroundColor: "rgba(16,185,129,0.1)", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  eligibleText: { color: "#10B981", fontSize: 11, fontWeight: "800" },
  perfMetricRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  perfMetricLabel: { fontSize: 12, fontWeight: "600", width: 110 },
  perfBarBg: { flex: 1, height: 7, borderRadius: 3, overflow: "hidden" },
  perfBarFill: { height: 7, borderRadius: 3 },
  perfMetricVal: { fontSize: 13, fontWeight: "900", width: 28, textAlign: "right" },
});
