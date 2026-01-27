import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function Help() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Help & Support</Text>
      <Text style={styles.sub}>University Sports Management System</Text>

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
