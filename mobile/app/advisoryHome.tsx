import React, { useEffect, useState, useRef } from "react";
import { View, Text, Pressable, ScrollView, StatusBar, Animated, ActivityIndicator, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import { logout } from "../lib/logout";
import { apiGet } from "../lib/api";
import Screen from "../components/Screen";
import { useAppTheme } from "../lib/themeStore";

type KpiData = { total: number; eligible: number; borderline: number; notEligible: number };
type SportSummary = { sport: string; total: number; eligible: number; pct: number };
type ActionItem = { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; route: string; accent: string };

const ACTIONS: ActionItem[] = [
  { title: "Full Dashboard",      subtitle: "Live KPIs, eligibility overview and sport analytics",                      icon: "grid",      route: "/advisoryDashboard", accent: "#C9A227" },
  { title: "Criteria Weightages", subtitle: "Configure match, fitness, attendance & discipline weights per sport",       icon: "bar-chart", route: "/advisoryWeightages", accent: "#6366F1" },
  { title: "Student Eligibility", subtitle: "Review and filter student colors eligibility status",                       icon: "ribbon",    route: "/advisoryEligibility", accent: "#10B981" },
  { title: "Reports & Analytics", subtitle: "Enrollment, attendance, and performance insights",                          icon: "analytics", route: "/reports",             accent: "#F59E0B" },
];

export default function AdvisoryHome() {
  const { theme, isDark } = useAppTheme();
  const [userName, setUserName] = useState("Advisory Board");
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [sports, setSports] = useState<SportSummary[]>([]);
  const [loading, setLoading] = useState(true);
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
    } catch { /* silently fall back */ }
    finally { setLoading(false); setRefreshing(false); }
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
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} />}
      >
        {/* ── Header ── */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 }}>
          <View>
            <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "600", marginBottom: 4 }}>Welcome back 👋</Text>
            <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900" }}>{userName}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: "600", marginTop: 3 }}>Advisory Board · KLN University</Text>
          </View>
          <Pressable onPress={logout} style={{ marginTop: 6, backgroundColor: theme.accent + "1A", borderRadius: 10, padding: 8, borderWidth: 1, borderColor: theme.accent + "40" }} hitSlop={10}>
            <Ionicons name="log-out-outline" size={22} color={theme.accent} />
          </Pressable>
        </View>

        {/* ── KPI Strip ── */}
        {loading && !refreshing ? (
          <View style={{ alignItems: "center", paddingVertical: 30 }}>
            <ActivityIndicator color={theme.accent} />
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, gap: 12 }}>
            {kpiItems.map((k) => (
              <View key={k.label} style={{ width: 110, backgroundColor: theme.bgCard, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: theme.border, alignItems: "center", gap: 8 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: k.color + "22" }}>
                  <Ionicons name={k.icon} size={20} color={k.color} />
                </View>
                <Text style={{ fontSize: 22, fontWeight: "900", color: k.color }}>{k.value}</Text>
                <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: "700", textAlign: "center", lineHeight: 14 }}>{k.label}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* ── Sport breakdown ── */}
        {sports.length > 0 && (
          <View style={{ marginHorizontal: 20, marginTop: 24, backgroundColor: theme.bgCard, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900", marginBottom: 4 }}>Sport Overview</Text>
            <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "600", marginBottom: 18, lineHeight: 16 }}>Eligibility breakdown per sport</Text>
            {sports.map((s) => (
              <View key={s.sport} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: "800" }}>{s.sport}</Text>
                  <Text style={{ color: theme.accent, fontSize: 14, fontWeight: "900" }}>{s.pct}%</Text>
                </View>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.border, overflow: "hidden" }}>
                  <View style={{ width: `${s.pct}%` as any, height: 6, borderRadius: 3, backgroundColor: theme.accent }} />
                </View>
                <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "600", marginTop: 6 }}>
                  {s.eligible} eligible / {s.total} enrolled
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Quick Actions ── */}
        <View style={{ marginHorizontal: 20, marginTop: 24, backgroundColor: theme.bgCard, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900", marginBottom: 4 }}>Quick Actions</Text>
          <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "600", marginBottom: 18, lineHeight: 16 }}>Manage criteria, review eligibility, and export reports</Text>
          {ACTIONS.map((a) => (
            <Pressable
              key={a.route}
              style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: theme.bgInput, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.border }, pressed && { opacity: 0.85 }]}
              onPress={() => router.push(a.route as any)}
            >
              <View style={{ width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: a.accent + "22" }}>
                <Ionicons name={a.icon} size={24} color={a.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 15, fontWeight: "800", marginBottom: 3 }}>{a.title}</Text>
                <Text style={{ color: theme.textSub, fontSize: 11.5, fontWeight: "600", lineHeight: 16 }}>{a.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </Pressable>
          ))}
        </View>

        {/* ── Info banner ── */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginHorizontal: 20, marginTop: 20, padding: 14, backgroundColor: theme.accent + "12", borderRadius: 14, borderWidth: 1, borderColor: theme.accent + "33" }}>
          <Ionicons name="information-circle" size={18} color={theme.accent} />
          <Text style={{ flex: 1, color: theme.textSub, fontSize: 12, fontWeight: "600", lineHeight: 17 }}>
            Eligibility scores are calculated using configurable weightages across match performance, fitness, attendance, and discipline criteria.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
