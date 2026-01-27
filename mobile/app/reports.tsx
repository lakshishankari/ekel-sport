import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";

import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";

export default function Reports() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();

      if (!token) {
        router.replace("/login");
        return;
      }

      // only Admin + Advisory can see reports
      if (role !== "ADMIN" && role !== "ADVISORY") {
        if (role === "STUDENT") router.replace("/studentHome");
        else if (role === "ADMIN") router.replace("/adminHome");
        else if (role === "ADVISORY") router.replace("/advisoryHome");
        else router.replace("/login");
        return;
      }

      setChecking(false);
    })();
  }, []);

  if (checking) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
        <Text style={{ color: "rgba(229,231,235,0.75)", marginTop: 10, fontWeight: "700" }}>
          Loading reports...
        </Text>
      </View>
    );
  }

  // Dummy KPI values (presentation-ready). Later connect to API.
  const kpis = [
    { label: "Students", value: "128", icon: "people-outline" as const },
    { label: "Enrollments", value: "214", icon: "clipboard-outline" as const },
    { label: "Top Sport", value: "Cricket", icon: "trophy-outline" as const },
  ];

  return (
    <Screen>
      <AppHeader
        title="Reports & Analytics"
        subtitle="Shared view for Admin + Advisory. Real data will be connected in Phase 2."
        showBack
        rightSlot={
          <Pressable
            onPress={() => router.replace("/advisoryHome")}
            style={({ pressed }) => [styles.smallChip, pressed && { opacity: 0.75 }]}
          >
            <Ionicons name="home-outline" size={16} color="#E5E7EB" />
            <Text style={styles.smallChipText}>Home</Text>
          </Pressable>
        }
      />

      {/* KPI row */}
      <View style={styles.kpiRow}>
        {kpis.map((k) => (
          <AppCard key={k.label} style={styles.kpiCard}>
            <View style={styles.kpiTop}>
              <View style={styles.kpiIcon}>
                <Ionicons name={k.icon} size={18} color="#F9FAFB" />
              </View>
              <Text style={styles.kpiLabel}>{k.label}</Text>
            </View>
            <Text style={styles.kpiValue} numberOfLines={1}>
              {k.value}
            </Text>
          </AppCard>
        ))}
      </View>

      {/* Planned reports */}
      <AppCard style={{ marginTop: 14 }}>
        <View style={styles.sectionHead}>
          <Ionicons name="analytics-outline" size={18} color="#F9FAFB" />
          <Text style={styles.sectionTitle}>Planned Reports</Text>
        </View>

        <View style={styles.bulletRow}>
          <Ionicons name="checkmark-circle-outline" size={18} color="rgba(212,175,55,0.95)" />
          <Text style={styles.bulletText}>Total enrollments per sport</Text>
        </View>

        <View style={styles.bulletRow}>
          <Ionicons name="checkmark-circle-outline" size={18} color="rgba(212,175,55,0.95)" />
          <Text style={styles.bulletText}>Attendance summaries</Text>
        </View>

        <View style={styles.bulletRow}>
          <Ionicons name="checkmark-circle-outline" size={18} color="rgba(212,175,55,0.95)" />
          <Text style={styles.bulletText}>Performance analytics (fitness / matches / discipline)</Text>
        </View>

        <View style={styles.bulletRow}>
          <Ionicons name="checkmark-circle-outline" size={18} color="rgba(212,175,55,0.95)" />
          <Text style={styles.bulletText}>Colours eligibility decision support</Text>
        </View>

        <View style={styles.noteBox}>
          <Ionicons name="information-circle-outline" size={18} color="rgba(229,231,235,0.85)" />
          <Text style={styles.noteText}>
            Phase 2 will connect live data from attendance + performance scoring + eligibility engine.
          </Text>
        </View>
      </AppCard>

      {/* Bottom action */}
      <Pressable style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.85 }]} onPress={() => router.back()}>
        <Ionicons name="arrow-back-outline" size={18} color="#111827" />
        <Text style={styles.backText}>Back</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: "#0B0F14", justifyContent: "center", alignItems: "center" },

  smallChip: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  smallChipText: {
    color: "#E5E7EB",
    fontSize: 12,
    fontWeight: "800",
  },

  kpiRow: {
    flexDirection: "row",
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    padding: 14,
  },
  kpiTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  kpiIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  kpiLabel: {
    color: "rgba(229,231,235,0.75)",
    fontSize: 12,
    fontWeight: "800",
  },
  kpiValue: {
    color: "#F9FAFB",
    fontSize: 18,
    fontWeight: "900",
  },

  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "900",
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 10,
  },
  bulletText: {
    flex: 1,
    color: "rgba(229,231,235,0.78)",
    fontSize: 13.5,
    lineHeight: 19,
    fontWeight: "600",
  },

  noteBox: {
    marginTop: 16,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  noteText: {
    flex: 1,
    color: "rgba(229,231,235,0.75)",
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: "600",
  },

  backBtn: {
    marginTop: "auto",
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C9A227",
    flexDirection: "row",
    gap: 8,
  },
  backText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
  },
});
