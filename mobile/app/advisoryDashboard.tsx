import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { loadAuth } from "../lib/authStore";

export default function AdvisoryDashboard() {
  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "ADVISORY") router.replace("/login");
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Advisory Dashboard</Text>
      <Text style={styles.sub}>Coming in Phase 2 (Colours Eligibility)</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Planned Features</Text>
        <Text style={styles.cardText}>• Review student performance</Text>
        <Text style={styles.cardText}>• Colours eligibility decisions</Text>
        <Text style={styles.cardText}>• Approve/reject recommendations</Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
        <Text style={styles.btnText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0F14", padding: 20, justifyContent: "center" },
  title: { color: "white", fontSize: 26, fontWeight: "900", textAlign: "center" },
  sub: { color: "#A7B0BE", textAlign: "center", marginTop: 6, marginBottom: 18 },
  card: {
    backgroundColor: "#121826",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#263041",
  },
  cardTitle: { color: "white", fontSize: 18, fontWeight: "900", marginBottom: 10 },
  cardText: { color: "#A7B0BE", marginTop: 6 },
  btn: { marginTop: 18, alignSelf: "center" },
  btnText: { color: "#A7B0BE", textDecorationLine: "underline", fontWeight: "800" },
});
