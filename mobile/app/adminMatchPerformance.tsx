import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";

import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";

type Sport = { id: number; name: string };
type Event = {
  id: number;
  sport_id: number;
  name: string;
  level: "INTERNAL" | "INTER_UNIVERSITY" | "NATIONAL" | "OTHER";
};
type Division = { id: number; event_id: number; name: string };
type TeamMember = { student_user_id: number; full_name: string; student_id: string };

type EntryRow = {
  student_user_id: number;
  full_name: string;
  metric: string;
  value: string; // decimal(10,2)
  notes: string;
};

const DUMMY_SPORTS: Sport[] = [
  { id: 1, name: "Cricket" },
  { id: 2, name: "Badminton" },
  { id: 3, name: "Football" },
];

const DUMMY_EVENTS: Event[] = [
  { id: 101, sport_id: 1, name: "Sri Lanka University Games 2026", level: "INTER_UNIVERSITY" },
  { id: 102, sport_id: 1, name: "Faculty League", level: "INTERNAL" },
  { id: 201, sport_id: 2, name: "Inter Uni Badminton Meet", level: "INTER_UNIVERSITY" },
];

const DUMMY_DIVISIONS: Division[] = [
  { id: 1001, event_id: 101, name: "Men" },
  { id: 1002, event_id: 101, name: "Women" },
  { id: 1003, event_id: 102, name: "Men" },
  { id: 2001, event_id: 201, name: "Mixed" },
];

const DUMMY_TEAM_MEMBERS: Record<number, TeamMember[]> = {
  1001: [
    { student_user_id: 11, full_name: "Test Student 1", student_id: "IM00001" },
    { student_user_id: 12, full_name: "Test Student 2", student_id: "IM99999" },
  ],
  1002: [{ student_user_id: 13, full_name: "Test Student 3", student_id: "IM12345" }],
  2001: [{ student_user_id: 12, full_name: "Test Student 2", student_id: "IM99999" }],
};

