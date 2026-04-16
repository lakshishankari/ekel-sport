import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
  Animated,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import { logout } from "../lib/logout";
import { apiGet } from "../lib/api";
import Screen from "../components/Screen";

type KpiData = { total: number; eligible: number; borderline: number; notEligible: number };
type SportSummary = { sport: string; total: number; eligible: number; pct: number };
type ActionItem = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  accent: string;
};

const ACTIONS: ActionItem[] = [
  {
    title: "Full Dashboard",
    subtitle: "Live KPIs, eligibility overview and sport analytics",
    icon: "grid",
    route: "/advisoryDashboard",
    accent: "#C9A227",
  },
  {
    title: "Criteria Weightages",
    subtitle: "Configure match, fitness, attendance & discipline weights per sport",
    icon: "bar-chart",
    route: "/advisoryWeightages",
    accent: "#6366F1",
  },
  {
    title: "Student Eligibility",
    subtitle: "Review and filter student colors eligibility status",
    icon: "ribbon",
    route: "/advisoryEligibility",
    accent: "#10B981",
  },
  {
    title: "Reports & Analytics",
    subtitle: "Enrollment, attendance, and performance insights",
    icon: "analytics",
    route: "/reports",
    accent: "#F59E0B",
  },
];

export default function AdvisoryHome() {
  const [userName,   setUserName]   = useState("Advisory Board");
  const [kpi,        setKpi]        = useState<KpiData | null>(null);
  const [sports,     setSports]     = useState<SportSummary[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const load = async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const { token, role, fullName } = await loadAuth();
      if (!token || role !== "ADVISORY") { router.replace("/login"); return; }
      if (fullName) setUserName(fullName);

      const [kpiData, sportData] = await Promise.all([
        apiGet<KpiData>("/api/advisory/kpi"),
        apiGet<SportSummary[]>("/api/advisory/sports-summary"),
      ]);
      setKpi(kpiData);
      setSports(sportData.filter((s) => s.total > 0));
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    } catch {
      // silently fall back – dashboard still shows with blanks
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);
  const onRefresh = () => { setRefreshing(true); load(true); };

  const kpiItems: { label: string; value: number; color: string; icon: keyof typeof Ionicons.glyphMap }[] = kpi
    ? [
        { label: "Total Students", value: kpi.total,       color: "#C9A227", icon: "people" },
        { label: "Eligible",       value: kpi.eligible,    color: "#10B981", icon: "checkmark-circle" },
        { label: "Not Eligible",   value: kpi.notEligible, color: "#EF4444", icon: "close-circle" },
        { label: "Borderline",     value: kpi.borderline,  color: "#F59E0B", icon: "time" },
      ]
    : [];

  return (
    <Screen>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C9A227" colors={["#C9A227"]} />}
      >

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back 👋</Text>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.headerSub}>Advisory Board · KLN University</Text>
          </View>
          <Pressable onPress={logout} style={styles.logoutIcon} hitSlop={10}>
            <Ionicons name="log-out-outline" size={22} color="#C9A227" />
          </Pressable>
        </View>

        {/* ── KPI Strip ── */}
        {loading && !refreshing ? (
          <View style={{ alignItems: "center", paddingVertical: 30 }}>
            <ActivityIndicator color="#C9A227" />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.kpiStrip}
          >
            {kpiItems.map((k) => (
              <View key={k.label} style={styles.kpiCard}>
                <View style={[styles.kpiIconWrap, { backgroundColor: k.color + "22" }]}>
                  <Ionicons name={k.icon} size={20} color={k.color} />
                </View>
                <Text style={[styles.kpiValue, { color: k.color }]}>{k.value}</Text>
                <Text style={styles.kpiLabel}>{k.label}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* ── Sport breakdown ── */}
        {sports.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sport Overview</Text>
            <Text style={styles.sectionSub}>Eligibility breakdown per sport</Text>

            {sports.map((s) => (
              <View key={s.sport} style={styles.sportRow}>
                <View style={{ flex: 1 }}>
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
              </View>
            ))}
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
            Eligibility scores are calculated using configurable weightages across match performance,
            fitness, attendance, and discipline criteria.
          </Text>
        </View>

      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    color: "rgba(229,231,235,0.45)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 3,
  },
  logoutIcon: {
    marginTop: 6,
    backgroundColor: "rgba(201,162,39,0.1)",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.25)",
  },

  /* KPI */
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
  kpiValue: {
    fontSize: 22,
    fontWeight: "900",
  },
  kpiLabel: {
    color: "rgba(229,231,235,0.55)",
    fontSize: 10,
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 14,
  },

  /* Section */
  section: {
    marginHorizontal: 20,
    marginTop: 24,
    backgroundColor: "rgba(18,24,38,0.85)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  sectionTitle: {
    color: "#F9FAFB",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 4,
  },
  sectionSub: {
    color: "rgba(229,231,235,0.5)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 18,
    lineHeight: 16,
  },

  /* Sport breakdown */
  sportRow: {
    marginBottom: 16,
  },
  sportRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  sportName: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "800",
  },
  sportPct: {
    color: "#C9A227",
    fontSize: 14,
    fontWeight: "900",
  },
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

  /* Actions */
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
  actionTitle: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 3,
  },
  actionSub: {
    color: "rgba(229,231,235,0.55)",
    fontSize: 11.5,
    fontWeight: "600",
    lineHeight: 16,
  },

  /* Info banner */
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
