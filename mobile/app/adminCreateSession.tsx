import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";
import { useAppTheme } from "../lib/themeStore";

export default function AdminCreateSession() {
  const { theme } = useAppTheme();
  const [sport, setSport] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreateSession = async () => {
    if (!sport.trim()) { Alert.alert("Error", "Please select a sport"); return; }
    if (!location.trim()) { Alert.alert("Error", "Please enter location"); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Alert.alert("Success", "Attendance session created successfully", [
        { text: "Show QR Code", onPress: () => router.push("/adminDisplayQR") },
        { text: "Done", onPress: () => router.back() },
      ]);
    }, 1000);
  };

  const inputStyle = {
    marginTop: 6, height: 48, borderRadius: 14, paddingHorizontal: 12,
    color: theme.text, fontWeight: "600" as const,
    backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border,
  };

  const fields = [
    { label: "Sport", placeholder: "e.g., Cricket, Basketball", value: sport, onChange: setSport, icon: "football-outline" as const },
    { label: "Location", placeholder: "e.g., Main Ground, Sports Complex", value: location, onChange: setLocation, icon: "location-outline" as const },
    { label: "Date (Optional)", placeholder: "YYYY-MM-DD", value: date, onChange: setDate, icon: "calendar-outline" as const },
    { label: "Time (Optional)", placeholder: "HH:MM", value: time, onChange: setTime, icon: "time-outline" as const },
  ];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <AppHeader title="Create Session" subtitle="New attendance session" />

        <AppCard style={{ marginTop: 14 }}>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900", marginBottom: 14 }}>Session Details</Text>

          {fields.map((f, i) => (
            <View key={i}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: i === 0 ? 0 : 12 }}>
                <Ionicons name={f.icon} size={14} color={theme.textMuted} />
                <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "800" }}>{f.label}</Text>
              </View>
              <TextInput
                value={f.value} onChangeText={f.onChange}
                style={inputStyle as any}
                placeholder={f.placeholder} placeholderTextColor={theme.textMuted}
              />
            </View>
          ))}

          <Pressable
            style={({ pressed }) => [{ marginTop: 20, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: theme.btnPrimary, flexDirection: "row", gap: 8 }, pressed && { opacity: 0.88 }, loading && { opacity: 0.6 }]}
            onPress={handleCreateSession} disabled={loading}
          >
            {loading ? <ActivityIndicator color={theme.btnPrimaryText} /> : (
              <>
                <Ionicons name="qr-code-outline" size={20} color={theme.btnPrimaryText} />
                <Text style={{ color: theme.btnPrimaryText, fontSize: 16, fontWeight: "900" }}>Create & Generate QR</Text>
              </>
            )}
          </Pressable>
        </AppCard>

        {/* Info tip */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginTop: 16, padding: 14, backgroundColor: theme.accent + "12", borderRadius: 14, borderWidth: 1, borderColor: theme.accent + "33" }}>
          <Ionicons name="information-circle-outline" size={18} color={theme.accent} />
          <Text style={{ flex: 1, color: theme.textSub, fontSize: 12, fontWeight: "600", lineHeight: 18 }}>
            A QR code will be generated for students to scan and mark their attendance for this session.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </Screen>
  );
}