export default function AdminMatchPerformance() {
  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "ADMIN") router.replace("/login");
    })();
  }, []);

  const [sportId, setSportId] = useState<number>(DUMMY_SPORTS[0].id);
  const eventsForSport = useMemo(() => DUMMY_EVENTS.filter((e) => e.sport_id === sportId), [sportId]);

  const [eventId, setEventId] = useState<number>(eventsForSport[0]?.id ?? DUMMY_EVENTS[0].id);
  useEffect(() => {
    setEventId(eventsForSport[0]?.id ?? DUMMY_EVENTS[0].id);
  }, [sportId]);

  const divisionsForEvent = useMemo(() => DUMMY_DIVISIONS.filter((d) => d.event_id === eventId), [eventId]);
  const [divisionId, setDivisionId] = useState<number>(divisionsForEvent[0]?.id ?? DUMMY_DIVISIONS[0].id);
  useEffect(() => {
    setDivisionId(divisionsForEvent[0]?.id ?? DUMMY_DIVISIONS[0].id);
  }, [eventId]);

  const team = useMemo(() => DUMMY_TEAM_MEMBERS[divisionId] ?? [], [divisionId]);

  const [placing, setPlacing] = useState<string>("1");
  const [points, setPoints] = useState<string>("10");
  const [resultNote, setResultNote] = useState<string>("");

  const [rows, setRows] = useState<EntryRow[]>(() =>
    (DUMMY_TEAM_MEMBERS[divisionId] ?? []).map((m) => ({
      student_user_id: m.student_user_id,
      full_name: m.full_name,
      metric: "Score",
      value: "",
      notes: "",
    }))
  );

  useEffect(() => {
    const next = team.map((m) => ({
      student_user_id: m.student_user_id,
      full_name: m.full_name,
      metric: "Score",
      value: "",
      notes: "",
    }));
    setRows(next);
  }, [divisionId, team]);

  const updateRow = (student_user_id: number, patch: Partial<EntryRow>) => {
    setRows((prev) => prev.map((r) => (r.student_user_id === student_user_id ? { ...r, ...patch } : r)));
  };

  const onSave = () => {
    Alert.alert(
      "Saved (Demo)",
      `event_division_id: ${divisionId}\nResult: placing=${placing}, points=${points}\nEntries: ${rows.length}`
    );
  };

  return (
    <Screen>
      <AppHeader title="Match Performance" subtitle="Event → Division → Team → Add match entries + result." showBack />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Sport */}
        <AppCard style={{ marginBottom: 14 }}>
          <Text style={styles.sectionTitle}>Select Sport</Text>
          <View style={styles.chipsRow}>
            {DUMMY_SPORTS.map((s) => {
              const active = s.id === sportId;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setSportId(s.id)}
                  style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.85 }]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{s.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </AppCard>

        {/* Event */}
        <AppCard style={{ marginBottom: 14 }}>
          <Text style={styles.sectionTitle}>Select Event</Text>
          <View style={styles.chipsRow}>
            {eventsForSport.map((e) => {
              const active = e.id === eventId;
              return (
                <Pressable
                  key={e.id}
                  onPress={() => setEventId(e.id)}
                  style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.85 }]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                    {e.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.metaRow}>
            <Ionicons name="information-circle-outline" size={18} color="rgba(229,231,235,0.85)" />
            <Text style={styles.metaText}>
              DB mapping: events → event_divisions → event_team_members → performance_entries(type=MATCH)
            </Text>
          </View>
        </AppCard>

        {/* Division */}
        <AppCard style={{ marginBottom: 14 }}>
          <Text style={styles.sectionTitle}>Select Division</Text>
          <View style={styles.chipsRow}>
            {divisionsForEvent.map((d) => {
              const active = d.id === divisionId;
              return (
                <Pressable
                  key={d.id}
                  onPress={() => setDivisionId(d.id)}
                  style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && { opacity: 0.85 }]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{d.name}</Text>
                </Pressable>
              );
            })}
          </View>
        </AppCard>

        {/* Result */}
        <AppCard style={{ marginBottom: 14 }}>
          <Text style={styles.sectionTitle}>Division Result (event_results)</Text>

          <View style={styles.fieldRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Placing</Text>
              <TextInput value={placing} onChangeText={setPlacing} keyboardType="numeric" style={styles.field} />
            </View>
            <View style={{ width: 12 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Points</Text>
              <TextInput value={points} onChangeText={setPoints} keyboardType="numeric" style={styles.field} />
            </View>
          </View>

          <Text style={styles.label}>Result Note</Text>
          <TextInput
            value={resultNote}
            onChangeText={setResultNote}
            style={styles.field}
            placeholder="Optional"
            placeholderTextColor="rgba(229,231,235,0.40)"
          />
        </AppCard>

        {/* Team Entries */}
        <AppCard>
          <Text style={styles.sectionTitle}>Team Entries (performance_entries)</Text>
          <Text style={styles.subText}>
            Only selected team members are listed (event_team_members). Add per-player match entry.
          </Text>

          {rows.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={20} color="rgba(229,231,235,0.75)" />
              <Text style={styles.emptyText}>No team members found for this division.</Text>
            </View>
          ) : (
            rows.map((r) => (
              <View key={r.student_user_id} style={styles.playerCard}>
                {/* Identity row (always visible) */}
                <View style={styles.playerHeader}>
                  <View style={styles.avatar}>
                    <Ionicons name="person-outline" size={16} color="#F9FAFB" />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={styles.playerName} numberOfLines={1}>
                      {r.full_name}
                    </Text>
                    <Text style={styles.playerSub} numberOfLines={1}>
                      student_user_id: {r.student_user_id}
                    </Text>
                  </View>
                </View>

                {/* Inputs row */}
                <View style={styles.inputsGrid}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.smallLabel}>Metric</Text>
                    <TextInput
                      value={r.metric}
                      onChangeText={(t) => updateRow(r.student_user_id, { metric: t })}
                      style={styles.smallField}
                      placeholder="e.g. Runs / Goals / Wickets"
                      placeholderTextColor="rgba(229,231,235,0.40)"
                    />
                  </View>

                  <View style={{ width: 12 }} />

                  <View style={{ width: 120 }}>
                    <Text style={styles.smallLabel}>Value</Text>
                    <TextInput
                      value={r.value}
                      onChangeText={(t) => updateRow(r.student_user_id, { value: t.replace(/[^0-9.]/g, "") })}
                      keyboardType="numeric"
                      style={styles.smallField}
                      placeholder="0"
                      placeholderTextColor="rgba(229,231,235,0.40)"
                    />
                  </View>
                </View>

                {/* Notes */}
                <Text style={[styles.smallLabel, { marginTop: 10 }]}>Notes (optional)</Text>
                <TextInput
                  value={r.notes}
                  onChangeText={(t) => updateRow(r.student_user_id, { notes: t })}
                  style={styles.noteField}
                  placeholder="e.g. Man of the match, key wicket..."
                  placeholderTextColor="rgba(229,231,235,0.40)"
                />
              </View>
            ))
          )}
        </AppCard>

        <Pressable style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]} onPress={onSave}>
          <Ionicons name="save-outline" size={18} color="#111827" />
          <Text style={styles.saveText}>Save Match Entries (Demo)</Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: "#F9FAFB", fontSize: 16, fontWeight: "900" },
  subText: {
    marginTop: 8,
    color: "rgba(229,231,235,0.75)",
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "600",
    marginBottom: 12,
  },

  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  chip: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    maxWidth: "100%",
  },
  chipActive: { backgroundColor: "rgba(212,175,55,0.18)", borderColor: "rgba(212,175,55,0.45)" },
  chipText: { color: "rgba(229,231,235,0.78)", fontSize: 13, fontWeight: "800" },
  chipTextActive: { color: "#F9FAFB" },

  metaRow: {
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  metaText: { flex: 1, color: "rgba(229,231,235,0.75)", fontSize: 12.5, lineHeight: 18, fontWeight: "600" },

  fieldRow: { flexDirection: "row", marginTop: 12, marginBottom: 10 },
  label: { marginTop: 10, color: "rgba(229,231,235,0.70)", fontSize: 12.5, fontWeight: "800" },
  field: {
    marginTop: 6,
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    color: "#F9FAFB",
    fontWeight: "800",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  playerCard: {
    marginTop: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  playerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },

  playerName: { color: "#F9FAFB", fontSize: 14.5, fontWeight: "900" },
  playerSub: { marginTop: 4, color: "rgba(229,231,235,0.65)", fontSize: 12, fontWeight: "700" },

  inputsGrid: {
    flexDirection: "row",
    alignItems: "flex-end",
  },

  smallLabel: { color: "rgba(229,231,235,0.70)", fontSize: 11.5, fontWeight: "800" },
  smallField: {
    marginTop: 6,
    height: 40,
    borderRadius: 14,
    paddingHorizontal: 10,
    color: "#F9FAFB",
    fontWeight: "800",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  noteField: {
    marginTop: 6,
    height: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    color: "#F9FAFB",
    fontWeight: "700",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },

  empty: { paddingVertical: 18, alignItems: "center", gap: 8 },
  emptyText: { color: "rgba(229,231,235,0.70)", fontWeight: "700" },

  saveBtn: {
    marginTop: 14,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C9A227",
    flexDirection: "row",
    gap: 8,
  },
  saveText: { color: "#111827", fontSize: 16, fontWeight: "900" },
});
