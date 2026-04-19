import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, Pressable, Alert, ScrollView,
  ActivityIndicator, RefreshControl, TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../lib/themeStore";
import { apiGet, apiPost, apiDelete } from "../lib/api";
import { loadAuth } from "../lib/authStore";

// ─── Types ────────────────────────────────────────────────────────────────────
type Sport = { id: number; name: string };

type SportEvent = {
  id: number; admin_id: number; title: string; description: string | null;
  sport_tag: string | null; sport_id: number | null; venue: string | null;
  event_date: string | null; event_time: string | null; created_at: string;
};

type StudentStat = {
  student_user_id: number;
  full_name: string;
  student_id: string;
  squad_level: string;
  avg_score: number | null;
  attendance_count: number;
};

type EventMember = {
  student_user_id: number;
  full_name: string;
  student_id: string;
  squad_level: string;
  avg_score: number;
};

// ─── Level config ─────────────────────────────────────────────────────────────
type SquadLevel = "NONE" | "POOL" | "SQUAD";
const LEVELS: { key: SquadLevel; label: string; color: string; bg: string }[] = [
  { key: "NONE",  label: "None",  color: "#6B7280", bg: "rgba(107,114,128,0.15)" },
  { key: "POOL",  label: "Pool",  color: "#60A5FA", bg: "rgba(96,165,250,0.15)"  },
  { key: "SQUAD", label: "Squad", color: "#D4AF37", bg: "rgba(212,175,55,0.18)"  },
];
function levelConfig(key: SquadLevel) {
  return LEVELS.find((l) => l.key === key) ?? LEVELS[0];
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminEvents() {
  const { theme } = useAppTheme();

  // ── Sports
  const [sports, setSports]         = useState<Sport[]>([]);
  const [sportId, setSportId]       = useState<number | null>(null);
  const [loadingSports, setLoadingSports] = useState(true);

  // ── Events list
  const [events, setEvents]         = useState<SportEvent[]>([]);
  const [fetching, setFetching]     = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Enrolled students for selected sport (sorted by score)
  const [students, setStudents]         = useState<StudentStat[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // ── Event team per event (keyed by event id)
  const [eventTeams, setEventTeams]       = useState<Record<number, EventMember[]>>({});
  const [togglingMember, setTogglingMember] = useState<Record<string, boolean>>({});

  // ── Expanded event card
  const [expandedEventId, setExpandedEventId] = useState<number | null>(null);

  // ── Create form
  const [showForm, setShowForm]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle]           = useState("");
  const [description, setDesc]      = useState("");
  const [venue, setVenue]           = useState("");
  const [eventDate, setEventDate]   = useState("");
  const [eventTime, setEventTime]   = useState("");



  // ── Students pre-selected in the create form
  const [formSelectedStudentIds, setFormSelectedStudentIds] = useState<Set<number>>(new Set());

  // ── Load sports with approved enrollments on mount
  useEffect(() => {
    fetchSports();
  }, []);

  async function fetchSports() {
    try {
      setLoadingSports(true);
      // Load ALL sports (not just those with enrollments)
      const allSports = await apiGet<Sport[]>("/api/admin/sports");
      setSports(allSports);
      if (allSports.length > 0) {
        setSportId(allSports[0].id);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load sports");
    } finally {
      setLoadingSports(false);
    }
  }

  // ── When sport changes, load events + students
  useEffect(() => {
    if (sportId !== null) {
      fetchEvents(sportId);
      fetchStudents(sportId);
      setExpandedEventId(null);
    }
  }, [sportId]);

  async function fetchEvents(sid: number, isRefresh = false) {
    try {
      if (isRefresh) setRefreshing(true);
      else setFetching(true);
      const data = await apiGet<SportEvent[]>(`/api/admin/events/by-sport/${sid}`);
      setEvents(data);
    } catch {
      setEvents([]);
    } finally {
      setFetching(false);
      setRefreshing(false);
    }
  }

  async function fetchStudents(sid: number) {
    try {
      setLoadingStudents(true);
      setStudents([]);
      const data = await apiGet<StudentStat[]>(`/api/admin/squad-pool/${sid}`);
      // Sort by avg_score desc (highest first)
      const sorted = [...data].sort((a, b) => (b.avg_score ?? 0) - (a.avg_score ?? 0));
      setStudents(sorted);
    } catch {
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }

  async function fetchEventTeam(eid: number) {
    try {
      const data = await apiGet<EventMember[]>(`/api/admin/event-team/${eid}`);
      setEventTeams((prev) => ({ ...prev, [eid]: data }));
    } catch {
      setEventTeams((prev) => ({ ...prev, [eid]: [] }));
    }
  }

  const onRefresh = () => {
    if (sportId !== null) {
      fetchEvents(sportId, true);
      fetchStudents(sportId);
    }
  };

  // ── Toggle event card expansion + load team
  async function toggleEvent(eid: number) {
    if (expandedEventId === eid) {
      setExpandedEventId(null);
    } else {
      setExpandedEventId(eid);
      if (!eventTeams[eid]) {
        await fetchEventTeam(eid);
      }
    }
  }

  // ── Toggle student in/out of event team
  async function toggleEventMember(evtId: number, student: StudentStat) {
    if (!sportId) return;
    const key = `${evtId}-${student.student_user_id}`;
    const currentTeam = eventTeams[evtId] ?? [];
    const isInTeam = currentTeam.some((m) => m.student_user_id === student.student_user_id);
    setTogglingMember((p) => ({ ...p, [key]: true }));
    try {
      if (isInTeam) {
        await apiDelete(`/api/admin/event-team/${evtId}/${student.student_user_id}`);
        setEventTeams((prev) => ({
          ...prev,
          [evtId]: prev[evtId]?.filter((m) => m.student_user_id !== student.student_user_id) ?? [],
        }));
      } else {
        await apiPost(`/api/admin/event-team/${evtId}/assign`, {
          studentUserId: student.student_user_id,
          sportId,
        });
        setEventTeams((prev) => ({
          ...prev,
          [evtId]: [...(prev[evtId] ?? []), {
            student_user_id: student.student_user_id,
            full_name: student.full_name,
            student_id: student.student_id,
            squad_level: student.squad_level,
            avg_score: student.avg_score ?? 0,
          }],
        }));
      }
    } catch (e: any) {
      Alert.alert("Failed", e.message || "Could not update event team");
    } finally {
      setTogglingMember((p) => ({ ...p, [key]: false }));
    }
  }

  // ── Toggle a student in the form's pre-selection set
  function toggleFormStudent(sid: number) {
    setFormSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(sid)) next.delete(sid); else next.add(sid);
      return next;
    });
  }

  // ── Create event
  const handleCreate = async () => {
    if (!title.trim()) { Alert.alert("Error", "Event title is required"); return; }
    if (!sportId) { Alert.alert("Error", "Please select a sport from the top first"); return; }
    setSubmitting(true);
    try {
      const { token } = await loadAuth();
      // Always use the sport currently selected via the top chips
      const resolvedSportTag = sports.find((s) => s.id === sportId)?.name || null;
      const resp = await apiPost<{ ok: boolean; eventId: number }>("/api/admin/events", {
        title: title.trim(),
        description: description.trim() || null,
        sportTag: resolvedSportTag,
        venue: venue.trim() || null,
        eventDate: eventDate.trim() || null,
        eventTime: eventTime.trim() || null,
      }, token!);

      // Auto-assign pre-selected students to the newly created event team
      if (resp?.eventId && formSelectedStudentIds.size > 0 && sportId) {
        const assignJobs = [...formSelectedStudentIds].map((sid) =>
          apiPost(`/api/admin/event-team/${resp.eventId}/assign`, {
            studentUserId: sid,
            sportId,
          }).catch(() => {}) // ignore individual failures silently
        );
        await Promise.all(assignJobs);
      }

      const teamMsg = formSelectedStudentIds.size > 0
        ? `Event created with ${formSelectedStudentIds.size} player${formSelectedStudentIds.size !== 1 ? "s" : ""} in the team. Students notified.`
        : "Students have been notified.";
      Alert.alert("Event Created ✅", teamMsg);
      setTitle(""); setDesc(""); setVenue(""); setEventDate(""); setEventTime("");
      setFormSelectedStudentIds(new Set());
      setShowForm(false);
      if (sportId !== null) fetchEvents(sportId, true);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to create event");
    } finally { setSubmitting(false); }
  };

  const handleDelete = (id: number, evtTitle: string) => {
    Alert.alert("Delete Event", `Delete "${evtTitle}"?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          const { token } = await loadAuth();
          await apiDelete(`/api/admin/events/${id}`, token!);
          setEvents((prev) => prev.filter((e) => e.id !== id));
          if (expandedEventId === id) setExpandedEventId(null);
        } catch (e: any) { Alert.alert("Error", e?.message || "Failed to delete"); }
      }},
    ]);
  };

  const selectedSport = sports.find((s) => s.id === sportId);

  // ══════════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════════
  return (
    <Screen>
      <AppHeader
        title="Events"
        subtitle="Tournaments, training camps & matches"
        showBack
        rightSlot={
          <Pressable
            style={S.headerBtn}
            onPress={() => setShowForm(!showForm)}
          >
            <Ionicons name={showForm ? "close" : "add-circle"} size={22} color="#D4AF37" />
          </Pressable>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#D4AF37" colors={["#D4AF37"]} />
        }
      >
        {/* ── Sport Chips ── */}
        <View style={S.chipSection}>
          <Text style={[S.chipSectionLabel, { color: theme.textMuted }]}>SELECT SPORT</Text>
          {loadingSports ? (
            <ActivityIndicator color={theme.accent} style={{ marginTop: 10 }} />
          ) : sports.length === 0 ? (
            <View style={S.emptyBox}>
              <Ionicons name="football-outline" size={32} color={theme.border} />
              <Text style={[S.emptyTitle, { color: theme.text }]}>No sports available</Text>
              <Text style={[S.emptyHint, { color: theme.textSub }]}>Add sports from the Sports screen first.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={S.chipsRow}>
              {sports.map((s) => {
                const active = s.id === sportId;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[S.chip, { backgroundColor: theme.bgInput, borderColor: theme.border }, active && S.chipActive]}
                    onPress={() => setSportId(s.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[S.chipText, { color: theme.textSub }, active && S.chipTextActive]}>{s.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ── Create Form ── */}
        {showForm && (
          <View style={[S.formCard, { backgroundColor: theme.bgCard, borderColor: "rgba(212,175,55,0.2)" }]}>
            <View style={S.formHeader}>
              <Ionicons name="calendar-outline" size={18} color="#D4AF37" />
              <Text style={[S.formTitle, { color: theme.text }]}>New Event</Text>
            </View>
            <Text style={[S.formSub, { color: theme.textSub }]}>Creating an event will notify all students automatically.</Text>

            <Text style={[S.label, { color: theme.textSub }]}>Event Title *</Text>
            <TextInput
              value={title} onChangeText={setTitle}
              style={[S.input, { color: theme.text, backgroundColor: theme.bgInput, borderColor: theme.border }]}
              placeholder="e.g., Inter-Faculty Cricket Finals"
              placeholderTextColor={theme.textMuted}
            />

            <Text style={[S.label, { color: theme.textSub }]}>Description</Text>
            <TextInput
              value={description} onChangeText={setDesc}
              style={[S.input, { color: theme.text, backgroundColor: theme.bgInput, borderColor: theme.border, height: 72, textAlignVertical: "top", paddingTop: 10 }]}
              placeholder="Additional details..."
              placeholderTextColor={theme.textMuted}
              multiline
            />

            {/* Selected sport shown as read-only badge (driven by the top chip) */}
            {selectedSport && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 }}>
                <Text style={[S.label, { color: theme.textSub, marginTop: 0 }]}>Sport</Text>
                <View style={[S.sportPill, S.sportPillActive]}>
                  <Text style={[S.sportPillText, S.sportPillTextActive]}>{selectedSport.name}</Text>
                </View>
                <Text style={{ fontSize: 11, color: theme.textMuted, fontWeight: "600" as const }}>(change via top chips)</Text>
              </View>
            )}

            <Text style={[S.label, { color: theme.textSub }]}>Venue</Text>
            <TextInput
              value={venue} onChangeText={setVenue}
              style={[S.input, { color: theme.text, backgroundColor: theme.bgInput, borderColor: theme.border }]}
              placeholder="e.g., Main Ground, KLN"
              placeholderTextColor={theme.textMuted}
            />

            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Text style={[S.label, { color: theme.textSub }]}>Date</Text>
                <TextInput
                  value={eventDate} onChangeText={setEventDate}
                  style={[S.input, { color: theme.text, backgroundColor: theme.bgInput, borderColor: theme.border }]}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[S.label, { color: theme.textSub }]}>Time</Text>
                <TextInput
                  value={eventTime} onChangeText={setEventTime}
                  style={[S.input, { color: theme.text, backgroundColor: theme.bgInput, borderColor: theme.border }]}
                  placeholder="e.g., 3:00 PM"
                  placeholderTextColor={theme.textMuted}
                />
              </View>
            </View>

            {/* ── Team pre-selection ── */}
            {students.length > 0 && (
              <>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 18 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="people" size={14} color="#34D399" />
                    <Text style={[S.label, { color: theme.textSub, marginTop: 0 }]}>SELECT TEAM MEMBERS</Text>
                    <Text style={{ fontSize: 10, color: theme.textMuted, fontWeight: "600" as const }}>(optional)</Text>
                  </View>
                  {formSelectedStudentIds.size > 0 && (
                    <View style={S.teamSelBadge}>
                      <Text style={S.teamSelBadgeText}>{formSelectedStudentIds.size} selected</Text>
                    </View>
                  )}
                </View>
                <Text style={[S.formSub, { color: theme.textMuted, marginTop: 4, marginBottom: 2 }]}>
                  Tap a student to add them to this event's team right away.
                </Text>

                {loadingStudents ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10 }}>
                    <ActivityIndicator size="small" color={theme.accent} />
                    <Text style={{ color: theme.textMuted, fontSize: 12 }}>Loading students…</Text>
                  </View>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 8, paddingTop: 8, paddingBottom: 4 }}
                  >
                    {students.map((st) => {
                      const selected = formSelectedStudentIds.has(st.student_user_id);
                      const lc = levelConfig((st.squad_level as SquadLevel) ?? "NONE");
                      return (
                        <TouchableOpacity
                          key={st.student_user_id}
                          onPress={() => toggleFormStudent(st.student_user_id)}
                          activeOpacity={0.75}
                          style={[
                            S.formStudentChip,
                            {
                              borderColor: selected ? "#34D399" : theme.border,
                              backgroundColor: selected ? "rgba(52,211,153,0.1)" : theme.bgInput,
                            },
                          ]}
                        >
                          {/* Checkmark badge */}
                          {selected && (
                            <View style={S.formStudentCheck}>
                              <Ionicons name="checkmark" size={9} color="#111827" />
                            </View>
                          )}
                          {/* Avatar */}
                          <View style={[S.formStudentAvatar, { backgroundColor: selected ? "rgba(52,211,153,0.2)" : "rgba(212,175,55,0.12)" }]}>
                            <Text style={{ color: selected ? "#34D399" : ACCENT, fontSize: 14, fontWeight: "900" as const }}>
                              {st.full_name?.charAt(0)?.toUpperCase()}
                            </Text>
                          </View>
                          <Text style={[S.formStudentName, { color: theme.text }]} numberOfLines={1}>
                            {st.full_name}
                          </Text>
                          <View style={[S.levelPill, { backgroundColor: lc.bg, borderColor: lc.color }]}>
                            <Text style={[S.levelPillText, { color: lc.color }]}>{lc.label}</Text>
                          </View>
                          {st.avg_score != null && (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
                              <Ionicons name="star" size={9} color="#F59E0B" />
                              <Text style={{ color: "#F59E0B", fontSize: 10, fontWeight: "800" as const }}>{st.avg_score}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}
              </>
            )}

            {students.length === 0 && !loadingStudents && (
              <View style={[S.noStudentsHint, { borderColor: theme.border }]}>
                <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
                <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "600" as const, flex: 1 }}>
                  No enrolled students found for this sport yet. You can add team members after creating the event.
                </Text>
              </View>
            )}

            <Pressable
              style={({ pressed }) => [S.createBtn, pressed && { opacity: 0.88 }, submitting && { opacity: 0.6 }]}
              onPress={handleCreate}
              disabled={submitting}
            >
              {submitting ? <ActivityIndicator color="#111827" /> : (
                <>
                  <Ionicons name="calendar-outline" size={18} color="#111827" />
                  <Text style={S.createBtnText}>
                    {formSelectedStudentIds.size > 0
                      ? `Create Event + Add ${formSelectedStudentIds.size} to Team`
                      : "Create Event"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        )}

        {/* ── Enrolled Students (sorted by score) ── */}
        {sportId !== null && (
          <View style={S.studentSection}>
            <View style={S.sectionRow}>
              <Text style={[S.sectionTitle, { color: theme.text }]}>
                {selectedSport?.name ?? "Sport"} — Enrolled Students
              </Text>
              <View style={S.sortBadge}>
                <Ionicons name="arrow-down" size={11} color="#D4AF37" />
                <Text style={S.sortBadgeText}>By Score</Text>
              </View>
            </View>
            <Text style={[S.sectionSub, { color: theme.textSub }]}>Students enrolled in this sport, ranked highest to lowest overall score.</Text>

            {loadingStudents ? (
              <View style={S.loadingRow}>
                <ActivityIndicator color={theme.accent} size="small" />
                <Text style={[S.loadingText, { color: theme.textSub }]}>Loading students…</Text>
              </View>
            ) : students.length === 0 ? (
              <View style={S.emptyBox}>
                <Ionicons name="people-outline" size={28} color={theme.border} />
                <Text style={[S.emptyTitle, { color: theme.text }]}>No enrolled students</Text>
                <Text style={[S.emptyHint, { color: theme.textSub }]}>Approve student enrollments for this sport first.</Text>
              </View>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>
                {students.map((st, idx) => {
                  const lc = levelConfig((st.squad_level as SquadLevel) ?? "NONE");
                  return (
                    <View key={st.student_user_id} style={[S.studentCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                      <View style={S.studentRankBadge}>
                        <Text style={S.studentRankText}>#{idx + 1}</Text>
                      </View>
                      <View style={S.studentAvatar}>
                        <Text style={S.studentAvatarText}>{st.full_name?.charAt(0)?.toUpperCase()}</Text>
                      </View>
                      <Text style={[S.studentName, { color: theme.text }]} numberOfLines={1}>{st.full_name}</Text>
                      <Text style={[S.studentId, { color: theme.textMuted }]}>{st.student_id}</Text>
                      <View style={[S.levelPill, { backgroundColor: lc.bg, borderColor: lc.color }]}>
                        <Text style={[S.levelPillText, { color: lc.color }]}>{lc.label}</Text>
                      </View>
                      <View style={S.scoreRow}>
                        <Ionicons name="star" size={11} color="#F59E0B" />
                        <Text style={S.scoreText}>{st.avg_score != null ? st.avg_score : "—"}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        )}

        {/* ── Events List ── */}
        <View style={S.eventsSection}>
          <Text style={[S.sectionTitle, { color: theme.text }]}>
            {selectedSport ? `${selectedSport.name} Events` : "Events"}
          </Text>

          {fetching && !refreshing ? (
            <View style={S.loadingRow}>
              <ActivityIndicator color={theme.accent} size="small" />
              <Text style={[S.loadingText, { color: theme.textSub }]}>Loading events…</Text>
            </View>
          ) : events.length === 0 ? (
            <View style={[S.emptyBox, { marginTop: 12 }]}>
              <Ionicons name="calendar-outline" size={40} color={theme.border} />
              <Text style={[S.emptyTitle, { color: theme.text }]}>No events for this sport yet</Text>
              <Text style={[S.emptyHint, { color: theme.textSub }]}>Tap + above to create your first event.</Text>
            </View>
          ) : (
            events.map((evt) => {
              const isExpanded = expandedEventId === evt.id;
              const team       = eventTeams[evt.id] ?? [];
              const teamIds    = new Set(team.map((m) => m.student_user_id));

              return (
                <View key={evt.id} style={[S.eventCard, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
                  {/* ── Event header ── */}
                  <TouchableOpacity
                    style={S.eventCardHeader}
                    onPress={() => toggleEvent(evt.id)}
                    activeOpacity={0.85}
                  >
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <Text style={[S.eventTitle, { color: theme.text }]}>{evt.title}</Text>
                        {evt.sport_tag && (
                          <View style={[S.sportTagBadge, { backgroundColor: theme.accent + "1A", borderColor: theme.accent + "4D" }]}>
                            <Text style={[S.sportTagBadgeText, { color: theme.accent }]}>{evt.sport_tag}</Text>
                          </View>
                        )}
                      </View>
                      {evt.description ? (
                        <Text style={[S.eventDesc, { color: theme.textSub }]} numberOfLines={isExpanded ? undefined : 2}>{evt.description}</Text>
                      ) : null}
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 6 }}>
                        {evt.venue && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Ionicons name="location-outline" size={13} color={theme.textMuted} />
                            <Text style={[S.eventMeta, { color: theme.textSub }]}>{evt.venue}</Text>
                          </View>
                        )}
                        {evt.event_date && (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <Ionicons name="calendar-outline" size={13} color={theme.textMuted} />
                            <Text style={[S.eventMeta, { color: theme.textSub }]}>{evt.event_date}{evt.event_time ? ` · ${evt.event_time}` : ""}</Text>
                          </View>
                        )}
                      </View>

                      {/* Team count summary */}
                      <View style={S.teamCountRow}>
                        <Ionicons name="people" size={13} color="#34D399" />
                        <Text style={S.teamCountText}>
                          {isExpanded
                            ? `${team.length} player${team.length !== 1 ? "s" : ""} in team`
                            : `Tap to manage team (${team.length} selected)`}
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: "flex-end", gap: 8, marginLeft: 8 }}>
                      <TouchableOpacity
                        onPress={() => handleDelete(evt.id, evt.title)}
                        style={[S.deleteBtn, { backgroundColor: "#EF444415" }]}
                        hitSlop={8}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                      <Ionicons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={18}
                        color={theme.accent}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* ── Expanded: team selection ── */}
                  {isExpanded && (
                    <View style={[S.teamPanel, { backgroundColor: theme.bgInput, borderTopColor: theme.border }]}>
                      <View style={S.teamPanelHeader}>
                        <Text style={[S.teamPanelTitle, { color: theme.textMuted }]}>SELECT EVENT TEAM</Text>
                        <View style={[S.teamCountBadge, { backgroundColor: "#34D3991F", borderColor: "#34D3994D" }]}>
                          <Text style={S.teamCountBadgeText}>{team.length}</Text>
                        </View>
                      </View>
                      <Text style={[S.teamPanelSub, { color: theme.textSub }]}>
                        Select students for this event team. Students are ranked by their overall score (highest first).
                      </Text>

                      {loadingStudents ? (
                        <View style={S.loadingRow}>
                          <ActivityIndicator color={theme.accent} size="small" />
                          <Text style={[S.loadingText, { color: theme.textSub }]}>Loading students…</Text>
                        </View>
                      ) : students.length === 0 ? (
                        <View style={S.emptyBox}>
                          <Ionicons name="people-outline" size={24} color={theme.border} />
                          <Text style={[S.emptyTitle, { color: theme.text }]}>No students in squad/pool</Text>
                          <Text style={[S.emptyHint, { color: theme.textSub }]}>Assign students to Pool or Squad in Squad & Pool screen first.</Text>
                        </View>
                      ) : (
                        <View style={{ gap: 8, marginTop: 4 }}>
                          {students.map((st, idx) => {
                            const inTeam   = teamIds.has(st.student_user_id);
                            const key      = `${evt.id}-${st.student_user_id}`;
                            const toggling = togglingMember[key];
                            const lc       = levelConfig((st.squad_level as SquadLevel) ?? "NONE");

                            return (
                              <View key={st.student_user_id} style={[S.memberRow, { backgroundColor: theme.bgCard, borderColor: theme.border }, inTeam && S.memberRowActive]}>
                                <View style={[S.memberRankCircle, { backgroundColor: theme.accent + "1A" }]}>
                                  <Text style={[S.memberRankText, { color: theme.accent }]}>#{idx + 1}</Text>
                                </View>
                                <View style={[S.memberAvatar, { backgroundColor: theme.accent + "1A" }]}>
                                  <Text style={[S.memberAvatarText, { color: theme.accent }]}>{st.full_name?.charAt(0)?.toUpperCase()}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                  <Text style={[S.memberName, { color: theme.text }]} numberOfLines={1}>{st.full_name}</Text>
                                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                                    <Text style={[S.memberId, { color: theme.textMuted }]}>{st.student_id}</Text>
                                    <View style={[S.levelPill, { backgroundColor: lc.bg, borderColor: lc.color }]}>
                                      <Text style={[S.levelPillText, { color: lc.color }]}>{lc.label}</Text>
                                    </View>
                                  </View>
                                </View>
                                <View style={{ alignItems: "flex-end", gap: 2, marginRight: 8 }}>
                                  <Text style={S.memberScore}>{st.avg_score != null ? st.avg_score : "—"}</Text>
                                  <Text style={[S.memberScoreLabel, { color: theme.textMuted }]}>Score</Text>
                                </View>
                                <TouchableOpacity
                                  style={[S.addBtn, inTeam && S.addBtnActive]}
                                  onPress={() => toggleEventMember(evt.id, st)}
                                  disabled={!!toggling}
                                  activeOpacity={0.8}
                                >
                                  {toggling ? (
                                    <ActivityIndicator size={14} color={inTeam ? "#111827" : "#34D399"} />
                                  ) : (
                                    <Ionicons
                                      name={inTeam ? "checkmark" : "add"}
                                      size={18}
                                      color={inTeam ? "#111827" : "#34D399"}
                                    />
                                  )}
                                </TouchableOpacity>
                              </View>
                            );
                          })}
                        </View>
                      )}

                      {/* Current team members summary */}
                      {team.length > 0 && (
                        <View style={S.selectedTeamBox}>
                          <Text style={S.selectedTeamTitle}>SELECTED TEAM ({team.length})</Text>
                          {team.map((m) => (
                            <View key={m.student_user_id} style={S.selectedTeamRow}>
                              <Ionicons name="shield-checkmark" size={13} color="#34D399" />
                              <Text style={[S.selectedTeamName, { color: theme.text }]}>{m.full_name}</Text>
                              <Text style={[S.selectedTeamId, { color: theme.textMuted }]}>{m.student_id}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ACCENT = "#D4AF37";
const GOLD18 = "rgba(212,175,55,0.18)";

const S = {
  headerBtn: {
    padding: 8, backgroundColor: "rgba(212,175,55,0.12)",
    borderRadius: 10, borderWidth: 1, borderColor: "rgba(212,175,55,0.25)",
  } as any,

  // Sport chips
  chipSection: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 } as any,
  chipSectionLabel: { fontSize: 10, fontWeight: "900" as const, letterSpacing: 1.2, marginBottom: 8 } as any,
  chipsRow: { gap: 8, paddingBottom: 4 } as any,
  chip: {
    paddingHorizontal: 16, height: 36, borderRadius: 18,
    justifyContent: "center" as const,
    borderWidth: 1,
  } as any,
  chipActive: { backgroundColor: GOLD18, borderColor: ACCENT } as any,
  chipText: { fontSize: 13, fontWeight: "800" as const } as any,
  chipTextActive: { color: ACCENT } as any,

  // Create form
  formCard: {
    marginHorizontal: 14, marginTop: 12, padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 2,
  } as any,
  formHeader: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, marginBottom: 4 } as any,
  formTitle: { fontSize: 17, fontWeight: "900" as const } as any,
  formSub: { fontSize: 12, fontWeight: "600" as const, marginBottom: 4 } as any,
  label: { fontSize: 12, fontWeight: "800" as const, marginTop: 12 } as any,
  input: {
    marginTop: 6, height: 46, borderRadius: 13,
    paddingHorizontal: 12, fontWeight: "700" as const, borderWidth: 1,
  } as any,
  sportPill: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
    borderWidth: 1,
  } as any,
  sportPillActive: { backgroundColor: GOLD18, borderColor: ACCENT } as any,
  sportPillText: { fontSize: 12, fontWeight: "700" as const } as any,
  sportPillTextActive: { color: ACCENT } as any,
  createBtn: {
    marginTop: 18, height: 50, borderRadius: 14,
    alignItems: "center" as const, justifyContent: "center" as const,
    backgroundColor: ACCENT, flexDirection: "row" as const, gap: 8,
  } as any,
  createBtnText: { color: "#111827", fontSize: 15, fontWeight: "900" as const } as any,

  // Student section
  studentSection: { paddingHorizontal: 14, paddingTop: 16, paddingBottom: 8 } as any,
  sectionRow: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, marginBottom: 4 } as any,
  sectionTitle: { fontSize: 15, fontWeight: "900" as const } as any,
  sectionSub: { fontSize: 11.5, fontWeight: "600" as const, marginBottom: 10, lineHeight: 16 } as any,
  sortBadge: {
    flexDirection: "row" as const, alignItems: "center" as const, gap: 3,
    backgroundColor: GOLD18, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: "rgba(212,175,55,0.3)",
  } as any,
  sortBadgeText: { color: ACCENT, fontSize: 10, fontWeight: "800" as const } as any,

  // Student card (horizontal scroll)
  studentCard: {
    width: 110, padding: 12, borderRadius: 16,
    borderWidth: 1, alignItems: "center" as const, gap: 4, position: "relative" as const,
  } as any,
  studentRankBadge: {
    position: "absolute" as const, top: 6, right: 6,
    backgroundColor: GOLD18, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1,
  } as any,
  studentRankText: { color: ACCENT, fontSize: 9, fontWeight: "900" as const } as any,
  studentAvatar: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: GOLD18, borderWidth: 1, borderColor: "rgba(212,175,55,0.3)",
    alignItems: "center" as const, justifyContent: "center" as const,
  } as any,
  studentAvatarText: { color: ACCENT, fontSize: 16, fontWeight: "900" as const } as any,
  studentName: { fontSize: 11, fontWeight: "800" as const, textAlign: "center" as const } as any,
  studentId: { fontSize: 9.5, fontWeight: "600" as const, textAlign: "center" as const } as any,
  scoreRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 3, marginTop: 2 } as any,
  scoreText: { color: "#F59E0B", fontSize: 12, fontWeight: "900" as const } as any,

  // Events section
  eventsSection: { paddingHorizontal: 14, paddingTop: 8 } as any,

  // Event card
  eventCard: {
    borderRadius: 20, marginTop: 12,
    borderWidth: 1, overflow: "hidden" as const,
  } as any,
  eventCardHeader: { padding: 16, flexDirection: "row" as const, alignItems: "flex-start" as const } as any,
  eventTitle: { fontSize: 15, fontWeight: "900" as const, flexShrink: 1 } as any,
  eventDesc: { fontSize: 12.5, lineHeight: 18 } as any,
  eventMeta: { fontSize: 12, fontWeight: "600" as const } as any,
  sportTagBadge: {
    backgroundColor: GOLD18, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 999, borderWidth: 1, borderColor: "rgba(212,175,55,0.3)",
  } as any,
  sportTagBadgeText: { color: ACCENT, fontSize: 11, fontWeight: "700" as const } as any,
  teamCountRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 5, marginTop: 6 } as any,
  teamCountText: { color: "#34D399", fontSize: 11.5, fontWeight: "700" as const } as any,
  deleteBtn: { padding: 6, borderRadius: 8, backgroundColor: "#EF444415" } as any,

  // Team panel
  teamPanel: {
    borderTopWidth: 1,
    padding: 16,
  } as any,
  teamPanelHeader: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, marginBottom: 4 } as any,
  teamPanelTitle: { fontSize: 10, fontWeight: "900" as const, letterSpacing: 1.2 } as any,
  teamPanelSub: { fontSize: 11.5, fontWeight: "600" as const, marginBottom: 12, lineHeight: 16 } as any,
  teamCountBadge: {
    backgroundColor: "rgba(52,211,153,0.12)", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 2, borderWidth: 1, borderColor: "rgba(52,211,153,0.3)",
  } as any,
  teamCountBadgeText: { color: "#34D399", fontSize: 13, fontWeight: "900" as const } as any,

  // Member row
  memberRow: {
    flexDirection: "row" as const, alignItems: "center" as const, gap: 8,
    padding: 10, borderRadius: 14,
    borderWidth: 1,
  } as any,
  memberRowActive: { backgroundColor: "rgba(52,211,153,0.06)", borderColor: "rgba(52,211,153,0.2)" } as any,
  memberRankCircle: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: GOLD18,
    alignItems: "center" as const, justifyContent: "center" as const,
  } as any,
  memberRankText: { color: ACCENT, fontSize: 9, fontWeight: "900" as const } as any,
  memberAvatar: {
    width: 32, height: 32, borderRadius: 10, backgroundColor: GOLD18,
    alignItems: "center" as const, justifyContent: "center" as const,
    borderWidth: 1, borderColor: "rgba(212,175,55,0.25)",
  } as any,
  memberAvatarText: { color: ACCENT, fontSize: 13, fontWeight: "900" as const } as any,
  memberName: { fontSize: 13, fontWeight: "800" as const } as any,
  memberId: { fontSize: 10.5, fontWeight: "600" as const } as any,
  memberScore: { color: "#F59E0B", fontSize: 13, fontWeight: "900" as const } as any,
  memberScoreLabel: { color: "#6B7280", fontSize: 9, fontWeight: "700" as const } as any,
  addBtn: {
    width: 30, height: 30, borderRadius: 9,
    alignItems: "center" as const, justifyContent: "center" as const,
    borderWidth: 1, borderColor: "rgba(52,211,153,0.4)", backgroundColor: "rgba(52,211,153,0.07)",
  } as any,
  addBtnActive: { backgroundColor: "#34D399", borderColor: "#34D399" } as any,

  // Level pill
  levelPill: {
    paddingHorizontal: 7, paddingVertical: 1, borderRadius: 8, borderWidth: 1,
  } as any,
  levelPillText: { fontSize: 9.5, fontWeight: "800" as const } as any,

  // Selected team summary box
  selectedTeamBox: {
    marginTop: 14, padding: 12, borderRadius: 14,
    backgroundColor: "rgba(52,211,153,0.05)",
    borderWidth: 1, borderColor: "rgba(52,211,153,0.2)", gap: 6,
  } as any,
  selectedTeamTitle: { color: "#34D399", fontSize: 10, fontWeight: "900" as const, letterSpacing: 1, marginBottom: 4 } as any,
  selectedTeamRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6 } as any,
  selectedTeamName: { fontSize: 12.5, fontWeight: "700" as const, flex: 1 } as any,
  selectedTeamId: { fontSize: 11, fontWeight: "600" as const } as any,

  // Common
  emptyBox: { alignItems: "center" as const, gap: 8, paddingVertical: 24 } as any,
  emptyTitle: { fontSize: 14, fontWeight: "700" as const } as any,
  emptyHint: { fontSize: 12, fontWeight: "600" as const, textAlign: "center" as const, lineHeight: 17 } as any,
  loadingRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 10, paddingVertical: 16 } as any,
  loadingText: { fontSize: 13, fontWeight: "600" as const } as any,

  // Form student chip (team pre-selection)
  formStudentChip: {
    width: 96, padding: 10, borderRadius: 16,
    borderWidth: 1.5, alignItems: "center" as const, gap: 4, position: "relative" as const,
  } as any,
  formStudentCheck: {
    position: "absolute" as const, top: 5, right: 5,
    width: 16, height: 16, borderRadius: 8,
    backgroundColor: "#34D399",
    alignItems: "center" as const, justifyContent: "center" as const,
  } as any,
  formStudentAvatar: {
    width: 36, height: 36, borderRadius: 11,
    alignItems: "center" as const, justifyContent: "center" as const,
  } as any,
  formStudentName: { fontSize: 10, fontWeight: "700" as const, textAlign: "center" as const } as any,

  // Team selected badge
  teamSelBadge: {
    backgroundColor: "rgba(52,211,153,0.12)", borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: "rgba(52,211,153,0.3)",
  } as any,
  teamSelBadgeText: { color: "#34D399", fontSize: 11, fontWeight: "900" as const } as any,

  // No students info hint
  noStudentsHint: {
    flexDirection: "row" as const, alignItems: "flex-start" as const, gap: 6,
    marginTop: 14, padding: 10, borderRadius: 10, borderWidth: 1,
  } as any,
};
