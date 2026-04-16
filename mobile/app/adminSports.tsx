import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, FlatList, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPost } from "../lib/api";
import { loadAuth } from "../lib/authStore";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../lib/themeStore";

type Sport = {
  id: number; name: string; venue: string | null;
  schedule_text: string | null; instructor_name: string | null;
  instructor_email: string | null; whatsapp_link: string | null;
};

export default function AdminSports() {
  const { theme } = useAppTheme();
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [scheduleText, setScheduleText] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [instructorEmail, setInstructorEmail] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");

  async function fetchSports() {
    try {
      const { token } = await loadAuth();
      if (!token) return router.replace("/login");
      const data = await apiGet<Sport[]>("/api/admin/sports", token);
      setSports(data);
    } catch (e: any) { Alert.alert("Error", e?.message || "Failed to load sports"); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchSports(); }, []);

  async function onCreateSport() {
    if (!name.trim()) { Alert.alert("Missing", "Sport name is required"); return; }
    try {
      const { token } = await loadAuth();
      if (!token) return router.replace("/login");
      await apiPost("/api/admin/sports", { name: name.trim(), venue: venue.trim(), schedule_text: scheduleText.trim(), instructor_name: instructorName.trim(), instructor_email: instructorEmail.trim(), whatsapp_link: whatsappLink.trim() }, token);
      Alert.alert("Success", "Sport created");
      setName(""); setVenue(""); setScheduleText(""); setInstructorName(""); setInstructorEmail(""); setWhatsappLink("");
      setLoading(true); await fetchSports();
    } catch (e: any) { Alert.alert("Create failed", e?.message || "Try again"); }
  }

  const inputStyle = { borderWidth: 1, borderColor: theme.border, borderRadius: 12, padding: 12, color: theme.text, backgroundColor: theme.bg, marginBottom: 10, fontSize: 14 };
  const fields = [
    { placeholder: "Sport name (e.g., Cricket) *", value: name, onChange: setName, autoCapitalize: "sentences" as const },
    { placeholder: "Venue (optional)", value: venue, onChange: setVenue },
    { placeholder: "Schedule (e.g., Mon/Wed 4-6PM)", value: scheduleText, onChange: setScheduleText },
    { placeholder: "Instructor name (optional)", value: instructorName, onChange: setInstructorName, autoCapitalize: "words" as const },
    { placeholder: "Instructor email @kln.ac.lk", value: instructorEmail, onChange: setInstructorEmail, autoCapitalize: "none" as const, keyboardType: "email-address" as const },
    { placeholder: "WhatsApp link (optional)", value: whatsappLink, onChange: setWhatsappLink, autoCapitalize: "none" as const },
  ];

  return (
    <Screen>
      <AppHeader title="Manage Sports" subtitle="Add sports and view existing ones" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <FlatList
          data={sports}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 20 }}
          ListHeaderComponent={
            <>
              {/* Form Card */}
              <View style={{ backgroundColor: theme.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 16 }}>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900", marginBottom: 14 }}>Create New Sport</Text>
                {fields.map((f, i) => (
                  <TextInput
                    key={i} style={inputStyle as any}
                    placeholder={f.placeholder} placeholderTextColor={theme.textMuted}
                    value={f.value} onChangeText={f.onChange}
                    autoCapitalize={f.autoCapitalize || "sentences"}
                    keyboardType={f.keyboardType || "default"}
                  />
                ))}
                <TouchableOpacity style={{ backgroundColor: theme.btnPrimary, padding: 14, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 4 }} onPress={onCreateSport}>
                  <Ionicons name="add-circle-outline" size={20} color={theme.btnPrimaryText} />
                  <Text style={{ fontWeight: "800", fontSize: 16, color: theme.btnPrimaryText }}>Create Sport</Text>
                </TouchableOpacity>
              </View>

              <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "800", letterSpacing: 1, marginBottom: 10 }}>EXISTING SPORTS</Text>
              {loading && <ActivityIndicator color={theme.accent} style={{ marginVertical: 20 }} />}
            </>
          }
          ListEmptyComponent={!loading ? (
            <View style={{ alignItems: "center", paddingVertical: 30 }}>
              <Text style={{ color: theme.textMuted, fontSize: 14 }}>No sports added yet.</Text>
            </View>
          ) : null}
          renderItem={({ item }) => (
            <View style={{ backgroundColor: theme.bgCard, borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: theme.border }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: theme.accent + "22", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="football-outline" size={18} color={theme.accent} />
                </View>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800" }}>{item.name}</Text>
              </View>
              {!!item.venue && <Text style={{ color: theme.textSub, marginTop: 4, fontSize: 13 }}>📍 {item.venue}</Text>}
              {!!item.schedule_text && <Text style={{ color: theme.textSub, marginTop: 4, fontSize: 13 }}>📅 {item.schedule_text}</Text>}
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}
