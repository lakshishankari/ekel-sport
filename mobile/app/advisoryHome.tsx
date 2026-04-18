import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View, Text, Pressable, ScrollView, StatusBar,
  Animated, ActivityIndicator, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import { logout } from "../lib/logout";
import { apiGet } from "../lib/api";
import Screen from "../components/Screen";
import { useAppTheme, AppTheme } from "../lib/themeStore";

type KpiData = { total: number; eligible: number; borderline: number; notEligible: number };
type SportSummary = { sport: string; total: number; eligible: number; pct: number };

// ── Animated KPI card ────────────────────────────────────────────────────────
function KpiCard({
  label, value, color, icon, delay, theme,
}: {
  label: string; value: number; color: string;
  icon: keyof typeof Ionicons.glyphMap; delay: number; theme: AppTheme;
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
    <Animated.View
      style={{
        opacity: fade, transform: [{ translateY: slide }],
        width: 110, backgroundColor: theme.bgCard, borderRadius: 16,
        padding: 14, borderWidth: 1, borderColor: theme.border,
        alignItems: "center", gap: 8,
      }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: color + "22" }}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={{ fontSize: 24, fontWeight: "900", color }}>{value}</Text>
      <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: "700", textAlign: "center", lineHeight: 14 }}>{label}</Text>
    </Animated.View>
  );
}

