import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Screen from "../components/Screen";
import { loadAuth } from "../lib/authStore";
import { apiGet, apiPost } from "../lib/api";
import { useAppTheme, AppTheme } from "../lib/themeStore";

// ─── Types ──────────────────────────────────────────────────────────────────
type Criteria = {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  weight: number; // integer 0–100
};

type Sport = {
  id: string;
  name: string;
  emoji: string;
  threshold: number; // minimum % to be eligible
  criteria: Criteria[];
};

// ─── Default Criteria ────────────────────────────────────────────────────────
const DEFAULT_CRITERIA = (): Criteria[] => [
  {
    id: "match",
    label: "Match Performance",
    description: "Goals, runs, wickets, assists, points scored",
    icon: "trophy",
    accentColor: "#C9A227",
    weight: 40,
  },
  {
    id: "fitness",
    label: "Fitness Tests",
    description: "Physical assessment and strength metrics",
    icon: "fitness",
    accentColor: "#6366F1",
    weight: 25,
  },
  {
    id: "attendance",
    label: "Attendance",
    description: "Practice session attendance percentage",
    icon: "calendar",
    accentColor: "#10B981",
    weight: 20,
  },
  {
    id: "discipline",
    label: "Discipline",
    description: "Conduct, behaviour and fair play",
    icon: "shield-checkmark",
    accentColor: "#F59E0B",
    weight: 15,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdvisoryWeightages() {
  const { theme, isDark } = useAppTheme();
  const [sports,        setSports]        = useState<Sport[]>([]);
  const [activeSportId, setActiveSportId] = useState<string>("");
  const [saving,        setSaving]        = useState(false);
  const [loadingSports, setLoadingSports] = useState(true);
  const [savedSportIds, setSavedSportIds] = useState<Set<string>>(new Set());

  const styles = makeStyles(theme);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "ADVISORY") router.replace("/login");
    })();
  }, []);

  // ── Load sports + saved weightages ─────────────────────────────────────────
  const loadSports = useCallback(async () => {
    try {
      setLoadingSports(true);
      const apiSports = await apiGet<{ id: number; name: string }[]>("/api/advisory/sports");
      const EMOJIS: Record<string, string> = {
        Cricket: "🏏", Football: "⚽", Basketball: "🏀",
        Volleyball: "🏐", Hockey: "🏑", Rugby: "🏉",
        Tennis: "🎾", Badminton: "🏸", Swimming: "🏊",
        Athletics: "🏃", Netball: "🏀", Chess: "♟️",
      };
      const built: Sport[] = await Promise.all(
        apiSports.map(async (sp) => {
          try {
            const w = await apiGet<{ match: number; fitness: number; attendance: number; discipline: number; threshold: number }>(
              `/api/advisory/weightages/${sp.id}`
            );
            const criteria = DEFAULT_CRITERIA();
            criteria[0].weight = w.match;
            criteria[1].weight = w.fitness;
            criteria[2].weight = w.attendance;
            criteria[3].weight = w.discipline;
            return { id: String(sp.id), name: sp.name, emoji: EMOJIS[sp.name] ?? "🏅", threshold: w.threshold, criteria };
          } catch {
            return { id: String(sp.id), name: sp.name, emoji: EMOJIS[sp.name] ?? "🏅", threshold: 60, criteria: DEFAULT_CRITERIA() };
          }
        })
      );
      setSports(built);
      if (built.length > 0) setActiveSportId(built[0].id);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not load sports");
    } finally {
      setLoadingSports(false);
    }
  }, []);

  useEffect(() => { loadSports(); }, [loadSports]);

  // ── Loading / empty guards ──────────────────────────────────────────────────
  if (loadingSports) {
    return (
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Criteria Weightages</Text>
            <Text style={styles.headerSub}>Loading sports…</Text>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </Screen>
    );
  }

  if (sports.length === 0) {
    return (
      <Screen>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Criteria Weightages</Text>
          </View>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Ionicons name="alert-circle-outline" size={40} color={theme.textMuted} />
          <Text style={{ color: theme.textSub, fontSize: 15, fontWeight: "700", marginTop: 12, textAlign: "center" }}>
            No sports found. Ask an admin to create sports first.
          </Text>
        </View>
      </Screen>
    );
  }

  const activeSport = sports.find((s) => s.id === activeSportId) ?? sports[0];
  const totalWeight = activeSport.criteria.reduce((sum, c) => sum + c.weight, 0);
  const isValid = totalWeight === 100;

  const updateWeight = (criteriaId: string, raw: string) => {
    const parsed = parseInt(raw.replace(/[^0-9]/g, ""), 10);
    const value = isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
    setSports((prev) =>
      prev.map((s) => {
        if (s.id !== activeSport.id) return s;
        return { ...s, criteria: s.criteria.map((c) => c.id === criteriaId ? { ...c, weight: value } : c) };
      })
    );
    setSavedSportIds((prev) => { const n = new Set(prev); n.delete(activeSport.id); return n; });
  };

  const updateThreshold = (raw: string) => {
    const parsed = parseInt(raw.replace(/[^0-9]/g, ""), 10);
    const value = isNaN(parsed) ? 0 : Math.min(100, Math.max(0, parsed));
    setSports((prev) => prev.map((s) => s.id === activeSport.id ? { ...s, threshold: value } : s));
  };

  const handleSave = async () => {
    if (!isValid) { Alert.alert("Invalid Weightages", "The criteria weights must add up to exactly 100%."); return; }
    setSaving(true);
    try {
      await apiPost(`/api/advisory/weightages/${activeSport.id}`, {
        match:      activeSport.criteria.find((c) => c.id === "match")?.weight      ?? 40,
        fitness:    activeSport.criteria.find((c) => c.id === "fitness")?.weight    ?? 25,
        attendance: activeSport.criteria.find((c) => c.id === "attendance")?.weight ?? 20,
        discipline: activeSport.criteria.find((c) => c.id === "discipline")?.weight ?? 15,
        threshold:  activeSport.threshold,
      });
      setSavedSportIds((prev) => new Set(prev).add(activeSport.id));
      Alert.alert("Saved ✅", `Weightages for ${activeSport.name} have been saved.`);
    } catch (err: any) {
      Alert.alert("Save Failed", err?.message ?? "Could not save weightages");
    } finally {
      setSaving(false);
    }
  };

  const autoBalance = () => {
    const each = Math.floor(100 / activeSport.criteria.length);
    const remainder = 100 - each * activeSport.criteria.length;
    setSports((prev) =>
      prev.map((s) => {
        if (s.id !== activeSport.id) return s;
        return { ...s, criteria: s.criteria.map((c, i) => ({ ...c, weight: each + (i === 0 ? remainder : 0) })) };
      })
    );
  };

  return (
    <Screen style={{ paddingHorizontal: 0, paddingTop: 0 }}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Criteria Weightages</Text>
          <Text style={styles.headerSub}>Configure eligibility scoring weights per sport</Text>
        </View>
      </View>

      {/* ── Sport selector ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sportTabs}
      >
        {sports.map((s) => {
          const active = s.id === activeSportId;
          const saved  = savedSportIds.has(s.id);
          return (
            <Pressable
              key={s.id}
              style={[styles.sportTab, active && styles.sportTabActive]}
              onPress={() => setActiveSportId(s.id)}
            >
              <Text style={styles.sportEmoji}>{s.emoji}</Text>
              <Text style={[styles.sportTabText, active && styles.sportTabTextActive]}>
                {s.name}
              </Text>
              {saved && !active && (
                <Ionicons name="checkmark-circle" size={12} color="#10B981" style={{ marginLeft: 4 }} />
              )}
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* ── Total indicator ── */}
        <View style={styles.totalBanner}>
          <View style={styles.totalLeft}>
            <Text style={styles.totalLabel}>Total Weight</Text>
            <Text style={styles.totalSub}>Must equal exactly 100%</Text>
          </View>
          <View style={[styles.totalBadge, isValid ? styles.validBadge : styles.invalidBadge]}>
            <Text style={[styles.totalNum, isValid ? styles.validText : styles.invalidText]}>
              {totalWeight}%
            </Text>
            <Ionicons
              name={isValid ? "checkmark-circle" : "alert-circle"}
              size={18}
              color={isValid ? "#10B981" : "#EF4444"}
            />
          </View>
        </View>

        {/* ── Criteria cards ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Criteria Weights</Text>
            <Pressable onPress={autoBalance} style={styles.balanceBtn}>
              <Ionicons name="shuffle" size={14} color={theme.accent} />
              <Text style={styles.balanceBtnText}>Auto-balance</Text>
            </Pressable>
          </View>

          {activeSport.criteria.map((c) => {
            const pct = Math.min(100, c.weight);
            return (
              <View key={c.id} style={styles.criteriaCard}>
                <View style={styles.criteriaTop}>
                  <View style={[styles.criteriaIcon, { backgroundColor: c.accentColor + "22" }]}>
                    <Ionicons name={c.icon} size={20} color={c.accentColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.criteriaName}>{c.label}</Text>
                    <Text style={styles.criteriaDesc}>{c.description}</Text>
                  </View>
                  <View style={styles.weightInputWrap}>
                    <TextInput
                      value={String(c.weight)}
                      onChangeText={(v) => updateWeight(c.id, v)}
                      keyboardType="number-pad"
                      style={[styles.weightInput, { borderColor: c.accentColor + "55" }]}
                      maxLength={3}
                      selectTextOnFocus
                    />
                    <Text style={styles.pctSign}>%</Text>
                  </View>
                </View>

                {/* Progress bar */}
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: c.accentColor }]} />
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Eligibility threshold ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Colors Eligibility Threshold</Text>
          <Text style={styles.sectionSub}>
            Minimum score a student must achieve to be deemed colors eligible for {activeSport.name}
          </Text>
          <View style={styles.thresholdRow}>
            <Ionicons name="ribbon" size={20} color="#10B981" />
            <TextInput
              value={String(activeSport.threshold)}
              onChangeText={updateThreshold}
              keyboardType="number-pad"
              style={styles.thresholdInput}
              maxLength={3}
              selectTextOnFocus
            />
            <Text style={styles.thresholdPct}>%  minimum score</Text>
          </View>
          <Text style={styles.thresholdNote}>
            Students scoring ≥ {activeSport.threshold}% on weighted criteria are marked eligible
          </Text>
        </View>

        {/* ── Formula preview ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Score Formula Preview</Text>
          <Text style={styles.sectionSub}>How the final score will be computed</Text>
          <View style={styles.formulaBox}>
            {activeSport.criteria.map((c, i) => (
              <Text key={c.id} style={styles.formulaLine}>
                <Text style={{ color: c.accentColor, fontWeight: "800" }}>{c.label}</Text>
                <Text style={{ color: theme.textSub }}>
                  {" "}× {c.weight}%{i < activeSport.criteria.length - 1 ? " +" : ""}
                </Text>
              </Text>
            ))}
          </View>
        </View>

        {/* ── Save button ── */}
        <Pressable
          style={[styles.saveBtn, (!isValid || saving) && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!isValid || saving}
        >
          {saving ? (
            <ActivityIndicator color={theme.btnPrimaryText} size="small" />
          ) : (
            <Ionicons name="save" size={20} color={theme.btnPrimaryText} />
          )}
          <Text style={styles.saveBtnText}>
            {saving ? "Saving..." : `Save ${activeSport.name} Weightages`}
          </Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const makeStyles = (theme: AppTheme) => StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
    marginBottom: 8,
  },
  backBtn:    { padding: 4, marginTop: 2 },
  headerTitle: { color: theme.text, fontSize: 22, fontWeight: "900" },
  headerSub:   { color: theme.textMuted, fontSize: 12, fontWeight: "600", marginTop: 3, lineHeight: 16 },

  sportTabs: { paddingHorizontal: 20, gap: 10, paddingBottom: 4 },
  sportTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.bgInput,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sportTabActive: { backgroundColor: theme.accent + "26", borderColor: theme.accent },
  sportEmoji:     { fontSize: 16 },
  sportTabText:       { color: theme.textSub, fontSize: 13, fontWeight: "700" },
  sportTabTextActive: { color: theme.accent },

  totalBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginTop: 18,
    padding: 14,
    backgroundColor: theme.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: theme.border,
  },
  totalLeft:  { gap: 2 },
  totalLabel: { color: theme.text, fontSize: 15, fontWeight: "800" },
  totalSub:   { color: theme.textMuted, fontSize: 11, fontWeight: "600" },
  totalBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  validBadge:   { backgroundColor: "rgba(16,185,129,0.12)" },
  invalidBadge: { backgroundColor: "rgba(239,68,68,0.12)" },
  totalNum:    { fontSize: 18, fontWeight: "900" },
  validText:   { color: "#10B981" },
  invalidText: { color: "#EF4444" },

  section: {
    marginHorizontal: 20,
    marginTop: 18,
    backgroundColor: theme.bgCard,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.border,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: { color: theme.text, fontSize: 16, fontWeight: "900" },
  sectionSub:   { color: theme.textSub, fontSize: 12, fontWeight: "600", marginBottom: 14, lineHeight: 16 },
  balanceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: theme.accent + "1A",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.accent + "40",
  },
  balanceBtnText: { color: theme.accent, fontSize: 11, fontWeight: "800" },

  criteriaCard: {
    marginBottom: 14,
    backgroundColor: theme.bgInput,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 12,
  },
  criteriaTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  criteriaIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  criteriaName: { color: theme.text, fontSize: 14, fontWeight: "800", marginBottom: 2 },
  criteriaDesc: { color: theme.textMuted, fontSize: 11, fontWeight: "600", lineHeight: 15 },
  weightInputWrap: { flexDirection: "row", alignItems: "center", gap: 4 },
  weightInput: {
    width: 52,
    backgroundColor: theme.bg,
    borderRadius: 8,
    borderWidth: 1,
    color: theme.text,
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    paddingVertical: 8,
  },
  pctSign:     { color: theme.textSub, fontSize: 14, fontWeight: "700" },
  progressBg:  { height: 5, borderRadius: 3, backgroundColor: theme.border, overflow: "hidden" },
  progressFill: { height: 5, borderRadius: 3 },

  thresholdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(16,185,129,0.08)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.2)",
    marginBottom: 10,
  },
  thresholdInput: {
    width: 58,
    backgroundColor: theme.bg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.4)",
    color: "#10B981",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
    paddingVertical: 6,
  },
  thresholdPct:  { color: theme.textSub, fontSize: 13, fontWeight: "700" },
  thresholdNote: { color: theme.textMuted, fontSize: 11, fontWeight: "600", lineHeight: 16 },

  formulaBox: {
    backgroundColor: theme.bg,
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: theme.border,
  },
  formulaLine: { fontSize: 13, fontWeight: "600", lineHeight: 20 },

  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginTop: 24,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: theme.btnPrimary,
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { color: theme.btnPrimaryText, fontSize: 16, fontWeight: "900" },
});
