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
  session_name: string | null;
  location: string;
  attendees: number;          // total with a record
  present_count: number;
  absent_count: number;
  total_enrolled: number;
};

type Attendee = {
  student_user_id: number;
  full_name: string;
  student_id: string;
  squad_level: string;
  status: string;
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

  const [sessions, setSessions]     = useState<Session[]>([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Expanded session id + its attendees
  const [expandedId, setExpandedId]   = useState<number | null>(null);
  const [attendees, setAttendees]     = useState<Record<number, Attendee[]>>({});
  const [loadingAtt, setLoadingAtt]   = useState<Record<number, boolean>>({});

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

  // ── Fetch attendees for a session (with status breakdown)
  async function fetchAttendees(sessionId: number) {
    if (attendees[sessionId]) return;
    setLoadingAtt((p) => ({ ...p, [sessionId]: true }));
    try {
      const data = await apiGet<Attendee[]>(
        `/api/admin/attendance/sessions/${sessionId}/attendees`
      );
      setAttendees((p) => ({ ...p, [sessionId]: data }));
    } catch {
      setAttendees((p) => ({ ...p, [sessionId]: [] }));
    } finally {
      setLoadingAtt((p) => ({ ...p, [sessionId]: false }));
    }
  }

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

  // ── Navigate to mark/edit screen
  function openMarkScreen(session: Session) {
    router.push({
      pathname: "/adminMarkAttendance" as any,
      params: {
        sessionId:   String(session.id),
        sport:       session.sport,
        location:    session.location,
        sessionDate: session.session_date,
        sessionName: session.session_name ?? "",
      },
    });
  }

  // ── Render
  return (
    <Screen>
      <AppHeader
        title="Attendance Sessions"
        subtitle="All training sessions & attendance records"
        showBack
                  backRoute="/adminHome"
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
            <Pressable
              onPress={() => router.push("/adminCreateSession")}
              style={{
                marginTop: 8, backgroundColor: "#D4AF37", borderRadius: 12,
                paddingVertical: 12, paddingHorizontal: 28, flexDirection: "row", gap: 8, alignItems: "center",
              }}
            >
              <Ionicons name="add" size={18} color="#111827" />
              <Text style={{ color: "#111827", fontWeight: "900", fontSize: 15 }}>Create Session</Text>
            </Pressable>
          </View>
        ) : (
          sessions.map((session) => {
            const total     = session.total_enrolled || 1;
            const marked    = Number(session.present_count || 0) + Number(session.absent_count || 0);
            const present   = Number(session.present_count || 0);
            const absent    = Number(session.absent_count  || 0);
            const rate      = Math.round((present / total) * 100);
            const color     = rateColor(rate);
            const isExp     = expandedId === session.id;
            const list      = attendees[session.id] ?? [];
            const isLoadingAtt = loadingAtt[session.id];

            return (
              <View
                key={session.id}
                style={{
                  marginTop: 14, borderRadius: 20, borderWidth: 1,
                  backgroundColor: theme.bgCard, borderColor: isExp ? "rgba(212,175,55,0.35)" : theme.border,
                  overflow: "hidden",
                }}
              >
                {/* ── Card header ── */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => toggleExpand(session.id)}
                  style={{ padding: 16 }}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>
                        {session.sport}
                        {session.session_name ? ` · ${session.session_name}` : ""}
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

                      {/* Status chips */}
                      <View style={{ flexDirection: "row", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#10B98115", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: "#10B98133" }}>
                          <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                          <Text style={{ color: "#10B981", fontSize: 11, fontWeight: "800" }}>{present} Present</Text>
                        </View>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EF444415", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: "#EF444433" }}>
                          <Ionicons name="close-circle" size={12} color="#EF4444" />
                          <Text style={{ color: "#EF4444", fontSize: 11, fontWeight: "800" }}>{absent} Absent</Text>
                        </View>
                        {session.total_enrolled - marked > 0 && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#6B728015", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: "#6B728033" }}>
                            <Ionicons name="help-circle-outline" size={12} color="#6B7280" />
                            <Text style={{ color: "#6B7280", fontSize: 11, fontWeight: "800" }}>{session.total_enrolled - marked} Unmarked</Text>
                          </View>
                        )}
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

                {/* ── Mark / Edit button ── */}
                <TouchableOpacity
                  onPress={() => openMarkScreen(session)}
                  style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "center",
                    gap: 8, paddingVertical: 11, borderTopWidth: 1, borderTopColor: theme.border,
                    backgroundColor: "rgba(212,175,55,0.07)",
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="pencil-outline" size={16} color="#D4AF37" />
                  <Text style={{ color: "#D4AF37", fontSize: 13, fontWeight: "800" }}>
                    {marked > 0 ? "Edit Attendance" : "Mark Attendance"}
                  </Text>
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
                        <Ionicons name="list-outline" size={14} color="#D4AF37" />
                        <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "900", letterSpacing: 1 }}>
                          MARKED RECORDS ({list.length})
                        </Text>
                      </View>
                    </View>

                    {isLoadingAtt ? (
                      <View style={{ alignItems: "center", paddingVertical: 20 }}>
                        <ActivityIndicator size="small" color="#D4AF37" />
                      </View>
                    ) : list.length === 0 ? (
                      <View style={{ alignItems: "center", paddingVertical: 20, gap: 6 }}>
                        <Ionicons name="clipboard-outline" size={28} color={theme.border} />
                        <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "600" }}>
                          No records yet — tap Edit Attendance above
                        </Text>
                      </View>
                    ) : (
                      <View style={{ paddingHorizontal: 12, paddingBottom: 14, gap: 8 }}>
                        {list.map((att) => {
                          const lc = levelCfg(att.squad_level);
                          const isPresent = att.status === "PRESENT";
                          const initials  = att.full_name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
                          return (
                            <View
                              key={att.student_user_id}
                              style={{
                                flexDirection: "row", alignItems: "center", gap: 10,
                                backgroundColor: theme.bgCard, borderRadius: 14,
                                padding: 12, borderWidth: 1,
                                borderColor: isPresent ? "#10B98133" : "#EF444433",
                              }}
                            >
                              {/* Avatar */}
                              <View style={{
                                width: 36, height: 36, borderRadius: 11,
                                backgroundColor: isPresent ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
                                borderWidth: 1,
                                borderColor: isPresent ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)",
                                alignItems: "center", justifyContent: "center",
                              }}>
                                <Text style={{ color: isPresent ? "#10B981" : "#EF4444", fontSize: 15, fontWeight: "900" }}>
                                  {initials}
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

                              {/* Status badge */}
                              <View style={{
                                flexDirection: "row", alignItems: "center", gap: 4,
                                backgroundColor: isPresent ? "#10B98115" : "#EF444415",
                                paddingHorizontal: 8, paddingVertical: 4,
                                borderRadius: 8, borderWidth: 1,
                                borderColor: isPresent ? "#10B98133" : "#EF444433",
                              }}>
                                <Ionicons
                                  name={isPresent ? "checkmark-circle" : "close-circle"}
                                  size={13}
                                  color={isPresent ? "#10B981" : "#EF4444"}
                                />
                                <Text style={{ color: isPresent ? "#10B981" : "#EF4444", fontSize: 11, fontWeight: "800" }}>
                                  {att.status}
                                </Text>
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
