import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth, clearAuth } from "../lib/authStore";

type NavItem = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  accent: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    title: "Sports",
    subtitle: "Create and manage sport modules",
    icon: "football",
    route: "/adminSports",
    accent: "#10B981",
  },
  {
    title: "Enrollments",
    subtitle: "Approve or reject student requests",
    icon: "person-add",
    route: "/adminEnrollments",
    accent: "#6366F1",
  },
  {
    title: "Squad & Pool",
    subtitle: "Assign POOL / SQUAD levels and team members",
    icon: "shield",
    route: "/adminSquadPool",
    accent: "#C9A227",
  },
  {
    title: "Marks & Performance",
    subtitle: "Record fitness, match and discipline scores",
    icon: "bar-chart",
    route: "/adminAddMarks",
    accent: "#F59E0B",
  },
  {
    title: "Attendance",
    subtitle: "Create QR sessions and view attendance lists",
    icon: "scan",
    route: "/adminCreateSession",
    accent: "#3B82F6",
  },
  {
    title: "Announcements",
    subtitle: "Broadcast messages to all students",
    icon: "megaphone",
    route: "/adminAnnouncements",
    accent: "#EC4899",
  },
  {
    title: "Reports & Analytics",
    subtitle: "Performance, attendance and eligibility insights",
    icon: "analytics",
    route: "/adminReports",
    accent: "#8B5CF6",
  },
  {
    title: "Users",
    subtitle: "View all registered users",
    icon: "people",
    route: "/adminUsers",
    accent: "#14B8A6",
  },
  {
    title: "Create Advisory Account",
    subtitle: "Add a new advisory board member",
    icon: "person-circle",
    route: "/createAdvisory",
    accent: "#D97706",
  },
];

const QUICK_STATS = [
  { label: "Students",    value: "87",  color: "#C9A227" },
  { label: "Sports",      value: "3",   color: "#10B981" },
  { label: "Pending",     value: "4",   color: "#F59E0B" },
  { label: "In Squad",    value: "22",  color: "#6366F1" },
];

export default function AdminHome() {
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    (async () => {
      const { token, role, fullName } = await loadAuth();
      if (!token || role !== "ADMIN") {
        router.replace("/login");
        return;
      }
      if (fullName) setUserName(fullName);
    })();
  }, []);

  async function onLogout() {
    await clearAuth();
    router.replace("/login");
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.headerSub}>Admin · KLN University Sports</Text>
          </View>
          <Pressable onPress={onLogout} style={styles.logoutIcon} hitSlop={10}>
            <Ionicons name="log-out-outline" size={22} color="#C9A227" />
          </Pressable>
        </View>

        {/* ── Quick stats ── */}
        <View style={styles.statsRow}>
          {QUICK_STATS.map((s) => (
            <View key={s.label} style={styles.statCard}>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Navigation grid ── */}
        <Text style={styles.sectionTitle}>Manage</Text>

        <View style={styles.navGrid}>
          {NAV_ITEMS.map((item) => (
            <Pressable
              key={item.route}
              style={({ pressed }) => [styles.navCard, pressed && { opacity: 0.82 }]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={[styles.navIcon, { backgroundColor: item.accent + "1A" }]}>
                <Ionicons name={item.icon} size={22} color={item.accent} />
              </View>
              <Text style={styles.navTitle}>{item.title}</Text>
              <Text style={styles.navSub}>{item.subtitle}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#0B0F14" },
  scroll: { paddingBottom: 32 },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 4,
  },
  greeting:  { color: "rgba(229,231,235,0.45)", fontSize: 12, fontWeight: "600" },
  userName:  { color: "#F9FAFB", fontSize: 22, fontWeight: "900", marginTop: 2 },
  headerSub: { color: "rgba(229,231,235,0.35)", fontSize: 11, fontWeight: "600", marginTop: 3 },
  logoutIcon: {
    marginTop: 4,
    backgroundColor: "rgba(201,162,39,0.1)",
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.2)",
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 22,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "rgba(18,24,38,0.85)",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 4,
  },
  statValue: { fontSize: 20, fontWeight: "900" },
  statLabel: { color: "rgba(229,231,235,0.4)", fontSize: 9, fontWeight: "700", textAlign: "center" },

  // Nav
  sectionTitle: {
    color: "rgba(229,231,235,0.5)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    paddingHorizontal: 22,
    marginTop: 24,
    marginBottom: 12,
  },
  navGrid: {
    paddingHorizontal: 22,
    gap: 10,
  },
  navCard: {
    backgroundColor: "rgba(18,24,38,0.85)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 6,
  },
  navIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  navTitle: { color: "#F9FAFB", fontSize: 15, fontWeight: "800" },
  navSub:   { color: "rgba(229,231,235,0.45)", fontSize: 12, fontWeight: "500", lineHeight: 17 },
});
