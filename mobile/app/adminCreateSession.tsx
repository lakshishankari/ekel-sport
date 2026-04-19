import React, { useState, useEffect } from "react";
import {
  View, Text, TextInput, Pressable, Alert, ScrollView,
  ActivityIndicator, TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../lib/themeStore";
import { apiGet, apiPost } from "../lib/api";
import { loadAuth } from "../lib/authStore";

type Sport = { id: number; name: string };

export default function AdminCreateSession() {
  const { theme } = useAppTheme();

  const [sports, setSports]         = useState<Sport[]>([]);
  const [loadingSports, setLoadingSports] = useState(true);
  const [selectedSportId, setSelectedSportId] = useState<number | null>(null);

  const [location, setLocation] = useState("");
  const [date, setDate]         = useState(() => new Date().toISOString().split("T")[0]); // default today
  const [time, setTime]         = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ── Load sports on mount
  useEffect(() => {
    (async () => {
      try {
        const data = await apiGet<Sport[]>("/api/admin/sports");
        setSports(data);
        if (data.length > 0) setSelectedSportId(data[0].id);
      } catch {
        Alert.alert("Error", "Failed to load sports");
      } finally {
        setLoadingSports(false);
      }
    })();
  }, []);

  // ── Create session
  const handleCreate = async () => {
    if (!selectedSportId) { Alert.alert("Error", "Please select a sport"); return; }
    if (!location.trim()) { Alert.alert("Error", "Please enter a location"); return; }
    if (!date.trim())     { Alert.alert("Error", "Please enter a date");     return; }

    setSubmitting(true);
    try {
      const { token } = await loadAuth();
      const resp = await apiPost<{ ok: boolean; sessionId: number }>(
        "/api/admin/attendance/sessions",
        {
          sportId:     selectedSportId,
          location:    location.trim(),
          sessionDate: date.trim(),
        },
        token!
      );

      const selectedSport = sports.find((s) => s.id === selectedSportId);

      // Navigate to QR screen with the real session data
      router.push({
        pathname: "/adminDisplayQR",
        params: {
          sessionId:   String(resp.sessionId),
          sport:       selectedSport?.name ?? "",
          location:    location.trim(),
          sessionDate: date.trim(),
          sessionTime: time.trim(),
        },
      });
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to create session");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = {
    marginTop: 6, height: 48, borderRadius: 14, paddingHorizontal: 12,
    color: theme.text, fontWeight: "600" as const,
    backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border,
  };

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <AppHeader title="Create Session" subtitle="New attendance session" showBack />

        {/* ── Sport selector ── */}
        <View style={{
          marginHorizontal: 14, marginTop: 14, padding: 16,
          borderRadius: 20, borderWidth: 1,
          backgroundColor: theme.bgCard, borderColor: theme.border,
        }}>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900", marginBottom: 14 }}>
            Session Details
          </Text>

          <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "800" }}>SPORT *</Text>
          {loadingSports ? (
            <ActivityIndicator color={theme.accent} style={{ marginTop: 10 }} />
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingTop: 8, paddingBottom: 4 }}
            >
              {sports.map((s) => {
                const active = s.id === selectedSportId;
                return (
                  <TouchableOpacity
                    key={s.id}
                    activeOpacity={0.8}
                    onPress={() => setSelectedSportId(s.id)}
                    style={{
                      paddingHorizontal: 16, height: 36, borderRadius: 18,
                      justifyContent: "center", borderWidth: 1,
                      backgroundColor: active ? "rgba(212,175,55,0.18)" : theme.bgInput,
                      borderColor: active ? "#D4AF37" : theme.border,
                    }}
                  >
                    <Text style={{
                      fontSize: 13, fontWeight: "800",
                      color: active ? "#D4AF37" : theme.textSub,
                    }}>
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* Location */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16 }}>
            <Ionicons name="location-outline" size={14} color={theme.textMuted} />
            <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "800" }}>LOCATION *</Text>
          </View>
          <TextInput
            value={location}
            onChangeText={setLocation}
            style={inputStyle as any}
            placeholder="e.g., Main Ground, Sports Complex"
            placeholderTextColor={theme.textMuted}
          />

          {/* Date & Time row */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 }}>
                <Ionicons name="calendar-outline" size={14} color={theme.textMuted} />
                <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "800" }}>DATE *</Text>
              </View>
              <TextInput
                value={date}
                onChangeText={setDate}
                style={inputStyle as any}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={theme.textMuted}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 }}>
                <Ionicons name="time-outline" size={14} color={theme.textMuted} />
                <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "800" }}>TIME (opt)</Text>
              </View>
              <TextInput
                value={time}
                onChangeText={setTime}
                style={inputStyle as any}
                placeholder="HH:MM"
                placeholderTextColor={theme.textMuted}
              />
            </View>
          </View>

          {/* Create button */}
          <Pressable
            style={({ pressed }) => [{
              marginTop: 20, height: 52, borderRadius: 14,
              alignItems: "center", justifyContent: "center",
              backgroundColor: "#D4AF37",
              flexDirection: "row", gap: 8,
            }, pressed && { opacity: 0.88 }, submitting && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <>
                <Ionicons name="qr-code-outline" size={20} color="#111827" />
                <Text style={{ color: "#111827", fontSize: 16, fontWeight: "900" }}>
                  Create & Show QR Code
                </Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Info tip */}
        <View style={{
          flexDirection: "row", alignItems: "flex-start", gap: 10,
          marginTop: 16, marginHorizontal: 14, padding: 14,
          backgroundColor: theme.accent + "12",
          borderRadius: 14, borderWidth: 1, borderColor: theme.accent + "33",
        }}>
          <Ionicons name="information-circle-outline" size={18} color={theme.accent} />
          <Text style={{ flex: 1, color: theme.textSub, fontSize: 12, fontWeight: "600", lineHeight: 18 }}>
            One QR code is generated per session. Students scan it from their app to instantly mark their attendance.
            Each student can only scan once per session.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
