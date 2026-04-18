import React, { useEffect, useState, useCallback } from "react";
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
import AppCard from "../components/AppCard";
import { useAppTheme } from "../lib/themeStore";

// ─── Types ─────────────────────────────────────────────────────────────────
type Sport   = { id: number; name: string };
type Student = { student_user_id: number; full_name: string; student_id: string; squad_level: string };

type FitnessRow = {
  student_user_id: number;
  full_name: string;
  student_id: string;
  metric: string;
  value: string;
  notes: string;
};

// ─── Component ─────────────────────────────────────────────────────────────
export default function AdminFitnessPerformance() {
  const { theme } = useAppTheme();

  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "ADMIN") router.replace("/login");
    })();
  }, []);

  // ── Sports
  const [sports, setSports]             = useState<Sport[]>([]);
  const [sportId, setSportId]           = useState<number | null>(null);
  const [loadingSports, setLoadingSports] = useState(true);

  // ── Students
  const [students, setStudents]         = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // ── Rows
  const [defaultMetric, setDefaultMetric] = useState("Beep Test (Score)");
  const [rows, setRows]                 = useState<FitnessRow[]>([]);

  // ── Save
  const [saving, setSaving]             = useState(false);

  // ── Load sports on mount
  useEffect(() => { fetchSports(); }, []);

  async function fetchSports() {
    try {
      setLoadingSports(true);
      // Use /api/admin/sports to get ALL sports
      const data = await apiGet<Sport[]>("/api/admin/sports");
      setSports(data);
      if (data.length > 0) { setSportId(data[0].id); }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load sports");
    } finally {
      setLoadingSports(false);
    }
  }

  // ── Load students when sport changes
  useEffect(() => {
    if (sportId !== null) fetchStudents(sportId);
  }, [sportId]);

  async function fetchStudents(sid: number) {
    try {
      setLoadingStudents(true);
      setStudents([]);
      setRows([]);
      const data = await apiGet<Student[]>(`/api/admin/performance/students?sportId=${sid}`);
      setStudents(data);
      buildRows(data, defaultMetric);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load students");
    } finally {
      setLoadingStudents(false);
    }
  }

  function buildRows(studs: Student[], metric: string) {
    setRows(studs.map((s) => ({
      student_user_id: s.student_user_id,
      full_name: s.full_name,
      student_id: s.student_id,
      metric,
      value: "",
      notes: "",
    })));
  }

  function updateRow(studentUserId: number, patch: Partial<FitnessRow>) {
    setRows((prev) => prev.map((r) => r.student_user_id === studentUserId ? { ...r, ...patch } : r));
  }

  function onMetricChange(m: string) {
    setDefaultMetric(m);
    setRows((prev) => prev.map((r) => ({ ...r, metric: m })));
  }

  // ── Save entries
  async function onSave() {
    if (!sportId) { Alert.alert("Error", "Please select a sport first."); return; }
    const validRows = rows.filter((r) => r.value.trim() !== "");
    if (validRows.length === 0) { Alert.alert("Error", "Please enter at least one fitness value."); return; }
    setSaving(true);
    try {
      await apiPost("/api/admin/performance/batch", {
        sportId,
        type: "FITNESS",
        entries: validRows.map((r) => ({
          studentUserId: r.student_user_id,
          metric: r.metric || "Fitness Score",
          value: r.value,
          notes: r.notes,
        })),
      });
      Alert.alert("✅ Saved!", `Fitness entries saved for ${validRows.length} student(s).`);
      setRows((prev) => prev.map((r) => ({ ...r, value: "", notes: "" })));
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to save entries");
    } finally {
      setSaving(false);
    }
  }

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════
  return (
    <Screen>
      <AppHeader
        title="Fitness Tests"
        subtitle="Sport → Record fitness scores for each student"
        showBack
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Sport selector (horizontal chips strip) ── */}
        <View style={styles.chipSection}>
          <Text style={[styles.chipLabel, { color: theme.textMuted }]}>SELECT SPORT</Text>
          {loadingSports ? (
            <ActivityIndicator color={theme.accent} style={{ marginTop: 10 }} />
          ) : sports.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="football-outline" size={28} color={theme.border} />
              <Text style={[styles.emptyHint, { color: theme.textSub }]}>No sports found. Add sports from the Sports screen first.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
              {sports.map((s) => {
                const active = s.id === sportId;
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => setSportId(s.id)}
                    style={({ pressed }) => [
                      styles.chip,
                      { backgroundColor: theme.bgInput, borderColor: theme.border },
                      active && { backgroundColor: "rgba(212,175,55,0.18)", borderColor: "#D4AF37" },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={[styles.chipText, { color: theme.textSub }, active && { color: "#D4AF37" }]}>{s.name}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ── Metric field ── */}
        {sportId !== null && (
          <AppCard style={[styles.card, { marginHorizontal: 14, marginTop: 14 }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Fitness Metric</Text>
            <Text style={[styles.label, { color: theme.textSub }]}>Metric Name</Text>
            <TextInput
              value={defaultMetric}
              onChangeText={onMetricChange}
              style={[styles.field, { color: theme.text, backgroundColor: theme.bgInput, borderColor: theme.border }]}
              placeholder="e.g. Beep Test, Sprint 100m, Push-ups"
              placeholderTextColor={theme.textMuted}
            />
          </AppCard>
        )}

        {/* ── Student entries ── */}
        {sportId !== null && (
          <AppCard style={[styles.card, { marginHorizontal: 14, marginTop: 0 }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Student Scores</Text>
            <Text style={[styles.subText, { color: theme.textSub }]}>
              Enter fitness values per student. Leave blank to skip a student.
            </Text>

            {loadingStudents ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={theme.accent} size="small" />
                <Text style={[styles.loadingText, { color: theme.textSub }]}>Loading students…</Text>
              </View>
            ) : rows.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="people-outline" size={28} color={theme.border} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>No Students</Text>
                <Text style={[styles.emptyHint, { color: theme.textSub }]}>No approved students for this sport yet.</Text>
              </View>
            ) : (
              rows.map((r) => (
                <View key={r.student_user_id} style={[styles.playerCard, { backgroundColor: theme.bgInput, borderColor: theme.border }]}>
                  {/* Player header */}
                  <View style={styles.playerHeader}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>{r.full_name?.charAt(0)?.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.playerName, { color: theme.text }]} numberOfLines={1}>{r.full_name}</Text>
                      <Text style={[styles.playerSub, { color: theme.textMuted }]}>{r.student_id}</Text>
                    </View>
                  </View>

                  {/* Value */}
                  <View style={styles.inputsGrid}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.smallLabel, { color: theme.textSub }]}>Metric</Text>
                      <TextInput
                        value={r.metric}
                        onChangeText={(t) => updateRow(r.student_user_id, { metric: t })}
                        style={[styles.smallField, { color: theme.text, backgroundColor: theme.bgCard, borderColor: theme.border }]}
                        placeholder="e.g. Beep Test"
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

                  {/* Notes */}
                  <Text style={[styles.smallLabel, { marginTop: 10, color: theme.textSub }]}>Notes</Text>
                  <TextInput
                    value={r.notes}
                    onChangeText={(t) => updateRow(r.student_user_id, { notes: t })}
                    style={[styles.noteField, { color: theme.text, backgroundColor: theme.bgCard, borderColor: theme.border }]}
                    placeholder="Optional notes…"
                    placeholderTextColor={theme.textMuted}
                  />
                </View>
              ))
            )}
          </AppCard>
        )}

        {/* ── Save button ── */}
        {sportId !== null && rows.length > 0 && (
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
                <Text style={styles.saveText}>Save Fitness Entries</Text>
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
const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  sectionTitle: { fontSize: 16, fontWeight: "900" },
  subText: { marginTop: 6, fontSize: 12.5, lineHeight: 18, fontWeight: "600", marginBottom: 8 },

  // Sport chip strip
  chipSection: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  chipLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginBottom: 8 },
  chipsRow: { gap: 8, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 16, height: 36, borderRadius: 18,
    justifyContent: "center",
    borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "800" },

  label: { marginTop: 10, fontSize: 12.5, fontWeight: "800" },
  field: { marginTop: 6, height: 44, borderRadius: 14, paddingHorizontal: 12, fontWeight: "800", borderWidth: 1 },

  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12, paddingVertical: 8 },
  loadingText: { fontSize: 13, fontWeight: "600" },
  emptyBox: { alignItems: "center", gap: 8, paddingVertical: 24 },
  emptyTitle: { fontSize: 14, fontWeight: "700" },
  emptyHint: { fontSize: 12, fontWeight: "600", textAlign: "center", lineHeight: 17 },

  playerCard: {
    marginTop: 12, padding: 14, borderRadius: 18,
    borderWidth: 1,
  },
  playerHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  avatar: {
    width: 36, height: 36, borderRadius: 11, alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(99,102,241,0.12)", borderWidth: 1, borderColor: "rgba(99,102,241,0.25)",
  },
  avatarText: { color: "#818CF8", fontSize: 16, fontWeight: "900" },
  playerName: { fontSize: 14.5, fontWeight: "900" },
  playerSub: { marginTop: 2, fontSize: 12, fontWeight: "700" },

  inputsGrid: { flexDirection: "row", alignItems: "flex-end" },
  smallLabel: { fontSize: 11.5, fontWeight: "800" },
  smallField: { marginTop: 6, height: 40, borderRadius: 12, paddingHorizontal: 10, fontWeight: "800", borderWidth: 1 },
  noteField:  { marginTop: 6, height: 40, borderRadius: 12, paddingHorizontal: 12, fontWeight: "700", borderWidth: 1 },

  saveBtn: {
    marginHorizontal: 14, marginTop: 12, height: 52, borderRadius: 16, alignItems: "center",
    justifyContent: "center", backgroundColor: "#D4AF37",
    flexDirection: "row", gap: 8,
  },
  saveText: { color: "#111827", fontSize: 16, fontWeight: "900" },
});
