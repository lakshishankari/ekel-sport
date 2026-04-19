import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, Pressable, ScrollView,
  TextInput, Alert, ActivityIndicator, TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import { apiGet, apiPost } from "../lib/api";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../lib/themeStore";

// ─── Types ─────────────────────────────────────────────────────────────────
type Sport = { id: number; name: string };
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
type EntryRow = {
  student_user_id: number;
  full_name: string;
  student_id: string;
  metric: string;
  value: string;
  notes: string;
  placement: string; // "1st" | "2nd" | "3rd" | "" (not placed)
};

// ─── Level config ─────────────────────────────────────────────────────────────
type SquadLevel = "NONE" | "POOL" | "SQUAD";
const LEVELS = [
  { key: "NONE",  label: "None",  color: "#6B7280", bg: "rgba(107,114,128,0.15)" },
  { key: "POOL",  label: "Pool",  color: "#60A5FA", bg: "rgba(96,165,250,0.15)"  },
  { key: "SQUAD", label: "Squad", color: "#D4AF37", bg: "rgba(212,175,55,0.18)"  },
];
function levelConfig(key: SquadLevel) {
  return LEVELS.find((l) => l.key === key) ?? LEVELS[0];
}

// ─── Component ─────────────────────────────────────────────────────────────
export default function AdminMatchPerformance() {
  const { theme } = useAppTheme();

  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "ADMIN") router.replace("/login");
    })();
  }, []);

  // ── Sports
  const [sports, setSports]               = useState<Sport[]>([]);
  const [sportId, setSportId]             = useState<number | null>(null);
  const [loadingSports, setLoadingSports] = useState(true);

  // ── Events
  const [events, setEvents]               = useState<SportEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventId, setEventId]             = useState<number | null>(null);
  const [eventExpanded, setEventExpanded] = useState(false);

  // ── Team members / entries
  const [teamMembers, setTeamMembers]     = useState<EventMember[]>([]);
  const [loadingTeam, setLoadingTeam]     = useState(false);
  const [rows, setRows]                   = useState<EntryRow[]>([]);

  // ── Save state
  const [saving, setSaving]               = useState(false);

  // ── Load ALL sports on mount (not just those with enrollments)
  useEffect(() => { fetchSports(); }, []);

  async function fetchSports() {
    try {
      setLoadingSports(true);
      const data = await apiGet<Sport[]>("/api/admin/sports");
      setSports(data);
      if (data.length > 0) setSportId(data[0].id);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load sports");
    } finally {
      setLoadingSports(false);
    }
  }

  // ── Load events when sport changes
  useEffect(() => {
    if (sportId !== null) {
      setEvents([]);
      setEventId(null);
      setTeamMembers([]);
      setRows([]);
      fetchEventsBySport(sportId);
    }
  }, [sportId]);

  async function fetchEventsBySport(sid: number) {
    try {
      setLoadingEvents(true);
      const data = await apiGet<SportEvent[]>(`/api/admin/events/by-sport/${sid}`);
      setEvents(data);
      if (data.length > 0) {
        setEventId(data[0].id);
        fetchTeamMembers(data[0].id);
      }
    } catch {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }

  async function fetchTeamMembers(eid: number) {
    try {
      setLoadingTeam(true);
      setTeamMembers([]);
      setRows([]);
      const data = await apiGet<EventMember[]>(`/api/admin/event-team/${eid}`);
      setTeamMembers(data);

      // Build blank rows first, then overlay any existing saved marks
      const blankRows: EntryRow[] = data.map((m) => ({
        student_user_id: m.student_user_id,
        full_name: m.full_name,
        student_id: m.student_id,
        metric: "Score",
        value: "",
        notes: "",
        placement: "",
      }));

      // Fetch existing marks for this event so the admin can see/edit them
      try {
        const existing = await apiGet<{ student_user_id: number; metric: string; value: number; notes: string | null; placement: string | null }[]>(
          `/api/admin/performance/event/${eid}`
        );
        if (existing.length > 0) {
          existing.forEach((e) => {
            const idx = blankRows.findIndex((r) => r.student_user_id === e.student_user_id);
            if (idx !== -1) {
              blankRows[idx].value     = String(e.value ?? "");
              blankRows[idx].metric    = e.metric    || "Score";
              blankRows[idx].notes     = e.notes     || "";
              blankRows[idx].placement = e.placement || "";
            }
          });
        }
      } catch { /* ignore — no existing marks yet */ }

      setRows(blankRows);
    } catch {
      setTeamMembers([]);
      setRows([]);
    } finally {
      setLoadingTeam(false);
    }
  }

  function updateRow(studentUserId: number, patch: Partial<EntryRow>) {
    setRows((prev) => prev.map((r) => r.student_user_id === studentUserId ? { ...r, ...patch } : r));
  }

  async function onSave() {
    if (!sportId || !eventId) {
      Alert.alert("Error", "Please select a sport and event first.");
      return;
    }
    const validRows = rows.filter((r) => r.value.trim() !== "");
    if (validRows.length === 0) {
      Alert.alert("Error", "Please enter at least one score value.");
      return;
    }
    // Validate 0–100 range
    const outOfRange = validRows.find((r) => {
      const n = Number(r.value);
      return isNaN(n) || n < 0 || n > 100;
    });
    if (outOfRange) {
      Alert.alert("Invalid Score", `"${outOfRange.value}" is out of range. All scores must be between 0 and 100.`);
      return;
    }
    setSaving(true);
    try {
      await apiPost("/api/admin/performance/batch", {
        sportId,
        eventId,          // ← pass eventId so marks are scoped to this event
        type: "MATCH",
        entries: validRows.map((r) => ({
          studentUserId: r.student_user_id,
          metric: r.metric || "Score",
          value: r.value,
          notes: r.notes,
          placement: r.placement || null,
        })),
      });
      Alert.alert("✅ Saved!", `Match entries saved for ${validRows.length} player(s).`);
      // Re-fetch so the saved values repopulate immediately
      await fetchTeamMembers(eventId);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save entries");
    } finally {
      setSaving(false);
    }
  }

  const selectedEvent = events.find((e) => e.id === eventId);

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <Screen>
      <AppHeader
        title="Match Performance"
        subtitle="Select sport → event → enter player marks"
        showBack
                backRoute="/adminHome"
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Sport selector (chips) ── */}
        <View style={styles.chipSection}>
          <Text style={[styles.chipLabel, { color: theme.textMuted }]}>SELECT SPORT</Text>
          {loadingSports ? (
            <ActivityIndicator color={theme.accent} style={{ marginTop: 10 }} />
          ) : sports.length === 0 ? (
            <View style={[styles.emptyBox, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
              <Ionicons name="football-outline" size={28} color={theme.border} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No sports found</Text>
              <Text style={[styles.emptyHint, { color: theme.textSub }]}>Add sports from the Sports screen first.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {sports.map((s) => {
                const active = s.id === sportId;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.chip,
                      { backgroundColor: theme.bgInput, borderColor: theme.border },
                      active && { backgroundColor: "rgba(212,175,55,0.18)", borderColor: "#D4AF37" },
                    ]}
                    onPress={() => setSportId(s.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.chipText, { color: theme.textSub }, active && { color: "#D4AF37" }]}>{s.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ── Event selector ── */}
        {sports.length > 0 && (
          <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Select Event</Text>
            {loadingEvents ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={theme.accent} size="small" />
                <Text style={[styles.loadingText, { color: theme.textSub }]}>Loading events…</Text>
              </View>
            ) : events.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="calendar-outline" size={28} color={theme.border} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No events found</Text>
                <Text style={[styles.emptyHint, { color: theme.textSub }]}>
                  {sportId ? "Create an event from the Events screen with this sport tag." : "Select a sport first."}
                </Text>
              </View>
            ) : (
              <>
                {/* Dropdown trigger */}
                <TouchableOpacity
                  style={[styles.eventDropdown, { backgroundColor: theme.bgInput, borderColor: "rgba(212,175,55,0.25)" }]}
                  onPress={() => setEventExpanded(!eventExpanded)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar" size={18} color="#D4AF37" />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.eventDropdownTitle, { color: theme.text }]} numberOfLines={1}>
                      {selectedEvent ? selectedEvent.title : "Select an event…"}
                    </Text>
                    {selectedEvent?.event_date && (
                      <Text style={[styles.eventDropdownSub, { color: theme.textMuted }]}>
                        {selectedEvent.event_date}
                        {selectedEvent.event_time ? ` · ${selectedEvent.event_time}` : ""}
                        {selectedEvent.venue ? ` · ${selectedEvent.venue}` : ""}
                      </Text>
                    )}
                  </View>
                  <Ionicons
                    name={eventExpanded ? "chevron-up" : "chevron-down"}
                    size={20} color="#D4AF37"
                  />
                </TouchableOpacity>

                {/* Dropdown list */}
                {eventExpanded && (
                  <View style={[styles.eventList, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
                    {events.map((evt) => {
                      const isSel = evt.id === eventId;
                      return (
                        <TouchableOpacity
                          key={evt.id}
                          style={[
                            styles.eventItem,
                            { borderBottomColor: theme.border },
                            isSel && { backgroundColor: "rgba(212,175,55,0.08)" },
                          ]}
                          onPress={() => {
                            setEventId(evt.id);
                            setEventExpanded(false);
                            fetchTeamMembers(evt.id);
                          }}
                          activeOpacity={0.8}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.eventItemTitle, { color: theme.text }, isSel && { color: "#D4AF37" }]} numberOfLines={1}>
                              {evt.title}
                            </Text>
                            <Text style={[styles.eventItemSub, { color: theme.textMuted }]}>
                              {evt.event_date || "Date TBD"}
                              {evt.event_time ? ` · ${evt.event_time}` : ""}
                              {evt.venue ? ` · ${evt.venue}` : ""}
                            </Text>
                          </View>
                          {isSel && <Ionicons name="checkmark-circle" size={18} color="#D4AF37" />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Info hint */}
                {selectedEvent && (
                  <View style={[styles.infoRow, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
                    <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} />
                    <Text style={[styles.infoText, { color: theme.textSub }]}>
                      Team members assigned in Squad & Pool → Event Team will appear below.
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        )}

        {/* ── Player Marks ── */}
        {eventId !== null && (
          <View style={[styles.card, { backgroundColor: theme.bgCard, borderColor: theme.border }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Player Marks</Text>
            <Text style={[styles.subText, { color: theme.textSub }]}>
              Enter performance scores for each team member selected for this event.
            </Text>

            {loadingTeam ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={theme.accent} size="small" />
                <Text style={[styles.loadingText, { color: theme.textSub }]}>Loading team members…</Text>
              </View>
            ) : rows.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="people-outline" size={28} color={theme.border} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No team members assigned</Text>
                <Text style={[styles.emptyHint, { color: theme.textSub }]}>
                  Go to Events → tap the event → select players for this event team first.
                </Text>
              </View>
            ) : (
              rows.map((r) => {
                const lc = levelConfig((teamMembers.find((m) => m.student_user_id === r.student_user_id)?.squad_level as SquadLevel) ?? "NONE");
                return (
                  <View key={r.student_user_id} style={[styles.playerCard, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
                    {/* Player header */}
                    <View style={styles.playerHeader}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{r.full_name?.charAt(0)?.toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.playerName, { color: theme.text }]} numberOfLines={1}>{r.full_name}</Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                          <Text style={[styles.playerSub, { color: theme.textMuted }]}>{r.student_id}</Text>
                          <View style={[styles.levelPill, { backgroundColor: lc.bg, borderColor: lc.color }]}>
                            <Text style={[styles.levelPillText, { color: lc.color }]}>{lc.label}</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Metric + Value */}
                    <View style={styles.inputsGrid}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.smallLabel, { color: theme.textSub }]}>Metric</Text>
                        <TextInput
                          value={r.metric}
                          onChangeText={(t) => updateRow(r.student_user_id, { metric: t })}
                          style={[styles.smallField, { color: theme.text, backgroundColor: theme.bgCard, borderColor: theme.border }]}
                          placeholder="e.g. Runs / Goals"
                          placeholderTextColor={theme.textMuted}
                        />
                      </View>
                      <View style={{ width: 12 }} />
                      <View style={{ width: 110 }}>
                        <Text style={[styles.smallLabel, { color: theme.textSub }]}>Value</Text>
                        <TextInput
                          value={r.value}
                          onChangeText={(t) => updateRow(r.student_user_id, { value: t.replace(/[^0-9.]/g, "") })}
                          keyboardType="numeric"
                          style={[styles.smallField, { color: theme.text, backgroundColor: theme.bgCard, borderColor: theme.border }]}
                          placeholder="0"
                          placeholderTextColor={theme.textMuted}
                        />
                      </View>
                    </View>

                    {/* Placement selector */}
                    <Text style={[styles.smallLabel, { marginTop: 10, color: theme.textSub }]}>Placement</Text>
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                      {([
                        { label: "🥇 1st",  value: "1st",   bg: "rgba(212,175,55,0.18)",  border: "#D4AF37", text: "#D4AF37" },
                        { label: "🥈 2nd",  value: "2nd",   bg: "rgba(156,163,175,0.18)", border: "#9CA3AF", text: "#9CA3AF" },
                        { label: "🥉 3rd",  value: "3rd",   bg: "rgba(180,120,60,0.18)",  border: "#B4783C", text: "#B4783C" },
                        { label: "Not Placed", value: "",      bg: "rgba(107,114,128,0.1)",  border: "#6B7280", text: "#6B7280" },
                      ]).map((pl) => {
                        const active = r.placement === pl.value;
                        return (
                          <TouchableOpacity
                            key={pl.label}
                            onPress={() => updateRow(r.student_user_id, { placement: active ? "" : pl.value })}
                            activeOpacity={0.8}
                            style={[
                              styles.placementChip,
                              {
                                backgroundColor: active ? pl.bg : theme.bgCard,
                                borderColor: active ? pl.border : theme.border,
                              },
                            ]}
                          >
                            <Text style={[styles.placementChipText, { color: active ? pl.text : theme.textMuted }]}>
                              {pl.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Notes */}
                    <Text style={[styles.smallLabel, { marginTop: 10, color: theme.textSub }]}>Notes</Text>
                    <TextInput
                      value={r.notes}
                      onChangeText={(t) => updateRow(r.student_user_id, { notes: t })}
                      style={[styles.noteField, { color: theme.text, backgroundColor: theme.bgCard, borderColor: theme.border }]}
                      placeholder="e.g. Man of the match, key wicket…"
                      placeholderTextColor={theme.textMuted}
                    />
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* ── Save button ── */}
        {eventId !== null && rows.length > 0 && (
          <Pressable
            style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }, saving && { opacity: 0.6 }]}
            onPress={onSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <>
                <Ionicons name="save-outline" size={18} color="#111827" />
                <Text style={styles.saveText}>Save Match Entries</Text>
              </>
            )}
          </Pressable>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const ACCENT = "#D4AF37";

const styles = StyleSheet.create({
  // Sport chips
  chipSection: {
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4,
  },
  chipLabel: {
    fontSize: 10, fontWeight: "900",
    letterSpacing: 1.2, marginBottom: 8,
  },
  chipsRow: { gap: 8, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 16, height: 36, borderRadius: 18,
    justifyContent: "center",
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "800" },

  // Card
  card: {
    marginHorizontal: 14, marginTop: 14, padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: "900" },
  subText: {
    marginTop: 6, fontSize: 12.5, lineHeight: 18, fontWeight: "600", marginBottom: 8,
  },

  // Event dropdown
  eventDropdown: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginTop: 12,
    borderRadius: 14, padding: 14, borderWidth: 1,
  },
  eventDropdownTitle: { fontSize: 14, fontWeight: "900" },
  eventDropdownSub: { fontSize: 12, fontWeight: "600", marginTop: 2 },
  eventList: {
    marginTop: 6,
    borderRadius: 14, borderWidth: 1, overflow: "hidden",
  },
  eventItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderBottomWidth: 1,
  },
  eventItemTitle: { fontSize: 14, fontWeight: "800" },
  eventItemSub: { fontSize: 11, fontWeight: "600", marginTop: 2 },

  infoRow: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    marginTop: 10, padding: 10, borderRadius: 12,
    borderWidth: 1,
  },
  infoText: { flex: 1, fontSize: 12, fontWeight: "600", lineHeight: 17 },

  // Loading / empty
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12, paddingVertical: 8 },
  loadingText: { fontSize: 13, fontWeight: "600" },
  emptyBox: { alignItems: "center", gap: 8, paddingVertical: 24 },
  emptyTitle: { fontSize: 14, fontWeight: "700" },
  emptyHint: { fontSize: 12, fontWeight: "600", textAlign: "center", lineHeight: 17 },

  // Player card
  playerCard: {
    marginTop: 12, padding: 14, borderRadius: 18,
    borderWidth: 1,
  },
  playerHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  avatar: {
    width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.18)", borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
  },
  avatarText: { color: ACCENT, fontSize: 16, fontWeight: "900" },
  playerName: { fontSize: 14.5, fontWeight: "900" },
  playerSub: { fontSize: 12, fontWeight: "700" },
  levelPill: { paddingHorizontal: 7, paddingVertical: 1, borderRadius: 8, borderWidth: 1 },
  levelPillText: { fontSize: 9.5, fontWeight: "800" },

  inputsGrid: { flexDirection: "row", alignItems: "flex-end" },
  smallLabel: { fontSize: 11.5, fontWeight: "800" },
  smallField: {
    marginTop: 6, height: 40, borderRadius: 12, paddingHorizontal: 10,
    fontWeight: "800", borderWidth: 1,
  },
  noteField: {
    marginTop: 6, height: 40, borderRadius: 12, paddingHorizontal: 12,
    fontWeight: "700", borderWidth: 1,
  },

  // Placement chips
  placementChip: {
    flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  placementChipText: { fontSize: 11, fontWeight: "800" },

  saveBtn: {
    marginHorizontal: 14, marginTop: 12, height: 52, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    backgroundColor: ACCENT, flexDirection: "row", gap: 8,
  },
  saveText: { color: "#111827", fontSize: 16, fontWeight: "900" },
});
