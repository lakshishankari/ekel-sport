import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StatusBar } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import { loadLocalProfile } from "../lib/profileStore";
import { apiGet } from "../lib/api";
import { logout } from "../lib/logout";
import { useAppTheme } from "../lib/themeStore";

export default function StudentHome() {
  const { theme, isDark } = useAppTheme();
  const [unread, setUnread] = useState<number>(0);
  const [fullName, setFullName] = useState("Student");
  const [avatarColor, setAvatarColor] = useState("#4F46E5");

  async function loadUnread() {
    try {
      const { token, role } = await loadAuth();
      if (!token || role !== "STUDENT") return;
      const res = await apiGet<{ unread: number }>("/api/student/notifications/unread-count", token);
      setUnread(res.unread || 0);
    } catch { setUnread(0); }
  }

  useEffect(() => {
    (async () => {
      const auth = await loadAuth();
      if (!auth.token || auth.role !== "STUDENT") { router.replace("/login"); return; }
      if (auth.fullName) setFullName(auth.fullName);
      const local = await loadLocalProfile(auth.fullName || "");
      setAvatarColor(local.avatarColor);
      await loadUnread();
    })();
  }, []);

  const cards = [
    { label: "My Sports", sub: "Approved sports & WhatsApp links", icon: "medal-outline" as const, route: "/mySports" },
    { label: "Sports & Enrollment", sub: "Browse sports & request enrollment", icon: "basketball-outline" as const, route: "/studentSports" },
    { label: "Scan Attendance", sub: "Mark your attendance with QR", icon: "qr-code-outline" as const, route: "/studentScanAttendance" },
    { label: "My Attendance", sub: "View attendance history", icon: "calendar-outline" as const, route: "/studentAttendance" },
    { label: "My Performance", sub: "View scores & achievements", icon: "trophy-outline" as const, route: "/studentPerformance" },
    { label: "Help & Support", sub: "Contact admin / guidelines", icon: "help-circle-outline" as const, route: "/help" },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 18, marginBottom: 18 }}>
        <TouchableOpacity onPress={() => router.push("/studentProfile")}>
          <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: avatarColor }}>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "900" }}>
              {fullName.split(" ").filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join("")}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 24, fontWeight: "900" }} numberOfLines={1}>{fullName.split(" ")[0]}</Text>
          <Text style={{ color: theme.textSub, marginTop: 2, fontSize: 13 }}>Dashboard</Text>
        </View>

        <TouchableOpacity
          style={{ padding: 12, borderRadius: 999, backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border }}
          onPress={() => router.push("/studentNotifications")}
        >
          <Ionicons name="notifications-outline" size={24} color={theme.text} />
          {unread > 0 ? (
            <View style={{ position: "absolute", top: -6, right: -6, minWidth: 18, height: 18, borderRadius: 999, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center", paddingHorizontal: 5 }}>
              <Text style={{ color: "white", fontSize: 11, fontWeight: "900" }}>{unread > 99 ? "99+" : String(unread)}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* Nav cards */}
      {cards.map((c) => (
        <TouchableOpacity
          key={c.route}
          style={{ backgroundColor: theme.bgCard, borderRadius: 16, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: theme.border, flexDirection: "row", alignItems: "center", gap: 14 }}
          onPress={() => router.push(c.route as any)}
        >
          <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: theme.accent + "26", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name={c.icon} size={24} color={theme.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>{c.label}</Text>
            <Text style={{ color: theme.textSub, marginTop: 4, fontSize: 13 }}>{c.sub}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.textSub} />
        </TouchableOpacity>
      ))}

      <TouchableOpacity onPress={loadUnread} style={{ marginTop: 6 }}>
        <Text style={{ color: theme.textSub, textDecorationLine: "underline", textAlign: "center" }}>Refresh notifications</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={{ marginTop: 18, backgroundColor: theme.btnPrimary, padding: 14, borderRadius: 14, alignItems: "center" }}
        onPress={logout}
      >
        <Text style={{ fontWeight: "900", fontSize: 16, color: theme.btnPrimaryText }}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
