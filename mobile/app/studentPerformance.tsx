import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable, StatusBar, ActivityIndicator, RefreshControl, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import { apiGet } from "../lib/api";
import { useAppTheme } from "../lib/themeStore";
import StudentBottomNav from "../components/StudentBottomNav";

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

const TYPE_CONFIG = [
  { key: "MATCH" as const,      label: "Match Performance", icon: "trophy-outline" as const,  color: "#C9A227" },
  { key: "FITNESS" as const,    label: "Fitness Tests",     icon: "barbell-outline" as const,  color: "#10B981" },
  { key: "DISCIPLINE" as const, label: "Discipline",        icon: "ribbon-outline" as const,   color: "#3B82F6" },
];

function getScoreColor(score: number) {
  if (score >= 80) return "#10B981";
  if (score >= 60) return "#C9A227";
  return "#EF4444";
}

function squadLabel(level: string) {
  if (level === "SQUAD") return { text: "Squad Member 🏆", color: "#D4AF37" };
  if (level === "POOL")  return { text: "Pool Member ⭐",  color: "#60A5FA" };
  return { text: "Developing",        color: "#9CA3AF" };
}

export default function StudentPerformance() {
  const { theme, isDark } = useAppTheme();
  const [data, setData]         = useState<SportPerformance[]>([]);
  const [loading, setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const fetchPerformance = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const auth = await loadAuth();
      if (!auth.token || auth.role !== "STUDENT") { router.replace("/login"); return; }
      const res = await apiGet<SportPerformance[]>("/api/student/performance", auth.token);
      setData(Array.isArray(res) ? res : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load performance");
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPerformance(); }, [fetchPerformance]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchPerformance(true); }, [fetchPerformance]);

  /* ─── Compute overall average across all type entries ─── */
  const allScores: number[] = [];
  data.forEach((sport) => {
    TYPE_CONFIG.forEach(({ key }) => {
      const e = sport.types[key];
      if (e && e.entry_count > 0) allScores.push(e.avg_score);
    });
  });
  const overallScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : null;
  const scoreColor = overallScore != null ? getScoreColor(overallScore) : "#9CA3AF";

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

      {/* ── Header ── */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, gap: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border }, pressed && { opacity: 0.7 }]}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 24, fontWeight: "900" }}>Performance Overview</Text>
          <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "600", marginTop: 3 }}>Live scores from your sports</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.textSub, marginTop: 12, fontSize: 14 }}>Loading performance data...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Ionicons name="wifi-outline" size={56} color="#EF4444" />
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", marginTop: 16, textAlign: "center" }}>Connection Error</Text>
          <Text style={{ color: theme.textSub, textAlign: "center", marginTop: 8, lineHeight: 20 }}>{error}</Text>
          <TouchableOpacity
            style={{ marginTop: 20, backgroundColor: theme.btnPrimary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 }}
            onPress={() => fetchPerformance()}
          >
            <Text style={{ color: theme.btnPrimaryText, fontWeight: "900", fontSize: 15 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} />}
        >

          {/* ── Overall Score Card ── */}
          <View style={{ backgroundColor: theme.bgCard, borderRadius: 20, padding: 28, alignItems: "center", borderWidth: 1, borderColor: theme.border, marginBottom: 20, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}>
            <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: scoreColor + "18", borderWidth: 3, borderColor: scoreColor, alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
              {overallScore != null ? (
                <Text style={{ fontSize: 32, fontWeight: "900", color: scoreColor }}>{overallScore}</Text>
              ) : (
                <Ionicons name="bar-chart-outline" size={36} color={scoreColor} />
              )}
            </View>

            <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "700", marginBottom: 4 }}>Overall Performance</Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 18 }}>
              {overallScore != null ? "average across all sports & categories" : "No performance data yet"}
            </Text>

            {overallScore != null && (
              <>
                <View style={{ width: "100%", height: 8, backgroundColor: theme.border, borderRadius: 4, overflow: "hidden" }}>
                  <View style={{ width: `${overallScore}%` as any, height: "100%", borderRadius: 4, backgroundColor: scoreColor }} />
                </View>
                <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: scoreColor }} />
                  <Text style={{ color: scoreColor, fontSize: 13, fontWeight: "800" }}>
                    {overallScore >= 80 ? "Excellent" : overallScore >= 60 ? "Good" : "Needs Improvement"}
                  </Text>
                </View>
              </>
            )}
          </View>

          {data.length === 0 ? (
            /* ── Empty state ── */
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Ionicons name="bar-chart-outline" size={56} color={theme.border} />
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", marginTop: 16, textAlign: "center" }}>No Performance Data Yet</Text>
              <Text style={{ color: theme.textSub, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
                Once the admin records performance entries for your sports, they will appear here.
              </Text>
            </View>
          ) : (
            <>
              <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900", marginBottom: 12 }}>Performance by Sport</Text>

              {data.map((sport) => {
                const sq = squadLabel(sport.squad_level);
                const hasEntries = TYPE_CONFIG.some(({ key }) => sport.types[key] && sport.types[key]!.entry_count > 0);
                return (
                  <View key={sport.sport_id} style={{ backgroundColor: theme.bgCard, borderRadius: 20, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: theme.border }}>
                    {/* Sport title + squad badge */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                      <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>{sport.sport_name}</Text>
                      <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, backgroundColor: sq.color + "22" }}>
                        <Text style={{ color: sq.color, fontSize: 12, fontWeight: "800" }}>{sq.text}</Text>
                      </View>
                    </View>

                    {!hasEntries ? (
                      <Text style={{ color: theme.textMuted, fontSize: 13, fontStyle: "italic" }}>No performance entries recorded yet.</Text>
                    ) : (
                      TYPE_CONFIG.map(({ key, label, icon, color }) => {
                        const entry = sport.types[key];
                        if (!entry || entry.entry_count === 0) return null;
                        const pct = Math.min(100, entry.avg_score);
                        const badgeColor = getScoreColor(entry.avg_score);
                        return (
                          <View key={key} style={{ backgroundColor: theme.bgCard, borderRadius: 16, borderWidth: 1, borderColor: theme.border, padding: 14, marginBottom: 10 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                              <View style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: color + "22", alignItems: "center", justifyContent: "center" }}>
                                <Ionicons name={icon} size={22} color={color} />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={{ color: theme.text, fontSize: 14, fontWeight: "800", marginBottom: 3 }}>{label}</Text>
                                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                                  <Text style={{ fontSize: 22, fontWeight: "900", color }}>{entry.avg_score.toFixed(1)}</Text>
                                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>avg · {entry.entry_count} {entry.entry_count === 1 ? "entry" : "entries"}</Text>
                                </View>
                              </View>
                              <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: badgeColor + "22" }}>
                                <Text style={{ fontSize: 13, fontWeight: "900", color: badgeColor }}>{Math.round(pct)}%</Text>
                              </View>
                            </View>
                            <View style={{ width: "100%", height: 6, backgroundColor: theme.border, borderRadius: 3, marginTop: 12, overflow: "hidden" }}>
                              <View style={{ width: `${pct}%` as any, height: "100%", borderRadius: 3, backgroundColor: color }} />
                            </View>
                            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
                              <Text style={{ color: theme.textMuted, fontSize: 11 }}>Best: <Text style={{ color: theme.text, fontWeight: "700" }}>{entry.best_score}</Text></Text>
                              <Text style={{ color: theme.textMuted, fontSize: 11 }}>Lowest: <Text style={{ color: theme.text, fontWeight: "700" }}>{entry.lowest_score}</Text></Text>
                            </View>
                          </View>
                        );
                      })
                    )}
                  </View>
                );
              })}

              {/* Eligibility card */}
              <View style={{ backgroundColor: theme.accent + (isDark ? "18" : "14"), borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.accent + "44", marginTop: 4 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: theme.accent + "22", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="trophy" size={22} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800" }}>Colours Eligibility</Text>
                    <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "600", marginTop: 2 }}>Based on your squad/pool status</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border }}>
                  {data.some((s) => s.squad_level === "SQUAD" || s.squad_level === "POOL") ? (
                    <>
                      <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                      <Text style={{ color: "#10B981", fontSize: 15, fontWeight: "800" }}>On Track</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 12, marginLeft: 4 }}>· You are in the Squad or Pool</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="time-outline" size={20} color={theme.textMuted} />
                      <Text style={{ color: theme.textMuted, fontSize: 15, fontWeight: "700" }}>Keep Training</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 12, marginLeft: 4 }}>· Work towards Pool/Squad selection</Text>
                    </>
                  )}
                </View>
              </View>
            </>
          )}

          <View style={{ height: 20 }} />
        </ScrollView>
      )}

      <StudentBottomNav activeRoute="/studentPerformance" />
    </View>
  );
}
