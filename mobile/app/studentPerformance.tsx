import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, Pressable, StatusBar,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import { apiGet } from "../lib/api";
import { useAppTheme } from "../lib/themeStore";
import StudentBottomNav from "../components/StudentBottomNav";

// ─── Types ───────────────────────────────────────────────────────
type TypeEntry = {
  avg_score:    number;
  entry_count:  number;
  best_score:   number;
  lowest_score: number;
};

type SportPerformance = {
  sport_id:    number;
  sport_name:  string;
  squad_level: "NONE" | "POOL" | "SQUAD";
  types: {
    MATCH?:      TypeEntry;
    FITNESS?:    TypeEntry;
    DISCIPLINE?: TypeEntry;
  };
};

type SportAttendance = {
  sport_id:       number;
  sport_name:     string;
  days_attended:  number;
  total_sessions?: number;
};

// ─── Helpers ─────────────────────────────────────────────────────
const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

function scoreColor(v: number) {
  if (v >= 80) return "#10B981";
  if (v >= 60) return "#F59E0B";
  return "#EF4444";
}

function scoreLabel(v: number) {
  if (v >= 80) return "Excellent";
  if (v >= 60) return "Good";
  return "Needs Work";
}

function squadBadge(level: string) {
  if (level === "SQUAD") return { text: "Squad Member", color: "#D4AF37" };
  if (level === "POOL")  return { text: "Pool Member",  color: "#60A5FA" };
  return                        { text: "Developing",   color: "#9CA3AF" };
}

// ─── Metric row inside a sport card ──────────────────────────────
function MetricRow({
  icon, label, color, value, count, theme,
}: {
  icon: any; label: string; color: string; value: number | null;
  count: number; theme: any;
}) {
  const display = value !== null ? clamp(value) : null;
  const pct     = display ?? 0;
  const col     = display !== null ? scoreColor(display) : "#9CA3AF";

  return (
    <View style={{ marginBottom: 14 }}>
      {/* Label + score */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: color + "22", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name={icon} size={16} color={color} />
          </View>
          <View>
            <Text style={{ color: theme.text, fontSize: 13, fontWeight: "700" }}>{label}</Text>
            {count > 0 && (
              <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 1 }}>
                {count} {label === "Match Performance" ? (count === 1 ? "match" : "matches") : (count === 1 ? "entry" : "entries")} recorded
              </Text>
            )}
          </View>
        </View>

        {/* Score pill */}
        {display !== null ? (
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: col, fontSize: 20, fontWeight: "900" }}>
              {display}
              <Text style={{ fontSize: 12, fontWeight: "600", color: theme.textMuted }}> / 100</Text>
            </Text>
            <Text style={{ color: col, fontSize: 10, fontWeight: "700", marginTop: 1 }}>{scoreLabel(display)}</Text>
          </View>
        ) : (
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>No data</Text>
        )}
      </View>

      {/* Progress bar */}
      <View style={{ height: 7, backgroundColor: theme.border, borderRadius: 99, overflow: "hidden" }}>
        <View style={{ width: `${pct}%`, height: "100%", borderRadius: 99, backgroundColor: display !== null ? col : theme.border }} />
      </View>
    </View>
  );
}

