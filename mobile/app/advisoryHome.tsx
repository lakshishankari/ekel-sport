import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { loadAuth } from "../lib/authStore";
import { logout } from "../lib/logout";

import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";

export default function AdvisoryHome() {
  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "ADVISORY") router.replace("/login");
    })();
  }, []);

  const goReports = () => router.push("/reports");
  const goWeightages = () => router.push("/advisoryWeightages"); // Main Dashboard
  const goAdvisoryModule = () => router.push("/advisoryDashboard"); // Phase 2 UI page (your existing file)

  return (
    <Screen>
      <AppHeader
        title="Advisory Board"
        subtitle="Manage colours criteria and review analytics."
        showBack={false}
      />

      <AppCard style={{ marginBottom: 14 }}>
        <Text style={styles.cardTitle}>Overview</Text>
        <Text style={styles.cardSub}>
          Monitor student eligibility and manage colours criteria weightages
        </Text>

        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Students Reviewed</Text>
            <Text style={styles.kpiValue}>45</Text>
          </View>

          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Eligible</Text>
            <Text style={[styles.kpiValue, { color: "#10B981" }]}>32</Text>
          </View>

          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Pending Decision</Text>
            <Text style={[styles.kpiValue, { color: "#C9A227" }]}>8</Text>
          </View>
        </View>
      </AppCard>

      <AppCard style={{ marginBottom: 14 }}>
        <Text style={styles.cardTitle}>Quick Actions</Text>

        <Pressable style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.85 }]} onPress={goWeightages}>
          <Text style={styles.actionTitle}>Dashboard & Weightages</Text>
          <Text style={styles.actionSub}>Manage criteria weights and view student performance</Text>
        </Pressable>

        <Pressable style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.85 }]} onPress={goAdvisoryModule}>
          <Text style={styles.actionTitle}>Eligibility Review</Text>
          <Text style={styles.actionSub}>Review and approve student colours eligibility</Text>
        </Pressable>

        <Pressable style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.85 }]} onPress={goReports}>
          <Text style={styles.actionTitle}>Reports & Analytics</Text>
          <Text style={styles.actionSub}>Enrollment + attendance + performance insights</Text>
        </Pressable>
      </AppCard>

      <Pressable style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }]} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 8,
  },
  cardSub: {
    color: "rgba(229,231,235,0.75)",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    marginBottom: 14,
  },

  kpiRow: {
    flexDirection: "row",
    gap: 10,
  },
  kpiBox: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  kpiLabel: {
    color: "rgba(229,231,235,0.7)",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6,
  },
  kpiValue: {
    color: "#F9FAFB",
    fontSize: 18,
    fontWeight: "900",
  },

  actionBtn: {
    borderRadius: 16,
    padding: 14,
    marginTop: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  actionTitle: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "900",
  },
  actionSub: {
    marginTop: 4,
    color: "rgba(229,231,235,0.70)",
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: "600",
  },

  logoutBtn: {
    marginTop: "auto",
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C9A227",
  },
  logoutText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
  },
});
