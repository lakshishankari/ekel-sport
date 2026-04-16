import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Animated,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import { logout } from "../lib/logout";
import { apiGet } from "../lib/api";
import Screen from "../components/Screen";

// ─── Types ───────────────────────────────────────────────────────────────────
type KpiData = {
  total:       number;
  eligible:    number;
  borderline:  number;
  notEligible: number;
};

type SportSummary = {
  sport:    string;
  total:    number;
  eligible: number;
  pct:      number;
};

type ActionItem = {
  title:    string;
  subtitle: string;
  icon:     keyof typeof Ionicons.glyphMap;
  route:    string;
  accent:   string;
  badge?:   number | null;
};

const ACTIONS: ActionItem[] = [
  {
    title:    "Criteria Weightages",
    subtitle: "Configure match, fitness, attendance & discipline weights per sport",
    icon:     "bar-chart",
    route:    "/advisoryWeightages",
    accent:   "#C9A227",
  },
  {
    title:    "Student Eligibility",
    subtitle: "Review and filter student colors eligibility status",
    icon:     "ribbon",
    route:    "/advisoryEligibility",
    accent:   "#10B981",
  },
  {
    title:    "Reports & Analytics",
    subtitle: "Enrollment, attendance, and performance insights",
    icon:     "analytics",
    route:    "/reports",
    accent:   "#6366F1",
  },
];

