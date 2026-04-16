import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Share,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { loadAuth } from "../lib/authStore";
import Screen from "../components/Screen";

// ─── Types ────────────────────────────────────────────────────────────────────
type Tab = "overview" | "attendance" | "performance";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const KPI_DATA = [
  { label: "Total Students",    value: "87",  sub: "Registered",        color: "#C9A227" },
  { label: "Active Sports",     value: "3",   sub: "Modules running",   color: "#10B981" },
  { label: "Avg Attendance",    value: "81%", sub: "This semester",     color: "#6366F1" },
  { label: "Colors Eligible",   value: "54",  sub: "62% of enrolled",   color: "#F59E0B" },
];

const SPORTS_PERFORMANCE = [
  { sport: "Cricket",    enrolled: 28, avgMatch: 68, avgFitness: 72, avgAttend: 84, eligible: 18 },
  { sport: "Football",   enrolled: 31, avgMatch: 74, avgFitness: 78, avgAttend: 80, eligible: 20 },
  { sport: "Basketball", enrolled: 28, avgMatch: 71, avgFitness: 75, avgAttend: 79, eligible: 16 },
];

const ATTENDANCE_DATA = [
  { sport: "Cricket",    month: "Jan", pct: 88 },
  { sport: "Cricket",    month: "Feb", pct: 82 },
  { sport: "Cricket",    month: "Mar", pct: 84 },
  { sport: "Football",   month: "Jan", pct: 79 },
  { sport: "Football",   month: "Feb", pct: 83 },
  { sport: "Football",   month: "Mar", pct: 80 },
  { sport: "Basketball", month: "Jan", pct: 75 },
  { sport: "Basketball", month: "Feb", pct: 80 },
  { sport: "Basketball", month: "Mar", pct: 79 },
];

