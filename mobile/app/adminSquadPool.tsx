import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import { apiGet, apiPost, apiDelete } from "../lib/api";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../lib/themeStore";

// ─── Types ────────────────────────────────────────────────────────────────────
type Sport  = { id: number; name: string };
type SquadLevel = "NONE" | "POOL" | "SQUAD";

type StudentStat = {
  student_user_id: number;
  full_name: string;
  student_id: string;
  squad_level: SquadLevel;
  attendance_count: number;
  avg_score: number | null;
  match_entries: number;
  fitness_entries: number;
  discipline_entries: number;
  in_team: number;
};

type SportEvent = {
  id: number;
  title: string;
  description: string | null;
  sport_tag: string | null;
  venue: string | null;
  event_date: string | null;
  event_time: string | null;
  created_at: string;
};

type EventMember = {
  student_user_id: number;
  full_name: string;
  student_id: string;
  squad_level: string;
  avg_score: number;
};

type SquadMember = {
  student_user_id: number;
  full_name: string;
  student_id: string;
  squad_level: string;
  avg_score: number;
  attendance_count: number;
};

// ─── Level config ─────────────────────────────────────────────────────────────
const LEVELS: { key: SquadLevel; label: string; color: string; bg: string }[] = [
  { key: "NONE",  label: "None",  color: "#6B7280", bg: "rgba(107,114,128,0.15)" },
  { key: "POOL",  label: "Pool",  color: "#60A5FA", bg: "rgba(96,165,250,0.15)"  },
  { key: "SQUAD", label: "Squad", color: "#D4AF37", bg: "rgba(212,175,55,0.18)"  },
];

