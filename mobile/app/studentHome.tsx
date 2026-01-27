import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import { apiGet } from "../lib/api";
import { logout } from "../lib/logout";

export default function StudentHome() {
  const [unread, setUnread] = useState<number>(0);

  async function loadUnread() {
    try {
      const { token, role } = await loadAuth();
      if (!token || role !== "STUDENT") return;

      const res = await apiGet<{ unread: number }>(
        "/api/student/notifications/unread-count",
        token
      );

      setUnread(res.unread || 0);
    } catch {
      setUnread(0);
    }
  }

  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "STUDENT") {
        router.replace("/login");
        return;
      }
      await loadUnread();
    })();
  }, []);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#0B0F14" }} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Student</Text>
          <Text style={styles.sub}>Dashboard</Text>
        </View>

        <TouchableOpacity
          style={styles.bellBtn}
          onPress={() => router.push("/studentNotifications")}
        >
          <Ionicons name="notifications-outline" size={24} color="white" />
          {unread > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unread > 99 ? "99+" : String(unread)}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* Main actions (Phase 1) */}
      <TouchableOpacity style={styles.card} onPress={() => router.push("/mySports")}>
        <Text style={styles.cardText}>My Sports</Text>
        <Text style={styles.cardSub}>Approved sports & WhatsApp links</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push("/studentSports")}>
        <Text style={styles.cardText}>Sports & Enrollment</Text>
        <Text style={styles.cardSub}>Browse sports & request enrollment</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push("/studentProfile")}>
        <Text style={styles.cardText}>My Profile</Text>
        <Text style={styles.cardSub}>Edit bio, faculty, degree, achievements</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={() => router.push("/help")}>
        <Text style={styles.cardText}>Help & Support</Text>
        <Text style={styles.cardSub}>Contact admin / guidelines</Text>
      </TouchableOpacity>

      {/* Optional quick link */}
      <TouchableOpacity onPress={loadUnread} style={{ marginTop: 6 }}>
        <Text style={styles.link}>Refresh notifications</Text>
      </TouchableOpacity>

      {/* Logout at bottom full width */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      {/* NOTE:
        We are NOT showing "Reports" for Student.
        Admin + Advisory uses /reports.
      */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingBottom: 40 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 18,
    marginBottom: 18,
  },
  title: { color: "white", fontSize: 30, fontWeight: "900" },
  sub: { color: "#A7B0BE", marginTop: 4 },

  bellBtn: {
    padding: 12,
    borderRadius: 999,
    backgroundColor: "#121826",
    borderWidth: 1,
    borderColor: "#263041",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 999,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: { color: "white", fontSize: 11, fontWeight: "900" },

  card: {
    backgroundColor: "#121826",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#263041",
  },
  cardText: { color: "white", fontSize: 16, fontWeight: "900" },
  cardSub: { color: "#A7B0BE", marginTop: 6, fontSize: 13 },

  link: { color: "#A7B0BE", textDecorationLine: "underline", textAlign: "center" },

  logoutBtn: {
    marginTop: 18,
    backgroundColor: "#D4AF37",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  logoutText: { fontWeight: "900", fontSize: 16, color: "#111827" },
});
