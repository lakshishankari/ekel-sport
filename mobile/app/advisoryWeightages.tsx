import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, Alert, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";

import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";

type SportKey = "Cricket" | "Badminton" | "Football";

type CriteriaKey = "Attendance" | "Matches" | "Fitness" | "Discipline";

type CriteriaItem = {
  key: CriteriaKey;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
};

const CRITERIA: CriteriaItem[] = [
  { key: "Attendance", icon: "calendar-outline", description: "Training + sessions attendance score" },
  { key: "Matches", icon: "trophy-outline", description: "Match participation & contribution score" },
  { key: "Fitness", icon: "barbell-outline", description: "Fitness tests and benchmarks" },
  { key: "Discipline", icon: "shield-checkmark-outline", description: "Discipline and conduct review" },
];

// Dummy per-sport weightages (professional prototype). Later fetch from API.
const DEFAULT_WEIGHTAGES: Record<SportKey, Record<CriteriaKey, number>> = {
  Cricket: { Attendance: 25, Matches: 35, Fitness: 20, Discipline: 20 },
  Badminton: { Attendance: 35, Matches: 20, Fitness: 25, Discipline: 20 },
  Football: { Attendance: 20, Matches: 40, Fitness: 25, Discipline: 15 },
};

export default function AdvisoryWeightages() {
  const [checking, setChecking] = useState(true);

  const sports: SportKey[] = ["Cricket", "Badminton", "Football"];
  const [sport, setSport] = useState<SportKey>("Cricket");
  const [weights, setWeights] = useState<Record<CriteriaKey, number>>(DEFAULT_WEIGHTAGES["Cricket"]);

  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "ADVISORY") {
        router.replace("/login");
        return;
      }
      setChecking(false);
    })();
  }, []);

  // When sport changes, load dummy weights for that sport
  useEffect(() => {
    setWeights(DEFAULT_WEIGHTAGES[sport]);
  }, [sport]);

  const total = useMemo(() => {
    return CRITERIA.reduce((sum, c) => sum + (Number(weights[c.key]) || 0), 0);
  }, [weights]);

  const totalOk = total === 100;

  const setWeight = (key: CriteriaKey, value: string) => {
    // allow empty while typing
    if (value === "") {
      setWeights((prev) => ({ ...prev, [key]: 0 }));
      return;
    }

    // only digits
    const cleaned = value.replace(/[^\d]/g, "");
    const num = Math.max(0, Math.min(100, Number(cleaned || 0)));

    setWeights((prev) => ({ ...prev, [key]: num }));
  };

  const onSave = () => {
    if (!totalOk) {
      Alert.alert("Total must be 100%", `Current total is ${total}%. Please adjust weightages.`);
      return;
    }

    // Demo save (later call API)
    Alert.alert("Saved (Demo)", `Weightages saved for ${sport}.`);
  };

  return (
    <Screen>
      <AppHeader
        title="Colours Weightages"
        subtitle="Configure criteria weights per sport (total must be 100%)."
        showBack
      />

      {/* Sport selector */}
      <AppCard style={{ marginBottom: 14 }}>
        <Text style={styles.sectionTitle}>Select Sport</Text>
        <View style={styles.chipsRow}>
          {sports.map((s) => {
            const active = s === sport;
            return (
              <Pressable
                key={s}
                onPress={() => setSport(s)}
                style={({ pressed }) => [
                  styles.chip,
                  active && styles.chipActive,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{s}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.smallHint}>
          Weightages can vary by sport depending on match frequency and training structure.
        </Text>
      </AppCard>

      {/* Criteria editor */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppCard>
          <View style={styles.totalRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Ionicons name="options-outline" size={18} color="#F9FAFB" />
              <Text style={styles.sectionTitle}>Criteria</Text>
            </View>

            <View style={[styles.totalBadge, totalOk ? styles.totalOk : styles.totalBad]}>
              <Text style={styles.totalText}>{total}%</Text>
              <Ionicons
                name={totalOk ? "checkmark-circle-outline" : "alert-circle-outline"}
                size={16}
                color={totalOk ? "rgba(16,185,129,0.95)" : "rgba(239,68,68,0.95)"}
              />
            </View>
          </View>

          <Text style={styles.subText}>Adjust each criterion weight (%) for {sport}.</Text>

          {CRITERIA.map((c) => (
            <View key={c.key} style={styles.criteriaRow}>
              <View style={styles.iconBox}>
                <Ionicons name={c.icon} size={18} color="#F9FAFB" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.criteriaTitle}>{c.key}</Text>
                <Text style={styles.criteriaDesc}>{c.description}</Text>
              </View>

              <View style={styles.inputWrap}>
                <TextInput
                  value={String(weights[c.key] ?? 0)}
                  onChangeText={(t) => setWeight(c.key, t)}
                  keyboardType="numeric"
                  style={styles.input}
                  maxLength={3}
                />
                <Text style={styles.percent}>%</Text>
              </View>
            </View>
          ))}

          <View style={[styles.noteBox, !totalOk && styles.noteBoxWarn]}>
            <Ionicons
              name={totalOk ? "information-circle-outline" : "warning-outline"}
              size={18}
              color={totalOk ? "rgba(229,231,235,0.85)" : "rgba(239,68,68,0.95)"}
            />
            <Text style={styles.noteText}>
              {totalOk
                ? "Total weight is valid. You can save these weightages."
                : `Total must be 100%. You currently have ${total}%.`}
            </Text>
          </View>
        </AppCard>

        <Pressable style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]} onPress={onSave}>
          <Ionicons name="save-outline" size={18} color="#111827" />
          <Text style={styles.saveText}>Save Weightages</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.secondaryBtn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push("/reports")}
        >
          <Ionicons name="analytics-outline" size={18} color="#F9FAFB" />
          <Text style={styles.secondaryText}>Open Reports & Analytics</Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "900",
  },
  subText: {
    marginTop: 8,
    color: "rgba(229,231,235,0.75)",
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "600",
    marginBottom: 12,
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 12,
  },
  chip: {
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  chipActive: {
    backgroundColor: "rgba(212,175,55,0.18)",
    borderColor: "rgba(212,175,55,0.45)",
  },
  chipText: {
    color: "rgba(229,231,235,0.78)",
    fontSize: 13,
    fontWeight: "800",
  },
  chipTextActive: {
    color: "#F9FAFB",
  },
  smallHint: {
    marginTop: 10,
    color: "rgba(229,231,235,0.65)",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },

  totalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },
  totalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 12,
    borderWidth: 1,
  },
  totalOk: {
    backgroundColor: "rgba(16,185,129,0.08)",
    borderColor: "rgba(16,185,129,0.35)",
  },
  totalBad: {
    backgroundColor: "rgba(239,68,68,0.08)",
    borderColor: "rgba(239,68,68,0.35)",
  },
  totalText: {
    color: "#F9FAFB",
    fontSize: 13,
    fontWeight: "900",
  },

  criteriaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  criteriaTitle: {
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "900",
  },
  criteriaDesc: {
    marginTop: 2,
    color: "rgba(229,231,235,0.65)",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },

  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  input: {
    minWidth: 34,
    textAlign: "right",
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "900",
  },
  percent: {
    color: "rgba(229,231,235,0.75)",
    fontSize: 13,
    fontWeight: "800",
  },

  noteBox: {
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
  noteBoxWarn: {
    backgroundColor: "rgba(239,68,68,0.06)",
    borderColor: "rgba(239,68,68,0.18)",
  },
  noteText: {
    flex: 1,
    color: "rgba(229,231,235,0.75)",
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "600",
  },

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
  saveText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
  },

  secondaryBtn: {
    marginTop: 12,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    flexDirection: "row",
    gap: 8,
  },
  secondaryText: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "900",
  },
});
