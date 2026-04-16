import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../lib/themeStore";

const FAQ = [
  "Use your university email to register",
  "Enrollment requests need Admin approval",
  "Notifications show approval/rejection updates",
  "Scan QR codes at sessions to mark attendance",
];

const CONTACT = [
  { icon: "business-outline" as const, text: "Sports Unit - University of Kelaniya" },
  { icon: "mail-outline" as const,     text: "sports@kln.ac.lk (demo)" },
];

export default function Help() {
  const { theme } = useAppTheme();

  return (
    <Screen>
      <AppHeader title="Help & Support" subtitle="University Sports Management System" />

      {/* FAQ Card */}
      <View style={{ backgroundColor: theme.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: theme.accent + "22", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="help-circle-outline" size={20} color={theme.accent} />
          </View>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>FAQ</Text>
        </View>
        {FAQ.map((item, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.accent, marginTop: 6 }} />
            <Text style={{ color: theme.textSub, fontSize: 14, lineHeight: 20, flex: 1 }}>{item}</Text>
          </View>
        ))}
      </View>

      {/* Contact Card */}
      <View style={{ backgroundColor: theme.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#3B82F622", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="call-outline" size={20} color="#3B82F6" />
          </View>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>Contact</Text>
        </View>
        {CONTACT.map((c, i) => (
          <View key={i} style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Ionicons name={c.icon} size={16} color={theme.textMuted} />
            <Text style={{ color: theme.textSub, fontSize: 14 }}>{c.text}</Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}