// ─── Animated KPI Card ────────────────────────────────────────────────────────
function KpiCard({
  label, value, color, icon, delay,
}: {
  label: string; value: number; color: string;
  icon: keyof typeof Ionicons.glyphMap; delay: number;
}) {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 400, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 400, delay, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.kpiCard, { opacity: fade, transform: [{ translateY: slide }] }]}>
      <View style={[styles.kpiIconWrap, { backgroundColor: color + "22" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.kpiValue, { color }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </Animated.View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function AdvisoryDashboard() {
  const [userName,     setUserName]     = useState("Advisory Board");
  const [kpi,          setKpi]          = useState<KpiData | null>(null);
  const [sports,       setSports]       = useState<SportSummary[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const headerFade = useRef(new Animated.Value(0)).current;

  // ── Auth guard + data load ──────────────────────────────────────────────
  const load = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const { token, role, fullName } = await loadAuth();
      if (!token || role !== "ADVISORY") {
        router.replace("/login");
        return;
      }
      if (fullName) setUserName(fullName);

      const [kpiData, sportData] = await Promise.all([
        apiGet<KpiData>("/api/advisory/kpi"),
        apiGet<SportSummary[]>("/api/advisory/sports-summary"),
      ]);

      setKpi(kpiData);
      setSports(sportData.filter((s) => s.total > 0));

      Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch (err: any) {
      setError(err?.message ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(true); };

  // ── KPI items ────────────────────────────────────────────────────────────
  const kpiItems = kpi
    ? [
        { label: "Total Students", value: kpi.total,       color: "#C9A227", icon: "people"          as const },
        { label: "Eligible",        value: kpi.eligible,    color: "#10B981", icon: "checkmark-circle" as const },
        { label: "Borderline",      value: kpi.borderline,  color: "#F59E0B", icon: "time"             as const },
        { label: "Not Eligible",    value: kpi.notEligible, color: "#EF4444", icon: "close-circle"     as const },
      ]
    : [];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Screen>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C9A227"
            colors={["#C9A227"]}
          />
        }
      >
        {/* ── Header ── */}
        <Animated.View style={[styles.header, { opacity: headerFade }]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Advisory Dashboard 📊</Text>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.headerSub}>KLN University · Colours Eligibility</Text>
          </View>
          <Pressable onPress={logout} style={styles.logoutBtn} hitSlop={10}>
            <Ionicons name="log-out-outline" size={22} color="#C9A227" />
          </Pressable>
        </Animated.View>

        {/* ── Loading state ── */}
        {loading && !refreshing && (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#C9A227" />
            <Text style={styles.loadingText}>Loading dashboard…</Text>
          </View>
        )}

        {/* ── Error state ── */}
        {!loading && error && (
          <View style={styles.errorBox}>
            <Ionicons name="wifi-outline" size={36} color="#EF4444" style={{ marginBottom: 10 }} />
            <Text style={styles.errorTitle}>Could not load data</Text>
            <Text style={styles.errorSub}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={() => load()}>
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* ── KPI strip ── */}
        {!loading && !error && kpi && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.kpiStrip}
          >
            {kpiItems.map((k, i) => (
              <KpiCard key={k.label} {...k} delay={i * 80} />
            ))}
          </ScrollView>
        )}

        {/* ── Eligibility ring summary ── */}
        {!loading && !error && kpi && kpi.total > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Eligibility Overview</Text>
            <Text style={styles.sectionSub}>Distribution across all enrolled students</Text>

            <View style={styles.ringRow}>
              {/* Eligible bar */}
              <View style={styles.ringItem}>
                <View style={[styles.ringCircle, { borderColor: "#10B981" }]}>
                  <Text style={[styles.ringPct, { color: "#10B981" }]}>
                    {kpi.total > 0 ? Math.round((kpi.eligible / kpi.total) * 100) : 0}%
                  </Text>
                </View>
                <Text style={styles.ringLabel}>Eligible</Text>
              </View>
              <View style={styles.ringItem}>
                <View style={[styles.ringCircle, { borderColor: "#F59E0B" }]}>
                  <Text style={[styles.ringPct, { color: "#F59E0B" }]}>
                    {kpi.total > 0 ? Math.round((kpi.borderline / kpi.total) * 100) : 0}%
                  </Text>
                </View>
                <Text style={styles.ringLabel}>Borderline</Text>
              </View>
              <View style={styles.ringItem}>
                <View style={[styles.ringCircle, { borderColor: "#EF4444" }]}>
                  <Text style={[styles.ringPct, { color: "#EF4444" }]}>
                    {kpi.total > 0 ? Math.round((kpi.notEligible / kpi.total) * 100) : 0}%
                  </Text>
                </View>
                <Text style={styles.ringLabel}>Not Eligible</Text>
              </View>
            </View>

            {/* Horizontal stacked bar */}
            <View style={styles.stackedBar}>
              {kpi.eligible > 0 && (
                <View style={[styles.stackSeg, {
                  flex: kpi.eligible, backgroundColor: "#10B981",
                  borderTopLeftRadius: 4, borderBottomLeftRadius: 4,
                }]} />
              )}
              {kpi.borderline > 0 && (
                <View style={[styles.stackSeg, { flex: kpi.borderline, backgroundColor: "#F59E0B" }]} />
              )}
              {kpi.notEligible > 0 && (
                <View style={[styles.stackSeg, {
                  flex: kpi.notEligible, backgroundColor: "#EF4444",
                  borderTopRightRadius: 4, borderBottomRightRadius: 4,
                }]} />
              )}
            </View>
          </View>
        )}

        {/* ── Sport breakdown ── */}
        {!loading && !error && sports.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sport Breakdown</Text>
            <Text style={styles.sectionSub}>Eligibility progress per sport</Text>

            {sports.map((s) => (
              <View key={s.sport} style={styles.sportRow}>
                <View style={styles.sportRowTop}>
                  <Text style={styles.sportName}>{s.sport}</Text>
                  <Text style={styles.sportPct}>{s.pct}%</Text>
                </View>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${s.pct}%` as any }]} />
                </View>
                <Text style={styles.sportMeta}>
                  {s.eligible} eligible / {s.total} enrolled
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Empty state when no enrollments ── */}
        {!loading && !error && kpi && kpi.total === 0 && (
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={48} color="#374151" />
            <Text style={styles.emptyTitle}>No enrolled students yet</Text>
            <Text style={styles.emptySub}>
              Students will appear here once they have approved sport enrollments.
            </Text>
          </View>
        )}

        {/* ── Quick Actions ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <Text style={styles.sectionSub}>Manage criteria, review eligibility, and export reports</Text>

          {ACTIONS.map((a) => (
            <Pressable
              key={a.route}
              style={({ pressed }) => [styles.actionCard, pressed && { opacity: 0.85 }]}
              onPress={() => router.push(a.route as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: a.accent + "22" }]}>
                <Ionicons name={a.icon} size={24} color={a.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.actionTitle}>{a.title}</Text>
                <Text style={styles.actionSub}>{a.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#4B5563" />
            </Pressable>
          ))}
        </View>

        {/* ── Info banner ── */}
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={18} color="#C9A227" />
          <Text style={styles.infoText}>
            Eligibility scores are computed using configurable weightages across match performance,
            fitness, attendance, and discipline criteria. Set weightages per sport in Criteria Weightages.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  greeting: {
    color: "rgba(229,231,235,0.55)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  userName: {
    color: "#F9FAFB",
    fontSize: 22,
    fontWeight: "900",
  },
  headerSub: {
    color: "rgba(229,231,235,0.4)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  logoutBtn: {
    marginTop: 4,
    backgroundColor: "rgba(201,162,39,0.1)",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.25)",
  },

  // Load / Error / Empty
  loadingBox: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 14,
  },
  loadingText: {
    color: "rgba(229,231,235,0.45)",
    fontSize: 13,
    fontWeight: "600",
  },
  errorBox: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 6,
  },
  errorTitle: { color: "#F9FAFB", fontSize: 16, fontWeight: "800" },
  errorSub:   { color: "rgba(229,231,235,0.5)", fontSize: 13, fontWeight: "500", textAlign: "center", lineHeight: 18 },
  retryBtn: {
    marginTop: 14,
    backgroundColor: "rgba(201,162,39,0.15)",
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.3)",
  },
  retryText: { color: "#C9A227", fontSize: 14, fontWeight: "800" },

  emptyBox: {
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: { color: "#4B5563", fontSize: 16, fontWeight: "800", marginTop: 6 },
  emptySub:   { color: "#374151", fontSize: 13, fontWeight: "500", textAlign: "center", lineHeight: 18 },

  // KPI strip
  kpiStrip: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  kpiCard: {
    width: 110,
    backgroundColor: "rgba(18,24,38,0.9)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
    gap: 8,
  },
  kpiIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  kpiValue: { fontSize: 22, fontWeight: "900" },
  kpiLabel: {
    color: "rgba(229,231,235,0.55)",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 14,
  },

  // Section
  section: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: "rgba(18,24,38,0.85)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  sectionTitle: { color: "#F9FAFB", fontSize: 17, fontWeight: "900", marginBottom: 4 },
  sectionSub: {
    color: "rgba(229,231,235,0.5)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 18,
    lineHeight: 16,
  },

  // Ring overview
  ringRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 18,
  },
  ringItem: { alignItems: "center", gap: 8 },
  ringCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  ringPct:   { fontSize: 16, fontWeight: "900" },
  ringLabel: { color: "rgba(229,231,235,0.5)", fontSize: 11, fontWeight: "700" },

  // Stacked bar
  stackedBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  stackSeg: { height: 8 },

  // Sport breakdown
  sportRow: { marginBottom: 16 },
  sportRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sportName: { color: "#F9FAFB", fontSize: 14, fontWeight: "800" },
  sportPct:  { color: "#C9A227", fontSize: 14, fontWeight: "900" },
  progressBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C9A227",
  },
  sportMeta: {
    color: "rgba(229,231,235,0.45)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 6,
  },

  // Actions
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  actionIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { color: "#F9FAFB", fontSize: 15, fontWeight: "800", marginBottom: 3 },
  actionSub: {
    color: "rgba(229,231,235,0.55)",
    fontSize: 11.5,
    fontWeight: "600",
    lineHeight: 16,
  },

  // Info banner
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 14,
    backgroundColor: "rgba(201,162,39,0.07)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.2)",
  },
  infoText: {
    flex: 1,
    color: "rgba(229,231,235,0.65)",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 17,
  },
});
