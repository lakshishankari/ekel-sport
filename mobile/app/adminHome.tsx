import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { loadAuth, clearAuth } from "../lib/authStore";

export default function AdminHome() {
  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "ADMIN") {
        router.replace("/login");
      }
    })();
  }, []);

  async function onLogout() {
    await clearAuth();

    // Safely clear navigation stack
    try {
      let iterations = 0;
      while (router.canGoBack() && iterations < 20) {
        router.back();
        iterations++;
      }
    } catch (e) {
      // Ignore navigation errors
    }

    router.replace("/login");
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0B0F14" }} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.sub}>Manage sports, enrollments, squad/pool, and announcements</Text>

      <TouchableOpacity style={styles.card} onPress={() => router.push("/adminUsers")}>
        <Text style={styles.cardText}>Users</Text>
        <Text style={styles.cardSub}>View all registered users</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push("/adminSports")}>
        <Text style={styles.cardText}>Sports</Text>
        <Text style={styles.cardSub}>Create/manage sports modules</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push("/adminEnrollments")}>
        <Text style={styles.cardText}>Enrollments</Text>
        <Text style={styles.cardSub}>Approve/reject student requests</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push("/adminSquadPool")}>
        <Text style={styles.cardText}>Squad & Pool</Text>
        <Text style={styles.cardSub}>Select students into Pool/Squad (UI first)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push("/adminAnnouncements")}>
        <Text style={styles.cardText}>Announcements</Text>
        <Text style={styles.cardSub}>Create and manage announcements</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push("/adminAddMarks")}>
        <Text style={styles.cardText}>Marks & Performance</Text>
        <Text style={styles.cardSub}>Add fitness/discipline/match scores</Text>
      </TouchableOpacity>



      <TouchableOpacity style={styles.card} onPress={() => router.push("/createAdvisory")}>
        <Text style={styles.cardText}>Create Advisory</Text>
        <Text style={styles.cardSub}>Create advisory accounts (@kln.ac.lk)</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 40 },
  title: { fontSize: 28, fontWeight: "900", color: "white", textAlign: "center", marginTop: 20 },
  sub: { color: "#A7B0BE", textAlign: "center", marginTop: 8, marginBottom: 20 },

  card: {
    backgroundColor: "#121826",
    borderRadius: 14,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#263041",
  },
  cardText: { color: "white", fontSize: 16, fontWeight: "900" },
  cardSub: { color: "#A7B0BE", marginTop: 6, fontSize: 13 },

  logoutBtn: {
    marginTop: 16,
    backgroundColor: "#D4AF37",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  logoutText: { fontWeight: "900", fontSize: 16, color: "#111827" },
});