// ── Quick action card ────────────────────────────────────────────────────────
const ACTIONS = [
  {
    title: "Criteria Weightages",
    subtitle: "Configure match, fitness, attendance & discipline weights per sport",
    icon: "bar-chart" as const,
    route: "/advisoryWeightages",
    accent: "#C9A227",
  },
  {
    title: "Student Eligibility",
    subtitle: "Review and filter student colours eligibility status per sport",
    icon: "ribbon" as const,
    route: "/advisoryEligibility",
    accent: "#10B981",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
export default function AdvisoryHome() {
  const { theme, isDark } = useAppTheme();
  const [userName,   setUserName]   = useState("Advisory Board");
  const [kpi,        setKpi]        = useState<KpiData | null>(null);
  const [sports,     setSports]     = useState<SportSummary[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const headerFade = useRef(new Animated.Value(0)).current;

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const { token, role, fullName } = await loadAuth();
      if (!token || role !== "ADVISORY") { router.replace("/login"); return; }
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

  const kpiItems: { label: string; value: number; color: string; icon: keyof typeof Ionicons.glyphMap }[] = kpi
    ? [
        { label: "Total Students", value: kpi.total,       color: "#C9A227", icon: "people" },
        { label: "Eligible",       value: kpi.eligible,    color: "#10B981", icon: "checkmark-circle" },
        { label: "Borderline",     value: kpi.borderline,  color: "#F59E0B", icon: "time" },
        { label: "Not Eligible",   value: kpi.notEligible, color: "#EF4444", icon: "close-circle" },
      ]
    : [];

  return (
    <Screen>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} />}
      >
        {/* ── Header ── */}
        <Animated.View style={{ opacity: headerFade, flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingTop: 8, paddingBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "600", marginBottom: 4 }}>Advisory Dashboard 📊</Text>
            <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900" }}>{userName}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: "600", marginTop: 3 }}>KLN University · Colours Eligibility</Text>
          </View>
          <Pressable
            onPress={logout}
            style={{ marginTop: 4, backgroundColor: theme.accent + "1A", borderRadius: 10, padding: 8, borderWidth: 1, borderColor: theme.accent + "40" }}
            hitSlop={10}
          >
            <Ionicons name="log-out-outline" size={22} color={theme.accent} />
          </Pressable>
        </Animated.View>

        {/* ── Loading ── */}
        {loading && !refreshing && (
          <View style={{ alignItems: "center", paddingVertical: 50, gap: 14 }}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "600" }}>Loading dashboard…</Text>
          </View>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <View style={{ alignItems: "center", paddingHorizontal: 16, paddingVertical: 48, gap: 8 }}>
            <Ionicons name="wifi-outline" size={36} color="#EF4444" />
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800" }}>Could not load data</Text>
            <Text style={{ color: theme.textSub, fontSize: 13, textAlign: "center", lineHeight: 18 }}>{error}</Text>
            <Pressable
              onPress={() => load()}
              style={{ marginTop: 10, backgroundColor: theme.accent + "26", borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10, borderWidth: 1, borderColor: theme.accent + "4D" }}
            >
              <Text style={{ color: theme.accent, fontSize: 14, fontWeight: "800" }}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* ── KPI Strip ── */}
        {!loading && !error && kpi && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingTop: 12, paddingBottom: 4 }}>
            {kpiItems.map((k, i) => (
              <KpiCard key={k.label} {...k} delay={i * 80} theme={theme} />
            ))}
          </ScrollView>
        )}

        {/* ── Eligibility Rings Overview ── */}
        {!loading && !error && kpi && kpi.total > 0 && (
          <View style={{ marginTop: 20, backgroundColor: theme.bgCard, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900", marginBottom: 4 }}>Eligibility Overview</Text>
            <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "600", marginBottom: 18, lineHeight: 16 }}>Distribution across all enrolled students</Text>

            <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 18 }}>
              {[
                { label: "Eligible",     count: kpi.eligible,    color: "#10B981" },
                { label: "Borderline",   count: kpi.borderline,  color: "#F59E0B" },
                { label: "Not Eligible", count: kpi.notEligible, color: "#EF4444" },
              ].map((r) => (
                <View key={r.label} style={{ alignItems: "center", gap: 8 }}>
                  <View style={{ width: 68, height: 68, borderRadius: 34, borderWidth: 4, borderColor: r.color, alignItems: "center", justifyContent: "center", backgroundColor: theme.bgInput }}>
                    <Text style={{ fontSize: 15, fontWeight: "900", color: r.color }}>
                      {kpi.total > 0 ? Math.round((r.count / kpi.total) * 100) : 0}%
                    </Text>
                  </View>
                  <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "700" }}>{r.label}</Text>
                </View>
              ))}
            </View>

            {/* Stacked bar */}
            <View style={{ flexDirection: "row", height: 8, borderRadius: 4, overflow: "hidden", backgroundColor: theme.border }}>
              {kpi.eligible > 0 && <View style={{ flex: kpi.eligible, backgroundColor: "#10B981", borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }} />}
              {kpi.borderline > 0 && <View style={{ flex: kpi.borderline, backgroundColor: "#F59E0B" }} />}
              {kpi.notEligible > 0 && <View style={{ flex: kpi.notEligible, backgroundColor: "#EF4444", borderTopRightRadius: 4, borderBottomRightRadius: 4 }} />}
            </View>
          </View>
        )}

        {/* ── Sport Breakdown ── */}
        {!loading && !error && sports.length > 0 && (
          <View style={{ marginTop: 20, backgroundColor: theme.bgCard, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: theme.border }}>
            <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900", marginBottom: 4 }}>Sport Breakdown</Text>
            <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "600", marginBottom: 18, lineHeight: 16 }}>Eligibility progress per sport</Text>
            {sports.map((s) => (
              <View key={s.sport} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: "800" }}>{s.sport}</Text>
                  <Text style={{ color: theme.accent, fontSize: 14, fontWeight: "900" }}>{s.pct}%</Text>
                </View>
                <View style={{ height: 6, borderRadius: 3, backgroundColor: theme.bgInput, overflow: "hidden" }}>
                  <View style={{ width: `${s.pct}%` as any, height: 6, borderRadius: 3, backgroundColor: theme.accent }} />
                </View>
                <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "600", marginTop: 6 }}>
                  {s.eligible} eligible / {s.total} enrolled
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && kpi && kpi.total === 0 && (
          <View style={{ alignItems: "center", paddingHorizontal: 16, paddingVertical: 48, gap: 8 }}>
            <Ionicons name="people-outline" size={48} color={theme.textMuted} />
            <Text style={{ color: theme.textSub, fontSize: 16, fontWeight: "800", marginTop: 6 }}>No enrolled students yet</Text>
            <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: "center", lineHeight: 18 }}>
              Students will appear once they have approved sport enrollments.
            </Text>
          </View>
        )}

        {/* ── Quick Actions ── */}
        <View style={{ marginTop: 20, backgroundColor: theme.bgCard, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: theme.border }}>
          <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900", marginBottom: 4 }}>Quick Actions</Text>
          <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "600", marginBottom: 18, lineHeight: 16 }}>Manage criteria and review student eligibility</Text>
          {ACTIONS.map((a) => (
            <Pressable
              key={a.route}
              style={({ pressed }) => [{
                flexDirection: "row", alignItems: "center", gap: 14,
                backgroundColor: theme.bgInput, borderRadius: 14, padding: 14,
                marginBottom: 10, borderWidth: 1, borderColor: theme.border,
              }, pressed && { opacity: 0.85 }]}
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
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 20, padding: 14, backgroundColor: theme.accent + "12", borderRadius: 14, borderWidth: 1, borderColor: theme.accent + "33" }}>
          <Ionicons name="information-circle" size={18} color={theme.accent} />
          <Text style={{ flex: 1, color: theme.textSub, fontSize: 12, fontWeight: "600", lineHeight: 17 }}>
            Eligibility scores are calculated using configurable weightages across match performance, fitness, attendance, and discipline criteria. Set weightages per sport using Criteria Weightages.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
