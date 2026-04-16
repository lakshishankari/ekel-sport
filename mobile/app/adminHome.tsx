import React, { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, StatusBar } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth, clearAuth } from "../lib/authStore";
import { useAppTheme } from "../lib/themeStore";

type NavItem = { title: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; route: string; accent: string };

const NAV_ITEMS: NavItem[] = [
  { title: "Sports", subtitle: "Create and manage sport modules", icon: "football", route: "/adminSports", accent: "#10B981" },
  { title: "Enrollments", subtitle: "Approve or reject student requests", icon: "person-add", route: "/adminEnrollments", accent: "#6366F1" },
  { title: "Squad & Pool", subtitle: "Assign POOL / SQUAD levels and team members", icon: "shield", route: "/adminSquadPool", accent: "#C9A227" },
  { title: "Marks & Performance", subtitle: "Record fitness, match and discipline scores", icon: "bar-chart", route: "/adminAddMarks", accent: "#F59E0B" },
  { title: "Attendance", subtitle: "Create QR sessions and view attendance lists", icon: "scan", route: "/adminCreateSession", accent: "#3B82F6" },
  { title: "Announcements", subtitle: "Broadcast messages to all students", icon: "megaphone", route: "/adminAnnouncements", accent: "#EC4899" },
  { title: "Reports & Analytics", subtitle: "Performance, attendance and eligibility insights", icon: "analytics", route: "/adminReports", accent: "#8B5CF6" },
  { title: "Users", subtitle: "View all registered users", icon: "people", route: "/adminUsers", accent: "#14B8A6" },
  { title: "Create Advisory Account", subtitle: "Add a new advisory board member", icon: "person-circle", route: "/createAdvisory", accent: "#D97706" },
];

const QUICK_STATS = [
  { label: "Students", value: "87", color: "#C9A227" },
  { label: "Sports", value: "3", color: "#10B981" },
  { label: "Pending", value: "4", color: "#F59E0B" },
  { label: "In Squad", value: "22", color: "#6366F1" },
];

export default function AdminHome() {
  const { theme, isDark } = useAppTheme();
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    (async () => {
      const { token, role, fullName } = await loadAuth();
      if (!token || role !== "ADMIN") { router.replace("/login"); return; }
      if (fullName) setUserName(fullName);
    })();
  }, []);

  async function onLogout() {
    await clearAuth();
    router.replace("/login");
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>

        {/* Header */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingHorizontal: 22, paddingTop: 20, paddingBottom: 4 }}>
          <View>
            <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: "600" }}>Welcome back</Text>
            <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900", marginTop: 2 }}>{userName}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "600", marginTop: 3 }}>Admin · KLN University Sports</Text>
          </View>
          <Pressable onPress={onLogout} style={{ marginTop: 4, backgroundColor: theme.accent + "1A", borderRadius: 10, padding: 8, borderWidth: 1, borderColor: theme.accent + "33" }} hitSlop={10}>
            <Ionicons name="log-out-outline" size={22} color={theme.accent} />
          </Pressable>
        </View>

        {/* Stats */}
        <View style={{ flexDirection: "row", gap: 10, paddingHorizontal: 22, marginTop: 20 }}>
          {QUICK_STATS.map((s) => (
            <View key={s.label} style={{ flex: 1, backgroundColor: theme.bgCard, borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: theme.border, gap: 4 }}>
              <Text style={{ fontSize: 20, fontWeight: "900", color: s.color }}>{s.value}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 9, fontWeight: "700", textAlign: "center" }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Nav */}
        <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1.2, paddingHorizontal: 22, marginTop: 24, marginBottom: 12 }}>MANAGE</Text>
        <View style={{ paddingHorizontal: 22, gap: 10 }}>
          {NAV_ITEMS.map((item) => (
            <Pressable
              key={item.route}
              style={({ pressed }) => [{ backgroundColor: theme.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, gap: 6 }, pressed && { opacity: 0.82 }]}
              onPress={() => router.push(item.route as any)}
            >
              <View style={{ width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: item.accent + "1A", marginBottom: 4 }}>
                <Ionicons name={item.icon} size={22} color={item.accent} />
              </View>
              <Text style={{ color: theme.text, fontSize: 15, fontWeight: "800" }}>{item.title}</Text>
              <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "500", lineHeight: 17 }}>{item.subtitle}</Text>
            </Pressable>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}
