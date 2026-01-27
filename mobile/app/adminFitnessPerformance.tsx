import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, TextInput, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";

import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";

type Sport = { id: number; name: string };
type Event = { id: number; sport_id: number; name: string; level: "INTERNAL" | "INTER_UNIVERSITY" | "NATIONAL" | "OTHER" };
type Division = { id: number; event_id: number; name: string };
type Participant = { student_user_id: number; full_name: string; student_id: string };

type FitnessRow = {
  student_user_id: number;
  full_name: string;
  metric: string; // e.g. "Beep Test", "Sprint 100m"
  value: string;  // decimal(10,2) — score or raw
  notes: string;
};

const DUMMY_SPORTS: Sport[] = [
  { id: 1, name: "Cricket" },
  { id: 2, name: "Badminton" },
  { id: 3, name: "Football" },
];

const DUMMY_EVENTS: Event[] = [
  { id: 301, sport_id: 1, name: "Cricket Fitness Test - Week 1", level: "INTERNAL" },
  { id: 302, sport_id: 3, name: "Football Fitness Screening", level: "INTERNAL" },
];

const DUMMY_DIVISIONS: Division[] = [
  { id: 3101, event_id: 301, name: "Men" },
  { id: 3102, event_id: 301, name: "Women" },
  { id: 3201, event_id: 302, name: "Men" },
];

const DUMMY_PARTICIPANTS: Record<number, Participant[]> = {
  3101: [
    { student_user_id: 11, full_name: "Test Student 1", student_id: "IM00001" },
    { student_user_id: 12, full_name: "Test Student 2", student_id: "IM99999" },
  ],
  3102: [{ student_user_id: 13, full_name: "Test Student 3", student_id: "IM12345" }],
  3201: [{ student_user_id: 12, full_name: "Test Student 2", student_id: "IM99999" }],
};

export default function AdminFitnessPerformance() {
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
  }, [sportId, eventsForSport]);

  const divisionsForEvent = useMemo(() => DUMMY_DIVISIONS.filter((d) => d.event_id === eventId), [eventId]);
  const [divisionId, setDivisionId] = useState<number>(divisionsForEvent[0]?.id ?? DUMMY_DIVISIONS[0].id);
  useEffect(() => {
    setDivisionId(divisionsForEvent[0]?.id ?? DUMMY_DIVISIONS[0].id);
  }, [eventId, divisionsForEvent]);

  const participants = useMemo(() => DUMMY_PARTICIPANTS[divisionId] ?? [], [divisionId]);

  const [sessionTitle, setSessionTitle] = useState<string>("Fitness Test Session");
  const [defaultMetric, setDefaultMetric] = useState<string>("Beep Test (Score)");

  const [rows, setRows] = useState<FitnessRow[]>(() =>
    (DUMMY_PARTICIPANTS[divisionId] ?? []).map((p) => ({
      student_user_id: p.student_user_id,
      full_name: p.full_name,
      metric: defaultMetric,
      value: "",
      notes: "",
    }))
  );

  useEffect(() => {
    setRows(
      participants.map((p) => ({
        student_user_id: p.student_user_id,
        full_name: p.full_name,
        metric: defaultMetric,
        value: "",
        notes: "",
      }))
    );
  }, [divisionId, participants, defaultMetric]);

  const updateRow = (student_user_id: number, patch: Partial<FitnessRow>) => {
    setRows((prev) => prev.map((r) => (r.student_user_id === student_user_id ? { ...r, ...patch } : r)));
  };

  const onSave = () => {
    // Later: POST performance_entries rows with:
    // event_division_id = divisionId
    // type = 'FITNESS'
    // title = sessionTitle
    // metric/value/notes
    Alert.alert("Saved (Demo)", `event_division_id: ${divisionId}\nTitle: ${sessionTitle}\nRows: ${rows.length}`);
  };

  return (
    <Screen>
      <AppHeader title="Fitness Tests" subtitle="Batch entry for participants (performance_entries type=FITNESS)." showBack />

      <ScrollView showsVerticalScrollIndicator={false}>
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

        <AppCard style={{ marginBottom: 14 }}>
          <Text style={styles.sectionTitle}>Select Test Event</Text>
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
              DB mapping: events → event_divisions → performance_entries(type=FITNESS)
            </Text>
          </View>
        </AppCard>

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

        <AppCard style={{ marginBottom: 14 }}>
          <Text style={styles.sectionTitle}>Session Details</Text>

          <Text style={styles.label}>Title (stored in performance_entries.title)</Text>
          <TextInput
            value={sessionTitle}
            onChangeText={setSessionTitle}
            style={styles.field}
            placeholder="e.g. Week 1 Fitness Test"
            placeholderTextColor="rgba(229,231,235,0.40)"
          />

          <Text style={styles.label}>Default Metric (stored in performance_entries.metric)</Text>
          <TextInput
            value={defaultMetric}
            onChangeText={setDefaultMetric}
            style={styles.field}
            placeholder="e.g. Beep Test Level"
            placeholderTextColor="rgba(229,231,235,0.40)"
          />
        </AppCard>

        <AppCard>
          <Text style={styles.sectionTitle}>Participants</Text>
          <Text style={styles.subText}>Enter values per participant. Value supports decimals (decimal(10,2)).</Text>

          {rows.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={20} color="rgba(229,231,235,0.75)" />
              <Text style={styles.emptyText}>No participants found.</Text>
            </View>
          ) : (
            rows.map((r) => (
              <View key={r.student_user_id} style={styles.playerCard}>
                <View style={styles.playerTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.playerName} numberOfLines={1}>
                      {r.full_name}
                    </Text>
                    <Text style={styles.playerSub} numberOfLines={1}>
                      student_user_id: {r.student_user_id}
                    </Text>
                  </View>

                  <View style={styles.inputsRow}>
                    <View style={styles.fieldWrap}>
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
                </View>

                <Text style={styles.smallLabel}>Notes (optional)</Text>
                <TextInput
                  value={r.notes}
                  onChangeText={(t) => updateRow(r.student_user_id, { notes: t })}
                  style={styles.noteField}
                  placeholder="Optional"
                  placeholderTextColor="rgba(229,231,235,0.40)"
                />
              </View>
            ))
          )}
        </AppCard>

        <Pressable style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]} onPress={onSave}>
          <Ionicons name="save-outline" size={18} color="#111827" />
          <Text style={styles.saveText}>Save Fitness Entries (Demo)</Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { color: "#F9FAFB", fontSize: 16, fontWeight: "900" },
  subText: { marginTop: 8, color: "rgba(229,231,235,0.75)", fontSize: 12.5, lineHeight: 18, fontWeight: "600", marginBottom: 12 },

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
  playerTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  playerName: { color: "#F9FAFB", fontSize: 14.5, fontWeight: "900" },
  playerSub: { marginTop: 4, color: "rgba(229,231,235,0.65)", fontSize: 12, fontWeight: "700" },

  inputsRow: { flexDirection: "row", gap: 10 },
  fieldWrap: { width: 130 },
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