// ─── Overall stat tile ────────────────────────────────────────────
function StatTile({
  icon, label, value, sub, color, theme,
}: {
  icon: any; label: string; value: string; sub?: string; color: string; theme: any;
}) {
  return (
    <View style={{
      flex: 1, backgroundColor: theme.bgCard, borderRadius: 16, padding: 14,
      borderWidth: 1, borderColor: theme.border, alignItems: "center", minWidth: 90,
    }}>
      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: color + "20", alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900" }}>{value}</Text>
      {sub ? <Text style={{ color: color, fontSize: 10, fontWeight: "700", marginTop: 1 }}>{sub}</Text> : null}
      <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "600", marginTop: 4, textAlign: "center" }}>{label}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function StudentPerformance() {
  const { theme, isDark } = useAppTheme();

  const [perfData, setPerfData]   = useState<SportPerformance[]>([]);
  const [attData,  setAttData]    = useState<SportAttendance[]>([]);
  const [loading,  setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  // ── Fetch both performance + attendance together ──────────────
  const fetchAll = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);

      const auth = await loadAuth();
      if (!auth.token || auth.role !== "STUDENT") { router.replace("/login"); return; }

      const [perf, att] = await Promise.all([
        apiGet<SportPerformance[]>("/api/student/performance", auth.token),
        apiGet<SportAttendance[]>("/api/student/attendance",  auth.token),
      ]);

      setPerfData(Array.isArray(perf) ? perf : []);
      setAttData(Array.isArray(att)  ? att  : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load data");
      setPerfData([]);
      setAttData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchAll(true); }, [fetchAll]);

  // ── Aggregate overall score (clamped) ─────────────────────────
  const allScores: number[] = [];
  perfData.forEach((sport) => {
    (["MATCH", "FITNESS", "DISCIPLINE"] as const).forEach((key) => {
      const e = sport.types[key];
      if (e && e.entry_count > 0) allScores.push(clamp(e.avg_score));
    });
  });
  const overallScore = allScores.length > 0
    ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
    : null;

  // ── Aggregate attendance across all sports ─────────────────────
  const totalAttended  = attData.reduce((s, x) => s + (x.days_attended  || 0), 0);
  const totalSessions  = attData.reduce((s, x) => s + (x.total_sessions || 0), 0);
  const overallAttPct  = totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : null;

  // ── Total matches participated across all sports ───────────────
  const totalMatches = perfData.reduce((s, sp) => s + (sp.types.MATCH?.entry_count || 0), 0);

  const ocol = overallScore !== null ? scoreColor(overallScore) : "#9CA3AF";

  // ── Render ────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

      {/* ── Header ── */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, gap: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [{
            width: 40, height: 40, borderRadius: 12,
            alignItems: "center", justifyContent: "center",
            backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border,
          }, pressed && { opacity: 0.7 }]}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900" }}>Performance Overview</Text>
          <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "600", marginTop: 2 }}>Your sports performance summary</Text>
        </View>
      </View>

      {/* ── Body ── */}
      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.textSub, marginTop: 12, fontSize: 14 }}>Loading performance data…</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Ionicons name="wifi-outline" size={56} color="#EF4444" />
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", marginTop: 16, textAlign: "center" }}>Connection Error</Text>
          <Text style={{ color: theme.textSub, textAlign: "center", marginTop: 8, lineHeight: 20 }}>{error}</Text>
          <TouchableOpacity
            style={{ marginTop: 20, backgroundColor: theme.btnPrimary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 }}
            onPress={() => fetchAll()}
          >
            <Text style={{ color: theme.btnPrimaryText, fontWeight: "900", fontSize: 15 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: 48 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} />}
        >

          {/* ══ Overall Score Card ══════════════════════════════ */}
          <View style={{
            backgroundColor: theme.bgCard, borderRadius: 20, padding: 20,
            borderWidth: 1, borderColor: theme.border, marginBottom: 18,
            shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2,
          }}>
            {/* Title */}
            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 16 }}>
              OVERALL PERFORMANCE
            </Text>

            {/* Big score ring + stats row */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
              {/* Circular score */}
              <View style={{
                width: 88, height: 88, borderRadius: 44,
                backgroundColor: ocol + "18",
                borderWidth: 3, borderColor: ocol,
                alignItems: "center", justifyContent: "center",
              }}>
                {overallScore !== null ? (
                  <>
                    <Text style={{ fontSize: 28, fontWeight: "900", color: ocol, lineHeight: 32 }}>{overallScore}</Text>
                    <Text style={{ fontSize: 10, fontWeight: "700", color: ocol }}>/ 100</Text>
                  </>
                ) : (
                  <Ionicons name="bar-chart-outline" size={32} color="#9CA3AF" />
                )}
              </View>

              {/* Stats */}
              <View style={{ flex: 1, gap: 10 }}>
                {overallScore !== null && (
                  <>
                    {/* Progress bar */}
                    <View style={{ height: 8, backgroundColor: theme.border, borderRadius: 99, overflow: "hidden" }}>
                      <View style={{ width: `${overallScore}%`, height: "100%", borderRadius: 99, backgroundColor: ocol }} />
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: ocol }} />
                      <Text style={{ color: ocol, fontSize: 13, fontWeight: "800" }}>{scoreLabel(overallScore)}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 12 }}>· combined average</Text>
                    </View>
                  </>
                )}
                {overallScore === null && (
                  <Text style={{ color: theme.textMuted, fontSize: 13, lineHeight: 18 }}>
                    No performance data recorded yet.
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* ══ Key Metrics Row ══════════════════════════════════ */}
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
            <StatTile
              icon="trophy-outline"
              label="Matches Played"
              value={String(totalMatches)}
              sub={totalMatches === 0 ? undefined : "total"}
              color="#C9A227"
              theme={theme}
            />
            <StatTile
              icon="calendar-outline"
              label="Sessions Attended"
              value={String(totalAttended)}
              sub={totalSessions > 0 ? `of ${totalSessions}` : undefined}
              color="#3B82F6"
              theme={theme}
            />
            <StatTile
              icon="stats-chart-outline"
              label="Attendance Rate"
              value={overallAttPct !== null ? `${overallAttPct}%` : "—"}
              sub={overallAttPct !== null ? (overallAttPct >= 80 ? "On Track" : overallAttPct >= 60 ? "Moderate" : "Low") : undefined}
              color={overallAttPct !== null ? scoreColor(overallAttPct) : "#9CA3AF"}
              theme={theme}
            />
          </View>

          {/* ══ Per-Sport Breakdown ═══════════════════════════════ */}
          {perfData.length === 0 ? (
            <View style={{ alignItems: "center", paddingVertical: 40, gap: 12 }}>
              <Ionicons name="bar-chart-outline" size={56} color={theme.border} />
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", textAlign: "center" }}>No Performance Data Yet</Text>
              <Text style={{ color: theme.textSub, textAlign: "center", fontSize: 14, lineHeight: 20 }}>
                Once the admin records performance entries for your sports, they will appear here.
              </Text>
            </View>
          ) : (
            <>
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: "800", marginBottom: 12 }}>
                Performance by Sport
              </Text>

              {perfData.map((sport) => {
                const sq = squadBadge(sport.squad_level);

                // Per-type clamped values
                const match = sport.types.MATCH;
                const fitness = sport.types.FITNESS;
                const discipline = sport.types.DISCIPLINE;

                // Attendance for this sport
                const att = attData.find(a => a.sport_id === sport.sport_id);
                const attPct = att?.total_sessions
                  ? Math.round((att.days_attended / att.total_sessions) * 100)
                  : null;

                return (
                  <View key={sport.sport_id} style={{
                    backgroundColor: theme.bgCard, borderRadius: 20, padding: 18,
                    marginBottom: 16, borderWidth: 1, borderColor: theme.border,
                  }}>
                    {/* Sport header */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                      <View>
                        <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>{sport.sport_name}</Text>
                        {att && (
                          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                            {att.days_attended} / {att.total_sessions ?? "?"} sessions attended
                            {attPct !== null ? `  ·  ${attPct}%` : ""}
                          </Text>
                        )}
                      </View>
                      <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, backgroundColor: sq.color + "22" }}>
                        <Text style={{ color: sq.color, fontSize: 11, fontWeight: "800" }}>{sq.text}</Text>
                      </View>
                    </View>

                    {/* ── Score metrics ── */}
                    <MetricRow
                      icon="trophy-outline"
                      label="Match Performance"
                      color="#C9A227"
                      value={match ? match.avg_score : null}
                      count={match?.entry_count ?? 0}
                      theme={theme}
                    />
                    <MetricRow
                      icon="barbell-outline"
                      label="Fitness Tests"
                      color="#10B981"
                      value={fitness ? fitness.avg_score : null}
                      count={fitness?.entry_count ?? 0}
                      theme={theme}
                    />
                    <MetricRow
                      icon="ribbon-outline"
                      label="Discipline"
                      color="#6366F1"
                      value={discipline ? discipline.avg_score : null}
                      count={discipline?.entry_count ?? 0}
                      theme={theme}
                    />

                    {/* ── Attendance bar (if data exists) ── */}
                    {att && att.total_sessions ? (
                      <View style={{
                        marginTop: 6, paddingTop: 14,
                        borderTopWidth: 1, borderTopColor: theme.border,
                      }}>
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <View style={{ width: 32, height: 32, borderRadius: 9, backgroundColor: "#3B82F622", alignItems: "center", justifyContent: "center" }}>
                              <Ionicons name="calendar-outline" size={16} color="#3B82F6" />
                            </View>
                            <View>
                              <Text style={{ color: theme.text, fontSize: 13, fontWeight: "700" }}>Attendance</Text>
                              <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: 1 }}>
                                {att.days_attended} of {att.total_sessions} sessions
                              </Text>
                            </View>
                          </View>
                          <View style={{ alignItems: "flex-end" }}>
                            <Text style={{ color: attPct !== null ? scoreColor(attPct) : "#9CA3AF", fontSize: 20, fontWeight: "900" }}>
                              {attPct !== null ? `${attPct}` : "—"}
                              <Text style={{ fontSize: 12, fontWeight: "600", color: theme.textMuted }}>{attPct !== null ? " %" : ""}</Text>
                            </Text>
                            {attPct !== null && (
                              <Text style={{ color: scoreColor(attPct), fontSize: 10, fontWeight: "700", marginTop: 1 }}>
                                {scoreLabel(attPct)}
                              </Text>
                            )}
                          </View>
                        </View>
                        <View style={{ height: 7, backgroundColor: theme.border, borderRadius: 99, overflow: "hidden" }}>
                          <View style={{
                            width: `${attPct ?? 0}%`, height: "100%",
                            borderRadius: 99,
                            backgroundColor: attPct !== null ? scoreColor(attPct) : theme.border,
                          }} />
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })}

              {/* ── Eligibility Card ── */}
              <View style={{
                backgroundColor: theme.accent + (isDark ? "18" : "12"),
                borderRadius: 16, padding: 16,
                borderWidth: 1, borderColor: theme.accent + "44",
                marginTop: 4,
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                  <View style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: theme.accent + "22", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="trophy" size={20} color={theme.accent} />
                  </View>
                  <View>
                    <Text style={{ color: theme.text, fontSize: 15, fontWeight: "800" }}>Colours Eligibility</Text>
                    <Text style={{ color: theme.textSub, fontSize: 12, marginTop: 2 }}>Based on squad / pool status</Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border }}>
                  {perfData.some((s) => s.squad_level === "SQUAD" || s.squad_level === "POOL") ? (
                    <>
                      <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                      <Text style={{ color: "#10B981", fontSize: 14, fontWeight: "800" }}>On Track</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 12, marginLeft: 2 }}>· You are in the Squad or Pool</Text>
                    </>
                  ) : (
                    <>
                      <Ionicons name="time-outline" size={18} color={theme.textMuted} />
                      <Text style={{ color: theme.textMuted, fontSize: 14, fontWeight: "700" }}>Keep Training</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 12, marginLeft: 2 }}>· Work towards Pool / Squad</Text>
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