const TOP_STUDENTS = [
  { name: "Sanduni Rathnayake", sport: "Football",   score: 92, status: "ELIGIBLE" },
  { name: "Diwanja Kumar",      sport: "Cricket",    score: 88, status: "ELIGIBLE" },
  { name: "Lahiru Wickramasinghe", sport: "Basketball", score: 84, status: "ELIGIBLE" },
  { name: "Thisara Fernando",   sport: "Football",   score: 71, status: "ELIGIBLE" },
  { name: "Kasun Perera",       sport: "Cricket",    score: 76, status: "ELIGIBLE" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function scoreColor(v: number) {
  if (v >= 80) return "#10B981";
  if (v >= 60) return "#C9A227";
  return "#EF4444";
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminReports() {
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "ADMIN") router.replace("/login");
    })();
  }, []);

  const handleExport = async () => {
    const lines = [
      "Sport,Enrolled,Avg Match,Avg Fitness,Avg Attendance,Eligible",
      ...SPORTS_PERFORMANCE.map(
        (s) => `${s.sport},${s.enrolled},${s.avgMatch},${s.avgFitness},${s.avgAttend},${s.eligible}`
      ),
    ].join("\n");
    try {
      await Share.share({ message: lines, title: "EKEL-Sport Report" });
    } catch {
      Alert.alert("Export failed", "Unable to share the report.");
    }
  };

  return (
    <Screen>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#F9FAFB" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Reports & Analytics</Text>
          <Text style={styles.headerSub}>Academic Year 2025/26</Text>
        </View>
        <Pressable onPress={handleExport} style={styles.exportBtn} hitSlop={10}>
          <Ionicons name="share-outline" size={19} color="#C9A227" />
        </Pressable>
      </View>

      {/* ── Tabs ── */}
      <View style={styles.tabRow}>
        {(["overview", "attendance", "performance"] as Tab[]).map((t) => (
          <Pressable
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === "overview" ? "Overview" : t === "attendance" ? "Attendance" : "Performance"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ══ OVERVIEW ══ */}
        {tab === "overview" && (
          <>
            {/* KPI grid */}
            <View style={styles.kpiGrid}>
              {KPI_DATA.map((k) => (
                <View key={k.label} style={styles.kpiCard}>
                  <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
                  <Text style={styles.kpiLabel}>{k.label}</Text>
                  <Text style={styles.kpiSub}>{k.sub}</Text>
                </View>
              ))}
            </View>

            {/* Enrollment by sport */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Enrollment by Sport</Text>
              {SPORTS_PERFORMANCE.map((s) => (
                <View key={s.sport} style={styles.enrollRow}>
                  <Text style={styles.enrollSport}>{s.sport}</Text>
                  <View style={styles.enrollBarBg}>
                    <View
                      style={[
                        styles.enrollBarFill,
                        { width: `${(s.enrolled / 35) * 100}%` as any },
                      ]}
                    />
                  </View>
                  <Text style={styles.enrollCount}>{s.enrolled}</Text>
                </View>
              ))}
            </View>

            {/* Top performers */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Performers</Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHead]}>
                  <Text style={[styles.tableCell, styles.tableHeadText, { flex: 2 }]}>Student</Text>
                  <Text style={[styles.tableCell, styles.tableHeadText]}>Sport</Text>
                  <Text style={[styles.tableCell, styles.tableHeadText, { textAlign: "right" }]}>Score</Text>
                </View>
                {TOP_STUDENTS.map((s, i) => (
                  <View
                    key={s.name}
                    style={[styles.tableRow, i < TOP_STUDENTS.length - 1 && styles.tableRowBorder]}
                  >
                    <Text style={[styles.tableCell, styles.tableName, { flex: 2 }]}>{s.name}</Text>
                    <Text style={[styles.tableCell, styles.tableSport]}>{s.sport}</Text>
                    <Text
                      style={[
                        styles.tableCell,
                        { textAlign: "right", color: scoreColor(s.score), fontWeight: "900", fontSize: 14 },
                      ]}
                    >
                      {s.score}%
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        {/* ══ ATTENDANCE ══ */}
        {tab === "attendance" && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Monthly Attendance %</Text>
              <Text style={styles.sectionSub}>Jan – Mar 2026</Text>

              {SPORTS_PERFORMANCE.map((sp) => {
                const rows = ATTENDANCE_DATA.filter((a) => a.sport === sp.sport);
                return (
                  <View key={sp.sport} style={styles.attendCard}>
                    <View style={styles.attendCardHeader}>
                      <Text style={styles.attendSportName}>{sp.sport}</Text>
                      <Text style={styles.attendEnrolled}>{sp.enrolled} enrolled</Text>
                    </View>
                    {rows.map((r) => (
                      <View key={r.month} style={styles.attendRow}>
                        <Text style={styles.attendMonth}>{r.month}</Text>
                        <View style={styles.attendBarBg}>
                          <View
                            style={[
                              styles.attendBarFill,
                              {
                                width: `${r.pct}%` as any,
                                backgroundColor: scoreColor(r.pct),
                              },
                            ]}
                          />
                        </View>
                        <Text style={[styles.attendPct, { color: scoreColor(r.pct) }]}>{r.pct}%</Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>

            {/* Summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Overall Summary</Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHead]}>
                  <Text style={[styles.tableCell, styles.tableHeadText, { flex: 1.5 }]}>Sport</Text>
                  <Text style={[styles.tableCell, styles.tableHeadText, { textAlign: "right" }]}>Jan</Text>
                  <Text style={[styles.tableCell, styles.tableHeadText, { textAlign: "right" }]}>Feb</Text>
                  <Text style={[styles.tableCell, styles.tableHeadText, { textAlign: "right" }]}>Mar</Text>
                </View>
                {SPORTS_PERFORMANCE.map((sp, i) => {
                  const rows = ATTENDANCE_DATA.filter((a) => a.sport === sp.sport);
                  return (
                    <View
                      key={sp.sport}
                      style={[styles.tableRow, i < SPORTS_PERFORMANCE.length - 1 && styles.tableRowBorder]}
                    >
                      <Text style={[styles.tableCell, styles.tableName, { flex: 1.5 }]}>{sp.sport}</Text>
                      {rows.map((r) => (
                        <Text
                          key={r.month}
                          style={[
                            styles.tableCell,
                            { textAlign: "right", color: scoreColor(r.pct), fontWeight: "800", fontSize: 13 },
                          ]}
                        >
                          {r.pct}%
                        </Text>
                      ))}
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* ══ PERFORMANCE ══ */}
        {tab === "performance" && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Average Scores by Sport</Text>
              <Text style={styles.sectionSub}>Match · Fitness · Attendance (weighted avg)</Text>

              {SPORTS_PERFORMANCE.map((s) => (
                <View key={s.sport} style={styles.perfCard}>
                  <View style={styles.perfCardHeader}>
                    <Text style={styles.perfSportName}>{s.sport}</Text>
                    <View style={styles.eligibleBadge}>
                      <Text style={styles.eligibleText}>{s.eligible} eligible</Text>
                    </View>
                  </View>

                  {[
                    { label: "Match Performance", value: s.avgMatch,   color: "#C9A227" },
                    { label: "Fitness Tests",      value: s.avgFitness, color: "#6366F1" },
                    { label: "Attendance",         value: s.avgAttend,  color: "#10B981" },
                  ].map((m) => (
                    <View key={m.label} style={styles.perfMetricRow}>
                      <Text style={styles.perfMetricLabel}>{m.label}</Text>
                      <View style={styles.perfBarBg}>
                        <View
                          style={[
                            styles.perfBarFill,
                            { width: `${m.value}%` as any, backgroundColor: m.color },
                          ]}
                        />
                      </View>
                      <Text style={[styles.perfMetricVal, { color: m.color }]}>{m.value}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>

            {/* Eligibility table */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Eligibility Summary</Text>
              <View style={styles.table}>
                <View style={[styles.tableRow, styles.tableHead]}>
                  <Text style={[styles.tableCell, styles.tableHeadText, { flex: 1.5 }]}>Sport</Text>
                  <Text style={[styles.tableCell, styles.tableHeadText, { textAlign: "right" }]}>Enrolled</Text>
                  <Text style={[styles.tableCell, styles.tableHeadText, { textAlign: "right" }]}>Eligible</Text>
                  <Text style={[styles.tableCell, styles.tableHeadText, { textAlign: "right" }]}>Rate</Text>
                </View>
                {SPORTS_PERFORMANCE.map((s, i) => {
                  const rate = Math.round((s.eligible / s.enrolled) * 100);
                  return (
                    <View
                      key={s.sport}
                      style={[styles.tableRow, i < SPORTS_PERFORMANCE.length - 1 && styles.tableRowBorder]}
                    >
                      <Text style={[styles.tableCell, styles.tableName, { flex: 1.5 }]}>{s.sport}</Text>
                      <Text style={[styles.tableCell, { textAlign: "right", color: "#A7B0BE", fontSize: 13 }]}>
                        {s.enrolled}
                      </Text>
                      <Text style={[styles.tableCell, { textAlign: "right", color: "#10B981", fontWeight: "800", fontSize: 13 }]}>
                        {s.eligible}
                      </Text>
                      <Text style={[styles.tableCell, { textAlign: "right", color: scoreColor(rate), fontWeight: "900", fontSize: 13 }]}>
                        {rate}%
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    gap: 10,
  },
  backBtn:  { padding: 2 },
  headerTitle: { color: "#F9FAFB", fontSize: 20, fontWeight: "900" },
  headerSub:   { color: "rgba(229,231,235,0.45)", fontSize: 12, fontWeight: "600", marginTop: 2 },
  exportBtn: {
    backgroundColor: "rgba(201,162,39,0.1)",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.25)",
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  tabActive:     { backgroundColor: "rgba(201,162,39,0.14)", borderColor: "#C9A227" },
  tabText:       { color: "#6B7280", fontSize: 12, fontWeight: "700" },
  tabTextActive: { color: "#C9A227", fontSize: 12, fontWeight: "800" },

  scroll: { paddingHorizontal: 20, paddingTop: 16 },

  // KPI
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 4,
  },
  kpiCard: {
    width: "47.5%",
    backgroundColor: "rgba(18,24,38,0.85)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 3,
  },
  kpiValue: { fontSize: 26, fontWeight: "900" },
  kpiLabel: { color: "#F9FAFB", fontSize: 12, fontWeight: "700" },
  kpiSub:   { color: "rgba(229,231,235,0.4)", fontSize: 10, fontWeight: "600" },

  // Section
  section: {
    marginTop: 20,
  },
  sectionTitle: { color: "#F9FAFB", fontSize: 16, fontWeight: "900", marginBottom: 4 },
  sectionSub:   { color: "rgba(229,231,235,0.4)", fontSize: 11, fontWeight: "600", marginBottom: 14 },

  // Enrollment bars
  enrollRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 12,
  },
  enrollSport:   { color: "#D1D5DB", fontSize: 13, fontWeight: "700", width: 80 },
  enrollBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  enrollBarFill: { height: 8, borderRadius: 4, backgroundColor: "#C9A227" },
  enrollCount:   { color: "#F9FAFB", fontSize: 13, fontWeight: "800", width: 26, textAlign: "right" },

  // Table
  table: {
    backgroundColor: "rgba(18,24,38,0.85)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    marginTop: 10,
  },
  tableRow:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
  tableHead:      { backgroundColor: "rgba(255,255,255,0.04)" },
  tableRowBorder: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" },
  tableCell:      { flex: 1, fontSize: 13 },
  tableHeadText:  { color: "rgba(229,231,235,0.45)", fontSize: 11, fontWeight: "700" },
  tableName:      { color: "#F9FAFB", fontSize: 13, fontWeight: "700" },
  tableSport:     { color: "#A7B0BE", fontSize: 12, fontWeight: "600" },

  // Attendance
  attendCard: {
    backgroundColor: "rgba(18,24,38,0.85)",
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  attendCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  attendSportName: { color: "#F9FAFB", fontSize: 14, fontWeight: "800" },
  attendEnrolled:  { color: "rgba(229,231,235,0.4)", fontSize: 12, fontWeight: "600" },
  attendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  attendMonth:  { color: "#6B7280", fontSize: 12, fontWeight: "700", width: 28 },
  attendBarBg: {
    flex: 1,
    height: 7,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  attendBarFill: { height: 7, borderRadius: 3 },
  attendPct:     { fontSize: 12, fontWeight: "800", width: 36, textAlign: "right" },

  // Performance
  perfCard: {
    backgroundColor: "rgba(18,24,38,0.85)",
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  perfCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  perfSportName: { color: "#F9FAFB", fontSize: 14, fontWeight: "800" },
  eligibleBadge: {
    backgroundColor: "rgba(16,185,129,0.1)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  eligibleText: { color: "#10B981", fontSize: 11, fontWeight: "800" },
  perfMetricRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  perfMetricLabel: { color: "#9CA3AF", fontSize: 12, fontWeight: "600", width: 110 },
  perfBarBg: {
    flex: 1,
    height: 7,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
  },
  perfBarFill:    { height: 7, borderRadius: 3 },
  perfMetricVal:  { fontSize: 13, fontWeight: "900", width: 28, textAlign: "right" },
});
