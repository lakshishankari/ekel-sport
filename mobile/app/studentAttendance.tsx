import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { router } from "expo-router";
import { loadAuth } from "../lib/authStore";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";

export default function StudentAttendance() {
  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "STUDENT") router.replace("/login");
    })();
  }, []);

  return (
    <Screen>
      <AppHeader title="My Attendance" subtitle="View your attendance history" />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Coming in Phase 2</Text>
          <Text style={styles.infoText}>QR Attendance System</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Planned Features</Text>
          <Text style={styles.cardText}>• QR code scan to mark attendance</Text>
          <Text style={styles.cardText}>• View attendance percentage</Text>
          <Text style={styles.cardText}>• Session history</Text>
          <Text style={styles.cardText}>• Attendance statistics per sport</Text>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  infoCard: {
    backgroundColor: "rgba(201,162,39,0.1)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.3)",
    alignItems: "center",
  },
  infoTitle: {
    color: "#C9A227",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },
  infoText: {
    color: "#A7B0BE",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#121826",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#263041",
  },
  cardTitle: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 10,
  },
  cardText: {
    color: "#A7B0BE",
    marginTop: 6,
    fontSize: 14,
  },
});
