import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable,
  ActivityIndicator, RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { loadAuth } from "../lib/authStore";
import { apiGet } from "../lib/api";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../lib/themeStore";

// ─── Types ────────────────────────────────────────────────────
type SportStat = {
  sport: string; enrolled: number;
  avgMatch: number; avgFitness: number; avgDisc: number; eligible: number;
};
type TopStudent = { name: string; sport: string; avgScore: number; squadLevel: string };
type KPI = { totalStudents: number; totalSports: number; totalSessions: number; eligibleCount: number };
type ReportData = { kpi: KPI; sportStats: SportStat[]; topStudents: TopStudent[] };

type SquadLevel = "NONE" | "POOL" | "SQUAD";
const LEVEL_COLOR: Record<SquadLevel, string> = {
  NONE:  "#6B7280",
  POOL:  "#60A5FA",
  SQUAD: "#D4AF37",
};

function levelColor(l: string) { return LEVEL_COLOR[(l as SquadLevel)] ?? "#6B7280"; }
function scoreColor(v: number) { return v >= 80 ? "#10B981" : v >= 60 ? "#D4AF37" : "#EF4444"; }

// ─── Component ────────────────────────────────────────────────
export default function AdminReports() {
  const { theme } = useAppTheme();
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

  // ─── KPI cards config
  const KPI_CARDS = data ? [
    { label: "Total Students",  value: String(data.kpi.totalStudents),  icon: "people"            as const, color: "#D4AF37", bg: "rgba(212,175,55,0.12)"  },
    { label: "Active Sports",   value: String(data.kpi.totalSports),    icon: "football"          as const, color: "#10B981", bg: "rgba(16,185,129,0.12)"  },
    { label: "Sessions Held",   value: String(data.kpi.totalSessions),  icon: "calendar-number"   as const, color: "#6366F1", bg: "rgba(99,102,241,0.12)"  },
    { label: "Colors Eligible", value: String(data.kpi.eligibleCount),  icon: "shield-checkmark"  as const, color: "#F59E0B", bg: "rgba(245,158,11,0.12)"  },
  ] : [];

  return (
    <Screen>
      <AppHeader
        title="Reports & Analytics"
        subtitle="Live overview · Academic Year 2025/26"
        showBack
        backRoute="/adminHome"
      />

      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={{ color: theme.textMuted, fontWeight: "600" }}>Loading live data…</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 48 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing} onRefresh={onRefresh}
              tintColor="#D4AF37" colors={["#D4AF37"]}
            />
          }
        >
          {/* ── KPI Grid ── */}
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
            {KPI_CARDS.map((k) => (
              <View
                key={k.label}
                style={{
                  width: "47%", borderRadius: 20, padding: 16,
                  borderWidth: 1, backgroundColor: theme.bgCard,
                  borderColor: theme.border, gap: 10,
                }}
              >
                <View style={{
                  width: 42, height: 42, borderRadius: 13,
                  backgroundColor: k.bg, alignItems: "center", justifyContent: "center",
                }}>
                  <Ionicons name={k.icon} size={20} color={k.color} />
                </View>
                <View>
                  <Text style={{ fontSize: 28, fontWeight: "900", color: k.color }}>{k.value}</Text>
                  <Text style={{ fontSize: 12, fontWeight: "700", color: theme.text, marginTop: 2 }}>{k.label}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ── Enrollment by Sport ── */}
          {data && data.sportStats.length > 0 && (
            <View style={{
              borderRadius: 20, borderWidth: 1,
              backgroundColor: theme.bgCard, borderColor: theme.border,
              padding: 16, marginBottom: 14,
            }}>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900", marginBottom: 14 }}>
                Enrollment by Sport
              </Text>
              {data.sportStats.map((s, i) => {
                const maxEnrolled = Math.max(...data.sportStats.map((x) => x.enrolled), 1);
                const pct = Math.round((s.enrolled / maxEnrolled) * 100);
                return (
                  <View key={s.sport} style={{ marginBottom: i < data.sportStats.length - 1 ? 14 : 0 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 6 }}>
                      <Text style={{ color: theme.text, fontSize: 13, fontWeight: "800" }}>{s.sport}</Text>
                      <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "700" }}>
                        {s.enrolled} enrolled
                      </Text>
                    </View>
                    <View style={{
                      height: 7, borderRadius: 4, overflow: "hidden",
                      backgroundColor: theme.bgInput,
                    }}>
                      <View style={{
                        width: `${pct}%` as any,
                        height: "100%", borderRadius: 4, backgroundColor: "#D4AF37",
                      }} />
                    </View>
                    <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "600", marginTop: 4 }}>
                      {s.eligible} eligible (Pool + Squad)
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* ── Top Performers ── */}
          {data && data.topStudents.length > 0 && (
            <View style={{
              borderRadius: 20, borderWidth: 1,
              backgroundColor: theme.bgCard, borderColor: theme.border,
              overflow: "hidden", marginBottom: 14,
            }}>
              {/* Header */}
              <View style={{
                flexDirection: "row", alignItems: "center", gap: 8,
                padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border,
              }}>
                <Ionicons name="trophy" size={16} color="#D4AF37" />
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>Top Performers</Text>
              </View>

              {data.topStudents.slice(0, 8).map((s, i) => (
                <View
                  key={i}
                  style={{
                    flexDirection: "row", alignItems: "center", gap: 12,
                    paddingHorizontal: 16, paddingVertical: 12,
                    borderBottomWidth: i < Math.min(7, data.topStudents.length - 1) ? 1 : 0,
                    borderBottomColor: theme.border,
                  }}
                >
                  {/* Rank */}
                  <Text style={{
                    width: 22, fontSize: 13, fontWeight: "900",
                    color: i === 0 ? "#D4AF37" : i === 1 ? "#9CA3AF" : i === 2 ? "#C97C3E" : theme.textMuted,
                    textAlign: "center",
                  }}>
                    {i + 1}
                  </Text>

                  {/* Avatar */}
                  <View style={{
                    width: 36, height: 36, borderRadius: 11,
                    backgroundColor: "rgba(212,175,55,0.12)",
                    borderWidth: 1, borderColor: "rgba(212,175,55,0.25)",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Text style={{ color: "#D4AF37", fontSize: 15, fontWeight: "900" }}>
                      {s.name?.charAt(0)?.toUpperCase()}
                    </Text>
                  </View>

                  {/* Name + sport */}
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 13, fontWeight: "800" }} numberOfLines={1}>
                      {s.name}
                    </Text>
                    <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "600", marginTop: 1 }}>
                      {s.sport}
                    </Text>
                  </View>

                  {/* Squad badge */}
                  <View style={{
                    paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
                    backgroundColor: levelColor(s.squadLevel) + "18",
                    borderWidth: 1, borderColor: levelColor(s.squadLevel) + "44",
                  }}>
                    <Text style={{ color: levelColor(s.squadLevel), fontSize: 9.5, fontWeight: "900" }}>
                      {s.squadLevel}
                    </Text>
                  </View>

                  {/* Score */}
                  <Text style={{
                    fontSize: 15, fontWeight: "900",
                    color: s.avgScore > 0 ? scoreColor(Number(s.avgScore)) : theme.textMuted,
                    width: 36, textAlign: "right",
                  }}>
                    {s.avgScore > 0 ? String(s.avgScore) : "—"}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Empty state */}
          {data && data.sportStats.length === 0 && (
            <View style={{ alignItems: "center", paddingVertical: 60, gap: 10 }}>
              <Ionicons name="bar-chart-outline" size={52} color={theme.border} />
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800" }}>No data yet</Text>
              <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "600", textAlign: "center" }}>
                Add students, sports and performance entries to see the overview.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </Screen>
  );
}