function levelConfig(key: SquadLevel) {
  return LEVELS.find((l) => l.key === key) ?? LEVELS[0];
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdminSquadPool() {
  const { theme } = useAppTheme();

  // Auth guard
  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "ADMIN") router.replace("/login");
    })();
  }, []);

  // ── Main tab: "squad" or "events"
  const [activeTab, setActiveTab] = useState<"squad" | "events">("squad");

  // ── Sports
  const [sports, setSports] = useState<Sport[]>([]);
  const [sportId, setSportId] = useState<number | null>(null);
  const [loadingSports, setLoadingSports] = useState(true);

  // ── Squad/Pool tab
  const [students, setStudents]           = useState<StudentStat[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [refreshing, setRefreshing]       = useState(false);
  const [saving, setSaving]               = useState<Record<number, "level" | "team" | null>>({});

  // ── Event Team tab
  const [events, setEvents]               = useState<SportEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [eventExpanded, setEventExpanded] = useState(false);
  const [squadMembers, setSquadMembers]   = useState<SquadMember[]>([]);
  const [eventTeam, setEventTeam]         = useState<EventMember[]>([]);
  const [loadingSquad, setLoadingSquad]   = useState(false);
  const [loadingTeam, setLoadingTeam]     = useState(false);
  const [togglingMember, setTogglingMember] = useState<Record<number, boolean>>({});

  // ── Load ALL sports on mount (not just those with enrollments)
  useEffect(() => { fetchSports(); }, []);

  async function fetchSports() {
    try {
      setLoadingSports(true);
      // Use /api/admin/sports to get ALL sports, not just enrolled ones
      const data = await apiGet<Sport[]>("/api/admin/sports");
      setSports(data);
      if (data.length > 0) setSportId(data[0].id);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load sports");
    } finally {
      setLoadingSports(false);
    }
  }

  // ── Load students when sport changes ─────────────────────────────────────
  useEffect(() => {
    if (sportId !== null) {
      fetchStudents(sportId);
      fetchEvents(sportId);
    }
  }, [sportId]);

  async function fetchStudents(sid: number, pullRefresh = false) {
    try {
      if (pullRefresh) setRefreshing(true);
      else setLoadingStudents(true);
      const data = await apiGet<StudentStat[]>(`/api/admin/squad-pool/${sid}`);
      // Sort by avg_score desc (highest first)
      const sorted = [...data].sort((a, b) => (b.avg_score ?? 0) - (a.avg_score ?? 0));
      setStudents(sorted);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load students");
    } finally {
      setLoadingStudents(false);
      setRefreshing(false);
    }
  }

  async function fetchEvents(sid: number) {
    try {
      setLoadingEvents(true);
      const data = await apiGet<SportEvent[]>(`/api/admin/events/by-sport/${sid}`);
      setEvents(data);
      if (data.length > 0 && selectedEventId === null) {
        setSelectedEventId(data[0].id);
        fetchEventTeam(data[0].id);
      }
    } catch (e: any) {
      // silently handle — might be no events yet
    } finally {
      setLoadingEvents(false);
    }
  }

  async function fetchSquadMembers(sid: number) {
    try {
      setLoadingSquad(true);
      const data = await apiGet<SquadMember[]>(`/api/admin/squad-pool/${sid}/squad-members`);
      setSquadMembers(data);
    } catch {
      setSquadMembers([]);
    } finally {
      setLoadingSquad(false);
    }
  }

  async function fetchEventTeam(eid: number) {
    try {
      setLoadingTeam(true);
      const data = await apiGet<EventMember[]>(`/api/admin/event-team/${eid}`);
      setEventTeam(data);
    } catch {
      setEventTeam([]);
    } finally {
      setLoadingTeam(false);
    }
  }

  // When switching to Events tab, load squad members
  useEffect(() => {
    if (activeTab === "events" && sportId !== null) {
      fetchSquadMembers(sportId);
      if (selectedEventId !== null) fetchEventTeam(selectedEventId);
    }
  }, [activeTab, sportId]);

  const onRefresh = useCallback(() => {
    if (sportId !== null) fetchStudents(sportId, true);
  }, [sportId]);

  // ── Set squad level ───────────────────────────────────────────────────────
  async function setLevel(student: StudentStat, level: SquadLevel) {
    if (saving[student.student_user_id]) return;
    setStudents((prev) =>
      prev.map((s) => s.student_user_id === student.student_user_id ? { ...s, squad_level: level } : s)
    );
    setSaving((p) => ({ ...p, [student.student_user_id]: "level" }));
    try {
      await apiPost(`/api/admin/squad-pool/${sportId}/${student.student_user_id}/level`, { level });
    } catch (e: any) {
      setStudents((prev) =>
        prev.map((s) => s.student_user_id === student.student_user_id ? { ...s, squad_level: student.squad_level } : s)
      );
      Alert.alert("Failed", e.message || "Could not update level");
    } finally {
      setSaving((p) => ({ ...p, [student.student_user_id]: null }));
    }
  }

  // ── Toggle general team ───────────────────────────────────────────────────
  async function toggleTeam(student: StudentStat) {
    if (saving[student.student_user_id]) return;
    const nextInTeam = student.in_team === 0 ? 1 : 0;
    setStudents((prev) =>
      prev.map((s) => s.student_user_id === student.student_user_id ? { ...s, in_team: nextInTeam } : s)
    );
    setSaving((p) => ({ ...p, [student.student_user_id]: "team" }));
    try {
      await apiPost(`/api/admin/squad-pool/${sportId}/${student.student_user_id}/team`, { inTeam: nextInTeam === 1 });
    } catch (e: any) {
      setStudents((prev) =>
        prev.map((s) => s.student_user_id === student.student_user_id ? { ...s, in_team: student.in_team } : s)
      );
      Alert.alert("Failed", e.message || "Could not update team");
    } finally {
      setSaving((p) => ({ ...p, [student.student_user_id]: null }));
    }
  }

  // ── Toggle event team member ───────────────────────────────────────────────
  async function toggleEventMember(member: SquadMember) {
    if (!selectedEventId || !sportId) return;
    const isInTeam = eventTeam.some((m) => m.student_user_id === member.student_user_id);
    setTogglingMember((p) => ({ ...p, [member.student_user_id]: true }));
    try {
      if (isInTeam) {
        await apiDelete(`/api/admin/event-team/${selectedEventId}/${member.student_user_id}`);
        setEventTeam((prev) => prev.filter((m) => m.student_user_id !== member.student_user_id));
      } else {
        await apiPost(`/api/admin/event-team/${selectedEventId}/assign`, {
          studentUserId: member.student_user_id,
          sportId,
        });
        setEventTeam((prev) => [...prev, {
          student_user_id: member.student_user_id,
          full_name: member.full_name,
          student_id: member.student_id,
          squad_level: member.squad_level,
          avg_score: member.avg_score,
        }]);
      }
    } catch (e: any) {
      Alert.alert("Failed", e.message || "Could not update event team");
    } finally {
      setTogglingMember((p) => ({ ...p, [member.student_user_id]: false }));
    }
  }

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const sportName = sports.find((s) => s.id === sportId)?.name ?? "";

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <Screen>
      <AppHeader
        title="Squad & Pool"
        subtitle="Manage levels, teams and event rosters"
        showBack
                backRoute="/adminHome"
      />

      {/* ── Sport chips ── */}
      {loadingSports ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.accent} size="large" />
        </View>
      ) : sports.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="football-outline" size={44} color={theme.border} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No Sports Available</Text>
          <Text style={[styles.emptySub, { color: theme.textSub }]}>Add sports from the Sports screen first.</Text>
        </View>
      ) : (
        <>
          {/* Sport selector */}
          <View style={styles.chipSection}>
            <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>SELECT SPORT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sportChips}>
              {sports.map((s) => {
                const active = s.id === sportId;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.sportChip,
                      { backgroundColor: theme.bgInput, borderColor: theme.border },
                      active && { backgroundColor: "rgba(212,175,55,0.18)", borderColor: "#D4AF37" },
                    ]}
                    onPress={() => { setSportId(s.id); setSelectedEventId(null); setEventTeam([]); }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.sportChipText, { color: theme.textSub }, active && { color: "#D4AF37" }]}>{s.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Tab switcher ── */}
          <View style={[styles.tabRow, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "squad" && { backgroundColor: "rgba(212,175,55,0.12)" }]}
              onPress={() => setActiveTab("squad")}
              activeOpacity={0.8}
            >
              <Ionicons name="people-outline" size={15} color={activeTab === "squad" ? "#D4AF37" : theme.textMuted} />
              <Text style={[styles.tabText, { color: theme.textMuted }, activeTab === "squad" && { color: "#D4AF37" }]}>Pool & Squad</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "events" && { backgroundColor: "rgba(212,175,55,0.12)" }]}
              onPress={() => setActiveTab("events")}
              activeOpacity={0.8}
            >
              <Ionicons name="trophy-outline" size={15} color={activeTab === "events" ? "#D4AF37" : theme.textMuted} />
              <Text style={[styles.tabText, { color: theme.textMuted }, activeTab === "events" && { color: "#D4AF37" }]}>Event Team</Text>
            </TouchableOpacity>
          </View>

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 1: Pool & Squad */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === "squad" && (
            <>
              {/* Legend */}
              <View style={[styles.legend, { borderBottomColor: theme.border }]}>
                {LEVELS.map((l) => (
                  <View key={l.key} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                    <Text style={[styles.legendText, { color: theme.textSub }]}>{l.label}</Text>
                  </View>
                ))}
                <View style={styles.legendItem}>
                  <Ionicons name="shield-checkmark" size={12} color="#34D399" />
                  <Text style={[styles.legendText, { color: theme.textSub }]}>Team</Text>
                </View>
                <Text style={[styles.legendHint, { color: theme.textMuted }]}>Sorted: Highest → Lowest score</Text>
              </View>

              {loadingStudents ? (
                <View style={styles.centered}>
                  <ActivityIndicator color={theme.accent} size="large" />
                  <Text style={[styles.loadingText, { color: theme.textMuted }]}>Loading students…</Text>
                </View>
              ) : (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.listContent}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} />
                  }
                >
                  {students.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Ionicons name="people-outline" size={44} color={theme.border} />
                      <Text style={[styles.emptyTitle, { color: theme.text }]}>No Students Found</Text>
                      <Text style={[styles.emptySub, { color: theme.textSub }]}>No approved students for this sport yet.</Text>
                    </View>
                  ) : (
                    students.map((student, idx) => {
                      const lc = levelConfig(student.squad_level ?? "NONE");
                      const isSaving = saving[student.student_user_id];
                      const inTeam = student.in_team === 1;

                      return (
                        <View key={student.student_user_id} style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                          {/* Rank badge */}
                          <View style={[styles.rankBadge, { backgroundColor: "rgba(212,175,55,0.1)", borderColor: "rgba(212,175,55,0.2)" }]}>
                            <Text style={styles.rankText}>#{idx + 1}</Text>
                          </View>

                          {/* Card header */}
                          <View style={styles.cardHeader}>
                            <View style={styles.avatarCircle}>
                              <Text style={styles.avatarText}>
                                {student.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                              </Text>
                            </View>

                            <View style={{ flex: 1 }}>
                              <View style={styles.nameRow}>
                                <Text style={[styles.studentName, { color: theme.text }]} numberOfLines={1}>{student.full_name}</Text>
                                {inTeam && (
                                  <View style={styles.teamBadge}>
                                    <Ionicons name="shield-checkmark" size={10} color="#34D399" />
                                    <Text style={styles.teamBadgeText}>TEAM</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={[styles.studentId, { color: theme.textMuted }]}>{student.student_id}</Text>
                            </View>

                            <View style={[styles.levelBadge, { backgroundColor: lc.bg, borderColor: lc.color }]}>
                              <Text style={[styles.levelBadgeText, { color: lc.color }]}>{lc.label}</Text>
                            </View>
                          </View>

                          {/* Stats row */}
                          <View style={[styles.statsRow, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
                            <View style={styles.statItem}>
                              <Ionicons name="star" size={13} color="#F59E0B" />
                              <Text style={[styles.statValue, { color: theme.text }]}>{student.avg_score != null ? student.avg_score : "—"}</Text>
                              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Avg Score</Text>
                            </View>
                            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                            <View style={styles.statItem}>
                              <Ionicons name="calendar-outline" size={13} color="#60A5FA" />
                              <Text style={[styles.statValue, { color: theme.text }]}>{student.attendance_count ?? 0}</Text>
                              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Sessions</Text>
                            </View>
                            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                            <View style={styles.statItem}>
                              <Ionicons name="trophy-outline" size={13} color="#D4AF37" />
                              <Text style={[styles.statValue, { color: theme.text }]}>{student.match_entries ?? 0}</Text>
                              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Matches</Text>
                            </View>
                            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
                            <View style={styles.statItem}>
                              <Ionicons name="barbell-outline" size={13} color="#A78BFA" />
                              <Text style={[styles.statValue, { color: theme.text }]}>{student.fitness_entries ?? 0}</Text>
                              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Fitness</Text>
                            </View>
                          </View>

                          {/* Level selectors */}
                          <View style={styles.actionsSection}>
                            <Text style={[styles.actionLabel, { color: theme.textMuted }]}>ASSIGN LEVEL</Text>
                            <View style={styles.levelBtns}>
                              {LEVELS.map((l) => {
                                const active = (student.squad_level ?? "NONE") === l.key;
                                return (
                                  <TouchableOpacity
                                    key={l.key}
                                    style={[
                                      styles.levelBtn,
                                      { backgroundColor: theme.bgInput, borderColor: theme.border },
                                      active && { backgroundColor: l.bg, borderColor: l.color },
                                    ]}
                                    onPress={() => setLevel(student, l.key)}
                                    disabled={!!isSaving}
                                    activeOpacity={0.75}
                                  >
                                    {isSaving === "level" && active ? (
                                      <ActivityIndicator size={12} color={l.color} />
                                    ) : (
                                      <Text style={[styles.levelBtnText, { color: theme.textSub }, active && { color: l.color }]}>{l.label}</Text>
                                    )}
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </View>

                          {/* Team toggle */}
                          <TouchableOpacity
                            style={[styles.teamBtn, inTeam && styles.teamBtnActive]}
                            onPress={() => toggleTeam(student)}
                            disabled={!!isSaving}
                            activeOpacity={0.8}
                          >
                            {isSaving === "team" ? (
                              <ActivityIndicator size={14} color={inTeam ? "#111827" : "#34D399"} />
                            ) : (
                              <>
                                <Ionicons name={inTeam ? "shield-checkmark" : "shield-outline"} size={15} color={inTeam ? "#111827" : "#34D399"} />
                                <Text style={[styles.teamBtnText, inTeam && styles.teamBtnTextActive]}>
                                  {inTeam ? "In General Team — Tap to Remove" : "Add to General Team"}
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  )}
                  <View style={{ height: 30 }} />
                </ScrollView>
              )}
            </>
          )}

          {/* ══════════════════════════════════════════════════════════ */}
          {/* TAB 2: Event Team */}
          {/* ══════════════════════════════════════════════════════════ */}
          {activeTab === "events" && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {/* Event selector dropdown */}
              <View style={styles.eventSelectorSection}>
                <Text style={[styles.sectionLabel, { color: theme.textMuted }]}>SELECT EVENT</Text>
                {loadingEvents ? (
                  <ActivityIndicator color={theme.accent} style={{ marginTop: 12 }} />
                ) : events.length === 0 ? (
                  <View style={[styles.noEventsBox, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
                    <Ionicons name="calendar-outline" size={28} color={theme.border} />
                    <Text style={[styles.noEventsText, { color: theme.text }]}>No events created for {sportName} yet.</Text>
                    <Text style={[styles.noEventsHint, { color: theme.textSub }]}>Create an event from the Events screen first.</Text>
                  </View>
                ) : (
                  <>
                    {/* Accordion trigger */}
                    <TouchableOpacity
                      style={[styles.eventDropdown, { backgroundColor: theme.bgCard, borderColor: "rgba(212,175,55,0.3)" }]}
                      onPress={() => setEventExpanded(!eventExpanded)}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.eventDropdownTitle, { color: theme.text }]} numberOfLines={1}>
                          {selectedEvent ? selectedEvent.title : "Select an event"}
                        </Text>
                        {selectedEvent?.event_date && (
                          <Text style={[styles.eventDropdownSub, { color: theme.textMuted }]}>
                            {selectedEvent.event_date}{selectedEvent.event_time ? ` · ${selectedEvent.event_time}` : ""}
                            {selectedEvent.venue ? ` · ${selectedEvent.venue}` : ""}
                          </Text>
                        )}
                      </View>
                      <Ionicons
                        name={eventExpanded ? "chevron-up" : "chevron-down"}
                        size={20}
                        color="#D4AF37"
                      />
                    </TouchableOpacity>

                    {/* Dropdown list */}
                    {eventExpanded && (
                      <View style={[styles.eventDropdownList, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                        {events.map((evt) => {
                          const isSel = evt.id === selectedEventId;
                          return (
                            <TouchableOpacity
                              key={evt.id}
                              style={[
                                styles.eventDropdownItem,
                                { borderBottomColor: theme.border },
                                isSel && { backgroundColor: "rgba(212,175,55,0.08)" },
                              ]}
                              onPress={() => {
                                setSelectedEventId(evt.id);
                                setEventExpanded(false);
                                fetchEventTeam(evt.id);
                                if (sportId) fetchSquadMembers(sportId);
                              }}
                              activeOpacity={0.8}
                            >
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.eventDropdownItemTitle, { color: theme.text }, isSel && { color: "#D4AF37" }]} numberOfLines={1}>
                                  {evt.title}
                                </Text>
                                {evt.event_date && (
                                  <Text style={[styles.eventDropdownItemSub, { color: theme.textMuted }]}>
                                    {evt.event_date}{evt.event_time ? ` · ${evt.event_time}` : ""}
                                  </Text>
                                )}
                              </View>
                              {isSel && <Ionicons name="checkmark-circle" size={18} color="#D4AF37" />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </>
                )}
              </View>

              {/* Current Event Team */}
              {selectedEventId !== null && (
                <>
                  <View style={styles.eventTeamHeader}>
                    <View>
                      <Text style={[styles.eventTeamTitle, { color: theme.text }]}>Event Team</Text>
                      <Text style={[styles.eventTeamSub, { color: theme.textSub }]}>
                        {loadingTeam ? "Loading…" : `${eventTeam.length} member${eventTeam.length !== 1 ? "s" : ""} selected`}
                      </Text>
                    </View>
                    <View style={styles.eventTeamCountBadge}>
                      <Text style={styles.eventTeamCount}>{eventTeam.length}</Text>
                    </View>
                  </View>

                  {/* Squad members to choose from */}
                  <Text style={[styles.sectionLabel2, { color: theme.textMuted }]}>POOL & SQUAD MEMBERS — RANK BY SCORE</Text>
                  {loadingSquad ? (
                    <View style={styles.centered}>
                      <ActivityIndicator color={theme.accent} />
                    </View>
                  ) : squadMembers.length === 0 ? (
                    <View style={[styles.noEventsBox, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
                      <Ionicons name="people-outline" size={28} color={theme.border} />
                      <Text style={[styles.noEventsText, { color: theme.text }]}>No Pool/Squad members yet.</Text>
                      <Text style={[styles.noEventsHint, { color: theme.textSub }]}>Assign students to Pool or Squad first.</Text>
                    </View>
                  ) : (
                    <View style={{ paddingHorizontal: 14, gap: 10 }}>
                      {squadMembers.map((member, idx) => {
                        const isInTeam = eventTeam.some((m) => m.student_user_id === member.student_user_id);
                        const isToggling = togglingMember[member.student_user_id];
                        const lc = levelConfig((member.squad_level as SquadLevel) ?? "NONE");

                        return (
                          <View
                            key={member.student_user_id}
                            style={[
                              styles.eventMemberCard,
                              { backgroundColor: theme.bgCard, borderColor: theme.border },
                              isInTeam && { backgroundColor: "rgba(52,211,153,0.06)", borderColor: "rgba(52,211,153,0.2)" },
                            ]}
                          >
                            <View style={styles.eventMemberRank}>
                              <Text style={styles.eventMemberRankText}>#{idx + 1}</Text>
                            </View>
                            <View style={styles.avatarCircleSm}>
                              <Text style={styles.avatarTextSm}>{member.full_name?.charAt(0)?.toUpperCase()}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={[styles.eventMemberName, { color: theme.text }]} numberOfLines={1}>{member.full_name}</Text>
                              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                                <Text style={[styles.eventMemberSub, { color: theme.textMuted }]}>{member.student_id}</Text>
                                <View style={[styles.levelPill, { backgroundColor: lc.bg, borderColor: lc.color }]}>
                                  <Text style={[styles.levelPillText, { color: lc.color }]}>{lc.label}</Text>
                                </View>
                              </View>
                            </View>
                            <View style={{ alignItems: "flex-end", gap: 4 }}>
                              <Text style={styles.scoreVal}>{member.avg_score > 0 ? member.avg_score : "—"}</Text>
                              <Text style={[styles.scoreLabel, { color: theme.textMuted }]}>Avg Score</Text>
                            </View>
                            <TouchableOpacity
                              style={[styles.addBtn, isInTeam && styles.addBtnActive]}
                              onPress={() => toggleEventMember(member)}
                              disabled={isToggling}
                              activeOpacity={0.8}
                            >
                              {isToggling ? (
                                <ActivityIndicator size={14} color={isInTeam ? "#111827" : "#34D399"} />
                              ) : (
                                <Ionicons
                                  name={isInTeam ? "checkmark" : "add"}
                                  size={18}
                                  color={isInTeam ? "#111827" : "#34D399"}
                                />
                              )}
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          )}
        </>
      )}
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  centered: {
    alignItems: "center", justifyContent: "center",
    gap: 12, paddingVertical: 40,
  },
  loadingText: { fontWeight: "700", fontSize: 13 },

  // Sport picker
  chipSection: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  sectionLabel: {
    fontSize: 10, fontWeight: "900",
    letterSpacing: 1.2, marginBottom: 8,
  },
  sectionLabel2: {
    fontSize: 10, fontWeight: "900",
    letterSpacing: 1.2, marginBottom: 8,
    paddingHorizontal: 16, marginTop: 16,
  },
  sportChips: { gap: 8, paddingBottom: 4 },
  sportChip: {
    paddingHorizontal: 16, height: 36, borderRadius: 18,
    justifyContent: "center",
    borderWidth: 1,
  },
  sportChipText: { fontSize: 13, fontWeight: "800" },

  // Tabs
  tabRow: {
    flexDirection: "row", marginHorizontal: 16, marginTop: 10, marginBottom: 4,
    borderRadius: 14, borderWidth: 1, padding: 4,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 9, borderRadius: 11,
  },
  tabText: { fontSize: 13, fontWeight: "800" },

  // Legend
  legend: {
    flexDirection: "row", alignItems: "center", flexWrap: "wrap",
    gap: 10, paddingHorizontal: 16, paddingVertical: 8,
    borderBottomWidth: 1,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, fontWeight: "700" },
  legendHint: { fontSize: 10, fontWeight: "700", marginLeft: "auto" },

  listContent: { padding: 14, gap: 14 },

  // Empty state
  emptyState: { alignItems: "center", gap: 12, paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "800" },
  emptySub: { fontSize: 13, fontWeight: "600", textAlign: "center" },

  // Student card
  card: {
    borderRadius: 20, padding: 16,
    borderWidth: 1, gap: 14,
    position: "relative",
  },
  rankBadge: {
    position: "absolute", top: 10, right: 12,
    borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1,
  },
  rankText: { color: "#D4AF37", fontSize: 10, fontWeight: "900" },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatarCircle: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: "rgba(212,175,55,0.12)", borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)", alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#D4AF37", fontSize: 18, fontWeight: "900" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  studentName: { fontSize: 15, fontWeight: "900", flexShrink: 1 },
  studentId: { fontSize: 12, fontWeight: "700", marginTop: 2 },
  teamBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    backgroundColor: "rgba(52,211,153,0.12)", borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: "rgba(52,211,153,0.3)",
  },
  teamBadgeText: { color: "#34D399", fontSize: 9, fontWeight: "900", letterSpacing: 0.8 },
  levelBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1 },
  levelBadgeText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },

  statsRow: {
    flexDirection: "row",
    borderRadius: 14, borderWidth: 1,
    padding: 12, alignItems: "center", justifyContent: "space-around",
  },
  statItem: { alignItems: "center", gap: 3, flex: 1 },
  statValue: { fontSize: 15, fontWeight: "900" },
  statLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },
  statDivider: { width: 1, height: 28 },

  actionsSection: { gap: 8 },
  actionLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  levelBtns: { flexDirection: "row", gap: 8 },
  levelBtn: {
    flex: 1, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  levelBtnText: { fontSize: 12, fontWeight: "800" },

  teamBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, height: 42, borderRadius: 12, borderWidth: 1,
    borderColor: "rgba(52,211,153,0.3)", backgroundColor: "rgba(52,211,153,0.05)",
  },
  teamBtnActive: { backgroundColor: "#34D399", borderColor: "#34D399" },
  teamBtnText: { color: "#34D399", fontSize: 13, fontWeight: "900" },
  teamBtnTextActive: { color: "#111827" },

  // Event Team tab
  eventSelectorSection: { padding: 16, gap: 8 },
  eventDropdown: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 14, padding: 14, borderWidth: 1,
  },
  eventDropdownTitle: { fontSize: 14, fontWeight: "900" },
  eventDropdownSub: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  eventDropdownList: {
    borderRadius: 14, marginTop: 4,
    borderWidth: 1, overflow: "hidden",
  },
  eventDropdownItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  eventDropdownItemTitle: { fontSize: 14, fontWeight: "800" },
  eventDropdownItemSub: { fontSize: 11, fontWeight: "600", marginTop: 2 },

  noEventsBox: {
    alignItems: "center", gap: 8, paddingVertical: 30,
    borderRadius: 14, borderWidth: 1, padding: 24,
  },
  noEventsText: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  noEventsHint: { fontSize: 11, fontWeight: "600", textAlign: "center" },

  eventTeamHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  eventTeamTitle: { fontSize: 15, fontWeight: "900" },
  eventTeamSub: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  eventTeamCountBadge: {
    backgroundColor: "rgba(52,211,153,0.12)", borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(52,211,153,0.3)",
  },
  eventTeamCount: { color: "#34D399", fontSize: 15, fontWeight: "900" },

  // Event member card
  eventMemberCard: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 10, borderRadius: 14, borderWidth: 1,
  },
  eventMemberRank: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: "rgba(212,175,55,0.15)", alignItems: "center", justifyContent: "center",
  },
  eventMemberRankText: { color: "#D4AF37", fontSize: 9, fontWeight: "900" },
  avatarCircleSm: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: "rgba(212,175,55,0.12)", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(212,175,55,0.25)",
  },
  avatarTextSm: { color: "#D4AF37", fontSize: 13, fontWeight: "900" },
  eventMemberName: { fontSize: 13, fontWeight: "800" },
  eventMemberSub: { fontSize: 10.5, fontWeight: "600" },
  levelPill: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 8, borderWidth: 1 },
  levelPillText: { fontSize: 9.5, fontWeight: "800" },
  scoreVal: { color: "#F59E0B", fontSize: 13, fontWeight: "900" },
  scoreLabel: { fontSize: 9, fontWeight: "700" },
  addBtn: {
    width: 30, height: 30, borderRadius: 9,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(52,211,153,0.4)", backgroundColor: "rgba(52,211,153,0.07)",
  },
  addBtnActive: { backgroundColor: "#34D399", borderColor: "#34D399" },
});
