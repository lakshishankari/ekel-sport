import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { clearAuth } from "../lib/authStore";

export default function AdminHome() {
  async function onLogout() {
    await clearAuth();
    router.replace("/login");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>

      {/* View all users */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/adminUsers")}
      >
        <Text style={styles.cardText}>View All Users</Text>
      </TouchableOpacity>

      {/* Manage sports */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/adminSports")}
      >
        <Text style={styles.cardText}>Manage Sports</Text>
      </TouchableOpacity>

      {/* ✅ NEW: Approve sport enrollments */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/adminEnrollments")}
      >
        <Text style={styles.cardText}>Approve Sport Enrollments</Text>
      </TouchableOpacity>

      {/* Create advisory */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/createAdvisory")}
      >
        <Text style={styles.cardText}>Create Advisory Account</Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F14",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "white",
    marginBottom: 30,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#121826",
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#263041",
  },
  cardText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  logoutBtn: {
    marginTop: 30,
    backgroundColor: "#D4AF37",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  logoutText: {
    fontWeight: "800",
    fontSize: 16,
    color: "#111827",
  },
});
