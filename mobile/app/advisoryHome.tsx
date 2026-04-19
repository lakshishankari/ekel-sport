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

type KpiData = {
  totalEnrolled: number;
  totalSports: number;
  inSquad: number;
  inPool: number;
  totalSessions: number;
  pendingEnrollments: number;
};

// ── Animated stat card ───────────────────────────────────────────────────────
function StatCard({
  label, value, subLabel, color, icon, delay, theme,
}: {
  label: string; value: number | string; subLabel?: string;
  color: string; icon: keyof typeof Ionicons.glyphMap;
  delay: number; theme: AppTheme;
}) {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;

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
        flex: 1, minWidth: 100,
        backgroundColor: theme.bgCard, borderRadius: 16,
        padding: 14, borderWidth: 1, borderColor: theme.border,
        alignItems: "center", gap: 6,
      }}
    >
      <View style={{ width: 38, height: 38, borderRadius: 11, alignItems: "center", justifyContent: "center", backgroundColor: color + "22" }}>
        <Ionicons name={icon} size={19} color={color} />
      </View>
      <Text style={{ fontSize: 26, fontWeight: "900", color }}>{value}</Text>
      <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: "700", textAlign: "center", lineHeight: 14 }}>{label}</Text>
      {subLabel ? (
        <Text style={{ color: color + "99", fontSize: 9, fontWeight: "700", textAlign: "center" }}>{subLabel}</Text>
      ) : null}
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
    subtitle: "Review students' eligibility status with scores per sport",
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

      const kpiData = await apiGet<KpiData>("/api/advisory/kpi");
      setKpi(kpiData);
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

        {/* ── Real Stats Grid ── */}
        {!loading && !error && kpi && (
          <>
            {/* Row 1: Enrollment stats */}
            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "700", marginTop: 18, marginBottom: 10, letterSpacing: 0.5 }}>
              ENROLLMENT OVERVIEW
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <StatCard
                label="Enrolled Students"
                value={kpi.totalEnrolled}
                color="#C9A227"
                icon="people"
                delay={0}
                theme={theme}
              />
              <StatCard
                label="Active Sports"
                value={kpi.totalSports}
                color="#6366F1"
                icon="football"
                delay={80}
                theme={theme}
              />
              <StatCard
                label="Pending Requests"
                value={kpi.pendingEnrollments}
                subLabel={kpi.pendingEnrollments > 0 ? "Awaiting admin" : "All cleared"}
                color={kpi.pendingEnrollments > 0 ? "#F59E0B" : "#10B981"}
                icon="time"
                delay={160}
                theme={theme}
              />
            </View>

            {/* Row 2: Performance / squad stats */}
            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "700", marginTop: 20, marginBottom: 10, letterSpacing: 0.5 }}>
              SQUAD & SESSIONS
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <StatCard
                label="In Squad"
                value={kpi.inSquad}
                subLabel="Squad level"
                color="#10B981"
                icon="ribbon"
                delay={0}
                theme={theme}
              />
              <StatCard
                label="In Pool"
                value={kpi.inPool}
                subLabel="Pool level"
                color="#8B5CF6"
                icon="albums"
                delay={80}
                theme={theme}
              />
              <StatCard
                label="Sessions Held"
                value={kpi.totalSessions}
                subLabel="All sports"
                color="#3B82F6"
                icon="calendar"
                delay={160}
                theme={theme}
              />
            </View>
          </>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && kpi && kpi.totalEnrolled === 0 && (
          <View style={{ alignItems: "center", paddingHorizontal: 16, paddingVertical: 32, gap: 8, marginTop: 10 }}>
            <Ionicons name="people-outline" size={40} color={theme.textMuted} />
            <Text style={{ color: theme.textSub, fontSize: 15, fontWeight: "800", marginTop: 4 }}>No enrolled students yet</Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: "center", lineHeight: 18 }}>
              Students will appear once they have approved sport enrollments.
            </Text>
          </View>
        )}

        {/* ── Quick Actions ── */}
        <View style={{ marginTop: 24, backgroundColor: theme.bgCard, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: theme.border }}>
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
            Eligibility scores are calculated using configurable weightages across match performance, fitness, attendance, and discipline. Use Criteria Weightages to set thresholds per sport.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
