import React, { useRef } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../lib/themeStore";

// QR payload format: "EKEL-ATT:SESSION:<sessionId>"
// The student app reads this prefix to validate it's a genuine attendance QR
function buildPayload(sessionId: string) {
  return `EKEL-ATT:SESSION:${sessionId}`;
}

export default function AdminDisplayQR() {
  const { theme } = useAppTheme();
  const params = useLocalSearchParams<{
    sessionId:   string;
    sport:       string;
    location:    string;
    sessionDate: string;
    sessionTime: string;
  }>();

  const sessionId   = params.sessionId   || "";
  const sport       = params.sport       || "Session";
  const location    = params.location    || "—";
  const sessionDate = params.sessionDate || "—";
  const sessionTime = params.sessionTime || "";

  const qrPayload = buildPayload(sessionId);

  function formatDate(d: string) {
    try {
      return new Date(d).toLocaleDateString("en-GB", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric",
      });
    } catch { return d; }
  }

  const infoRows = [
    { icon: "football-outline"  as const, label: "Sport",    value: sport },
    { icon: "location-outline"  as const, label: "Location", value: location },
    { icon: "calendar-outline"  as const, label: "Date",     value: formatDate(sessionDate) },
    ...(sessionTime ? [{ icon: "time-outline" as const, label: "Time", value: sessionTime }] : []),
    { icon: "key-outline"       as const, label: "Session",  value: `#${sessionId}` },
  ];

  return (
    <Screen>
      <AppHeader
        title="QR Code Ready"
        subtitle="Show this screen to students"
        showBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 14 }}
      >
        {/* ── QR Card ── */}
        <View style={{
          marginTop: 14, borderRadius: 24, borderWidth: 1,
          backgroundColor: theme.bgCard, borderColor: "rgba(212,175,55,0.3)",
          alignItems: "center", paddingVertical: 32, paddingHorizontal: 16,
        }}>
          {/* Glow ring */}
          <View style={{
            padding: 16, borderRadius: 24,
            backgroundColor: "white",
            shadowColor: "#D4AF37", shadowOpacity: 0.35,
            shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
            elevation: 10,
          }}>
            <QRCode
              value={qrPayload}
              size={220}
              color="#111827"
              backgroundColor="white"
              logo={undefined}
            />
          </View>

          {/* Session label */}
          <View style={{
            marginTop: 18, flexDirection: "row", alignItems: "center", gap: 6,
            backgroundColor: "rgba(212,175,55,0.12)", paddingHorizontal: 14,
            paddingVertical: 6, borderRadius: 10, borderWidth: 1,
            borderColor: "rgba(212,175,55,0.25)",
          }}>
            <Ionicons name="qr-code" size={14} color="#D4AF37" />
            <Text style={{ color: "#D4AF37", fontSize: 13, fontWeight: "900" }}>
              {sport} · Session #{sessionId}
            </Text>
          </View>

          {/* Instruction */}
          <Text style={{
            marginTop: 12, color: theme.textSub, fontSize: 13,
            fontWeight: "600", textAlign: "center", lineHeight: 20,
          }}>
            Students scan this in their app under{"\n"}
            <Text style={{ color: theme.text, fontWeight: "800" }}>Scan Attendance</Text>
          </Text>
        </View>

        {/* ── Session info ── */}
        <View style={{
          marginTop: 14, borderRadius: 20, borderWidth: 1,
          backgroundColor: theme.bgCard, borderColor: theme.border,
          overflow: "hidden",
        }}>
          {infoRows.map((r, i) => (
            <View
              key={r.label}
              style={{
                flexDirection: "row", alignItems: "center", gap: 12,
                paddingHorizontal: 16, paddingVertical: 14,
                borderBottomWidth: i < infoRows.length - 1 ? 1 : 0,
                borderBottomColor: theme.border,
              }}
            >
              <View style={{
                width: 34, height: 34, borderRadius: 10,
                backgroundColor: "rgba(212,175,55,0.12)",
                alignItems: "center", justifyContent: "center",
                borderWidth: 1, borderColor: "rgba(212,175,55,0.2)",
              }}>
                <Ionicons name={r.icon} size={17} color="#D4AF37" />
              </View>
              <Text style={{ color: theme.textSub, fontSize: 14, fontWeight: "600", width: 72 }}>
                {r.label}
              </Text>
              <Text style={{ flex: 1, color: theme.text, fontSize: 14, fontWeight: "800", textAlign: "right" }}>
                {r.value}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Warning ── */}
        <View style={{
          flexDirection: "row", alignItems: "flex-start", gap: 10,
          marginTop: 14, padding: 14,
          backgroundColor: "#F59E0B12",
          borderRadius: 14, borderWidth: 1, borderColor: "#F59E0B33",
        }}>
          <Ionicons name="warning-outline" size={18} color="#F59E0B" />
          <Text style={{ flex: 1, color: theme.textSub, fontSize: 12, fontWeight: "600", lineHeight: 18 }}>
            Keep this screen open until all students have scanned. Each student can only mark
            attendance once per session.
          </Text>
        </View>

        {/* ── Done button ── */}
        <Pressable
          style={({ pressed }) => [{
            marginTop: 18, height: 52, borderRadius: 14,
            alignItems: "center", justifyContent: "center",
            backgroundColor: theme.bgInput,
            borderWidth: 1, borderColor: theme.border,
            flexDirection: "row", gap: 8,
          }, pressed && { opacity: 0.8 }]}
          onPress={() => router.replace("/adminAttendanceList")}
        >
          <Ionicons name="checkmark-circle-outline" size={20} color={theme.textSub} />
          <Text style={{ color: theme.textSub, fontSize: 16, fontWeight: "800" }}>Done — View Attendance</Text>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
