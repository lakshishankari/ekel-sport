import React, { useEffect, useState } from "react";
import {
  View, Text, ScrollView, Pressable, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../lib/themeStore";
import { apiGet } from "../lib/api";

// ─── Types ────────────────────────────────────────────────────
type Session = {
  id: number;
  sport: string;
  sport_id: number;
  session_date: string;
  location: string;
  attendees: number;
  total_enrolled: number;
};

type Attendee = {
  student_user_id: number;
  full_name: string;
  student_id: string;
  squad_level: string;
  attended_at: string | null;
};

// ─── Level config ─────────────────────────────────────────────
type SquadLevel = "NONE" | "POOL" | "SQUAD";
const LEVELS: Record<SquadLevel, { color: string; bg: string }> = {
  NONE:  { color: "#6B7280", bg: "rgba(107,114,128,0.15)" },
  POOL:  { color: "#60A5FA", bg: "rgba(96,165,250,0.15)"  },
  SQUAD: { color: "#D4AF37", bg: "rgba(212,175,55,0.18)"  },
};
function levelCfg(lvl: string) {
  return LEVELS[(lvl as SquadLevel)] ?? LEVELS.NONE;
}

// ─── Component ────────────────────────────────────────────────
export default function AdminAttendanceList() {
  const { theme } = useAppTheme();

  const [sessions, setSessions]   = useState<Session[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Expanded session id + its attendees
  const [expandedId, setExpandedId]       = useState<number | null>(null);
  const [attendees, setAttendees]         = useState<Record<number, Attendee[]>>({});
  const [loadingAtt, setLoadingAtt]       = useState<Record<number, boolean>>({});

  // ── Fetch sessions
  async function fetchSessions(isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await apiGet<Session[]>("/api/admin/attendance/sessions");
      setSessions(data);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { fetchSessions(); }, []);

  // ── Fetch attendees for a session
  async function fetchAttendees(sessionId: number) {
    if (attendees[sessionId]) return; // already loaded
    setLoadingAtt((p) => ({ ...p, [sessionId]: true }));
    try {
      const data = await apiGet<Attendee[]>(`/api/admin/attendance/sessions/${sessionId}/attendees`);
      setAttendees((p) => ({ ...p, [sessionId]: data }));
    } catch {
      setAttendees((p) => ({ ...p, [sessionId]: [] }));
    } finally {
      setLoadingAtt((p) => ({ ...p, [sessionId]: false }));
    }
  }

  // ── Toggle expand
  async function toggleExpand(id: number) {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      await fetchAttendees(id);
    }
  }

  // ── Color helpers
  const rateColor = (pct: number) =>
    pct >= 80 ? "#10B981" : pct >= 60 ? "#F59E0B" : "#EF4444";

  function formatDate(d: string) {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    } catch { return d; }
  }

  // ── Render
  return (
    <Screen>
      <AppHeader
        title="Attendance Sessions"
        subtitle="All training sessions & attendee details"
        showBack
        rightSlot={
          <Pressable
            style={{
              padding: 8, borderRadius: 10, borderWidth: 1,
              backgroundColor: "rgba(212,175,55,0.12)", borderColor: "rgba(212,175,55,0.25)",
            }}
            onPress={() => router.push("/adminCreateSession")}
          >
            <Ionicons name="add" size={22} color="#D4AF37" />
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 14 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchSessions(true)}
            tintColor="#D4AF37"
            colors={["#D4AF37"]}
          />
        }
      >
        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: 60, gap: 12 }}>
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text style={{ color: theme.textSub, fontSize: 14, fontWeight: "600" }}>
              Loading sessions…
            </Text>
          </View>
        ) : sessions.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 60, gap: 10 }}>
            <Ionicons name="clipboard-outline" size={52} color={theme.border} />
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800" }}>No sessions yet</Text>
            <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "600", textAlign: "center" }}>
              Tap + above to create the first attendance session.
            </Text>
          </View>
        ) : (
          sessions.map((session) => {
            const total = session.total_enrolled || 1;
            const rate  = Math.round((Number(session.attendees) / total) * 100);
            const color = rateColor(rate);
            const isExp = expandedId === session.id;
            const list  = attendees[session.id] ?? [];
            const isLoadingAtt = loadingAtt[session.id];

            return (
              <View
                key={session.id}
                style={{
                  marginTop: 14, borderRadius: 20, borderWidth: 1,
                  backgroundColor: theme.bgCard, borderColor: theme.border,
                  overflow: "hidden",
                }}
              >
                {/* ── Card header (always visible) ── */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => toggleExpand(session.id)}
                  style={{ padding: 16 }}
                >
                  {/* Top row: sport name + rate badge */}
                  <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>
                        {session.sport}
                      </Text>

                      {/* Date & Location */}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2, flexWrap: "wrap" }}>
                        <Ionicons name="calendar-outline" size={13} color={theme.textMuted} />
                        <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "600" }}>
                          {formatDate(session.session_date)}
                        </Text>
                        {session.location ? (
                          <>
                            <Text style={{ color: theme.border }}>·</Text>
                            <Ionicons name="location-outline" size={13} color={theme.textMuted} />
                            <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "600" }}>
                              {session.location}
                            </Text>
                          </>
                        ) : null}
                      </View>

                      {/* Attendee count */}
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6 }}>
                        <Ionicons name="people-outline" size={15} color={theme.textMuted} />
                        <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "700" }}>
                          {session.attendees} / {session.total_enrolled} attended
                        </Text>
                      </View>
                    </View>

                    {/* Rate badge + chevron */}
                    <View style={{ alignItems: "flex-end", gap: 8 }}>
                      <View style={{
                        paddingHorizontal: 12, paddingVertical: 6,
                        borderRadius: 12, backgroundColor: color + "22",
                        borderWidth: 1, borderColor: color + "55",
                      }}>
                        <Text style={{ color, fontSize: 17, fontWeight: "900" }}>{rate}%</Text>
                      </View>
                      <Ionicons
                        name={isExp ? "chevron-up" : "chevron-down"}
                        size={18} color={theme.accent}
                      />
                    </View>
                  </View>

                  {/* Progress bar */}
                  <View style={{
                    height: 5, backgroundColor: theme.border, borderRadius: 3,
                    overflow: "hidden", marginTop: 12,
                  }}>
                    <View style={{
                      width: `${Math.min(rate, 100)}%` as any,
                      height: "100%", borderRadius: 3, backgroundColor: color,
                    }} />
                  </View>
                </TouchableOpacity>

                {/* ── Expanded attendee list ── */}
                {isExp && (
                  <View style={{
                    borderTopWidth: 1, borderTopColor: theme.border,
                    backgroundColor: theme.bgInput,
                  }}>
                    {/* Sub-header */}
                    <View style={{
                      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                      paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8,
                    }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                        <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "900", letterSpacing: 1 }}>
                          ATTENDEES ({session.attendees})
                        </Text>
                      </View>
                    </View>

                    {isLoadingAtt ? (
                      <View style={{ alignItems: "center", paddingVertical: 20 }}>
                        <ActivityIndicator size="small" color="#D4AF37" />
                      </View>
                    ) : list.length === 0 ? (
                      <View style={{ alignItems: "center", paddingVertical: 20, gap: 6 }}>
                        <Ionicons name="person-outline" size={28} color={theme.border} />
                        <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "600" }}>
                          No attendance recorded for this session
                        </Text>
                      </View>
                    ) : (
                      <View style={{ paddingHorizontal: 12, paddingBottom: 14, gap: 8 }}>
                        {list.map((att) => {
                          const lc = levelCfg(att.squad_level);
                          return (
                            <View
                              key={att.student_user_id}
                              style={{
                                flexDirection: "row", alignItems: "center", gap: 10,
                                backgroundColor: theme.bgCard, borderRadius: 14,
                                padding: 12, borderWidth: 1, borderColor: theme.border,
                              }}
                            >
                              {/* Avatar */}
                              <View style={{
                                width: 36, height: 36, borderRadius: 11,
                                backgroundColor: "rgba(212,175,55,0.15)", borderWidth: 1,
                                borderColor: "rgba(212,175,55,0.25)",
                                alignItems: "center", justifyContent: "center",
                              }}>
                                <Text style={{ color: "#D4AF37", fontSize: 15, fontWeight: "900" }}>
                                  {att.full_name?.charAt(0)?.toUpperCase()}
                                </Text>
                              </View>

                              {/* Info */}
                              <View style={{ flex: 1 }}>
                                <Text style={{ color: theme.text, fontSize: 14, fontWeight: "800" }} numberOfLines={1}>
                                  {att.full_name}
                                </Text>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                                  <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: "600" }}>
                                    {att.student_id}
                                  </Text>
                                  <View style={{
                                    paddingHorizontal: 6, paddingVertical: 1,
                                    borderRadius: 6, borderWidth: 1,
                                    backgroundColor: lc.bg, borderColor: lc.color,
                                  }}>
                                    <Text style={{ color: lc.color, fontSize: 9.5, fontWeight: "800" }}>
                                      {att.squad_level || "NONE"}
                                    </Text>
                                  </View>
                                </View>
                              </View>

                              {/* Present badge */}
                              <View style={{
                                flexDirection: "row", alignItems: "center", gap: 4,
                                backgroundColor: "#10B98115", paddingHorizontal: 8,
                                paddingVertical: 4, borderRadius: 8, borderWidth: 1,
                                borderColor: "#10B98133",
                              }}>
                                <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                                <Text style={{ color: "#10B981", fontSize: 11, fontWeight: "800" }}>Present</Text>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </Screen>
  );
}
