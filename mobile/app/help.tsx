import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { router } from "expo-router";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";

export default function Help() {
  return (
    <Screen>
      <AppHeader title="Help & Support" subtitle="University Sports Management System" />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>FAQ</Text>
        <Text style={styles.cardText}>• Use your university email to register</Text>
        <Text style={styles.cardText}>• Enrollment requests need Admin approval</Text>
        <Text style={styles.cardText}>• Notifications show approval/rejection updates</Text>
      </View>

      <View style={[styles.card, { marginTop: 12 }]}>
        <Text style={styles.cardTitle}>Contact</Text>
        <Text style={styles.cardText}>Sports Unit - University of Kelaniya</Text>
        <Text style={styles.cardText}>Email: sports@kln.ac.lk (demo)</Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0F14", padding: 20 },
  card: {
    backgroundColor: "#121826",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#263041",
    marginBottom: 12,
  },
  cardTitle: { color: "white", fontSize: 18, fontWeight: "900", marginBottom: 10 },
  cardText: { color: "#A7B0BE", marginTop: 6 },
});
