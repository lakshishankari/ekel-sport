import React, { useEffect } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";

import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";

export default function AdminAddMarks() {
  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "ADMIN") router.replace("/login");
    })();
  }, []);

  return (
    <Screen>
      <AppHeader
        title="Performance Module"
        subtitle="Match, fitness and discipline entries. Attendance is auto from QR."
        showBack
      />

      <AppCard style={{ marginBottom: 14 }}>
        <View style={styles.row}>
          <View style={styles.badge}>
            <Ionicons name="qr-code-outline" size={18} color="#F9FAFB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>Attendance (Auto)</Text>
            <Text style={styles.itemSub}>
              Marked via QR per training session. Attendance score is calculated automatically.
            </Text>
          </View>
        </View>
      </AppCard>

      <AppCard>
        <Text style={styles.title}>Add / Update Performance</Text>

        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push("/adminMatchPerformance")}
        >
          <View style={styles.btnIcon}>
            <Ionicons name="trophy-outline" size={18} color="#F9FAFB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.btnTitle}>Match Performance</Text>
            <Text style={styles.btnSub}>Event → Division → Team → Player entries + placing/points</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={18} color="rgba(229,231,235,0.75)" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push("/adminFitnessPerformance")}
        >
          <View style={styles.btnIcon}>
            <Ionicons name="barbell-outline" size={18} color="#F9FAFB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.btnTitle}>Fitness Tests</Text>
            <Text style={styles.btnSub}>Batch entry for participants (performance_entries)</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={18} color="rgba(229,231,235,0.75)" />
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]}
          onPress={() => router.push("/adminDisciplinePerformance")}
        >
          <View style={styles.btnIcon}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#F9FAFB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.btnTitle}>Discipline</Text>
            <Text style={styles.btnSub}>Notes/metric/value entries per student</Text>
          </View>
          <Ionicons name="chevron-forward-outline" size={18} color="rgba(229,231,235,0.75)" />
        </Pressable>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: { color: "#F9FAFB", fontSize: 16, fontWeight: "900", marginBottom: 10 },

  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  itemTitle: { color: "#F9FAFB", fontSize: 14, fontWeight: "900" },
  itemSub: { marginTop: 2, color: "rgba(229,231,235,0.70)", fontSize: 12.5, lineHeight: 17, fontWeight: "600" },

  btn: {
    marginTop: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  btnIcon: {
    width: 40,
    height: 40,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  btnTitle: { color: "#F9FAFB", fontSize: 14.5, fontWeight: "900" },
  btnSub: { marginTop: 2, color: "rgba(229,231,235,0.70)", fontSize: 12.5, lineHeight: 17, fontWeight: "600" },
});
