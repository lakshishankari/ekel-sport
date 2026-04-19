import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  FlatList, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPost } from "../lib/api";
import { loadAuth } from "../lib/authStore";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../lib/themeStore";

type Sport = {
  id: number;
  name: string;
  venue: string | null;
  schedule_text: string | null;
  instructor_name: string | null;
  instructor_email: string | null;
  whatsapp_link: string | null;
  eligibility_criteria: string | null;
};

export default function AdminSports() {
  const { theme } = useAppTheme();
  const [sports, setSports]                         = useState<Sport[]>([]);
  const [loading, setLoading]                       = useState(true);
  const [name, setName]                             = useState("");
  const [venue, setVenue]                           = useState("");
  const [scheduleText, setScheduleText]             = useState("");
  const [instructorName, setInstructorName]         = useState("");
  const [instructorEmail, setInstructorEmail]       = useState("");
  const [whatsappLink, setWhatsappLink]             = useState("");
  const [eligibilityCriteria, setEligibilityCriteria] = useState("");
  const [expandedId, setExpandedId]                = useState<number | null>(null);

  async function fetchSports() {
    try {
      const { token } = await loadAuth();
      if (!token) return router.replace("/login");
      const data = await apiGet<Sport[]>("/api/admin/sports", token);
      setSports(data);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load sports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchSports(); }, []);

  async function onCreateSport() {
    if (!name.trim()) { Alert.alert("Missing", "Sport name is required"); return; }
    try {
      const { token } = await loadAuth();
      if (!token) return router.replace("/login");
      await apiPost(
        "/api/admin/sports",
        {
          name: name.trim(),
          venue: venue.trim(),
          schedule_text: scheduleText.trim(),
          instructor_name: instructorName.trim(),
          instructor_email: instructorEmail.trim(),
          whatsapp_link: whatsappLink.trim(),
          eligibility_criteria: eligibilityCriteria.trim(),
        },
        token,
      );
      Alert.alert("✅ Success", "Sport created successfully.");
      setName(""); setVenue(""); setScheduleText("");
      setInstructorName(""); setInstructorEmail(""); setWhatsappLink("");
      setEligibilityCriteria("");
      setLoading(true);
      await fetchSports();
    } catch (e: any) {
      Alert.alert("Create failed", e?.message || "Try again");
    }
  }

  const inputStyle = {
    borderWidth: 1, borderColor: theme.border, borderRadius: 12,
    padding: 12, color: theme.text, backgroundColor: theme.bg,
    marginBottom: 10, fontSize: 14,
  };

  const basicFields = [
    { placeholder: "Sport name (e.g., Cricket) *",       value: name,           onChange: setName,           autoCapitalize: "sentences" as const },
    { placeholder: "Venue (e.g., Main Ground)",           value: venue,          onChange: setVenue },
    { placeholder: "Schedule (e.g., Mon/Wed 4–6 PM)",    value: scheduleText,   onChange: setScheduleText },
    { placeholder: "Instructor name (optional)",          value: instructorName, onChange: setInstructorName, autoCapitalize: "words" as const },
    { placeholder: "Instructor email @kln.ac.lk",        value: instructorEmail,onChange: setInstructorEmail,autoCapitalize: "none" as const, keyboardType: "email-address" as const },
    { placeholder: "WhatsApp group link (optional)",     value: whatsappLink,   onChange: setWhatsappLink,   autoCapitalize: "none" as const },
  ];

  return (
    <Screen>
      <AppHeader title="Manage Sports" subtitle="Add sports and view existing ones" backRoute="/adminHome" />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <FlatList
          data={sports}
          keyExtractor={(item) => String(item.id)}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 24 }}
          ListHeaderComponent={
            <>
              {/* ── Create Form ── */}
              <View style={{
                backgroundColor: theme.bgCard, borderRadius: 16,
                padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 16,
              }}>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900", marginBottom: 14 }}>
                  Create New Sport
                </Text>

                {basicFields.map((f, i) => (
                  <TextInput
                    key={i}
                    style={inputStyle as any}
                    placeholder={f.placeholder}
                    placeholderTextColor={theme.textMuted}
                    value={f.value}
                    onChangeText={f.onChange}
                    autoCapitalize={f.autoCapitalize || "sentences"}
                    keyboardType={f.keyboardType || "default"}
                  />
                ))}

                {/* ── Eligibility Criteria ── */}
                <View style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <Ionicons name="checkmark-circle-outline" size={16} color={theme.accent} />
                    <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "700" }}>
                      Eligibility Criteria
                    </Text>
                  </View>
                  <TextInput
                    style={[inputStyle as any, { minHeight: 110, textAlignVertical: "top" }]}
                    placeholder={
                      "List eligibility requirements, one per line.\n" +
                      "e.g. Age 17–35 years\n" +
                      "e.g. Medical fitness certificate required\n" +
                      "e.g. No prior experience needed"
                    }
                    placeholderTextColor={theme.textMuted}
                    value={eligibilityCriteria}
                    onChangeText={setEligibilityCriteria}
                    multiline
                    autoCapitalize="sentences"
                  />
                  <Text style={{ color: theme.textMuted, fontSize: 11, marginTop: -6 }}>
                    These will be shown to guests on the Guest Portal under Eligibility.
                  </Text>
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: theme.btnPrimary, padding: 14, borderRadius: 12,
                    alignItems: "center", flexDirection: "row", justifyContent: "center",
                    gap: 8, marginTop: 4,
                  }}
                  onPress={onCreateSport}
                >
                  <Ionicons name="add-circle-outline" size={20} color={theme.btnPrimaryText} />
                  <Text style={{ fontWeight: "800", fontSize: 16, color: theme.btnPrimaryText }}>
                    Create Sport
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "800", letterSpacing: 1, marginBottom: 10 }}>
                EXISTING SPORTS
              </Text>
              {loading && <ActivityIndicator color={theme.accent} style={{ marginVertical: 20 }} />}
            </>
          }
          ListEmptyComponent={
            !loading ? (
              <View style={{ alignItems: "center", paddingVertical: 30 }}>
                <Text style={{ color: theme.textMuted, fontSize: 14 }}>No sports added yet.</Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const isExpanded = expandedId === item.id;
            const criteria = item.eligibility_criteria
              ? item.eligibility_criteria.split("\n").map((s) => s.trim()).filter(Boolean)
              : [];

            return (
              <View style={{
                backgroundColor: theme.bgCard, borderRadius: 14,
                marginBottom: 10, borderWidth: 1, borderColor: isExpanded ? theme.accent + "66" : theme.border,
                overflow: "hidden",
              }}>
                {/* Header row */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => setExpandedId(isExpanded ? null : item.id)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 14 }}
                >
                  <View style={{
                    width: 36, height: 36, borderRadius: 10,
                    backgroundColor: theme.accent + "22",
                    alignItems: "center", justifyContent: "center",
                  }}>
                    <Ionicons name="football-outline" size={18} color={theme.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800" }}>{item.name}</Text>
                    {!!item.venue && (
                      <Text style={{ color: theme.textSub, fontSize: 12, marginTop: 2 }}>📍 {item.venue}</Text>
                    )}
                  </View>
                  <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={18} color={theme.textSub} />
                </TouchableOpacity>

                {/* Expanded details */}
                {isExpanded && (
                  <View style={{ borderTopWidth: 1, borderTopColor: theme.border, padding: 14, gap: 8 }}>
                    {!!item.schedule_text && (
                      <Text style={{ color: theme.textSub, fontSize: 13 }}>📅 {item.schedule_text}</Text>
                    )}
                    {!!item.instructor_name && (
                      <Text style={{ color: theme.textSub, fontSize: 13 }}>👤 {item.instructor_name}</Text>
                    )}
                    {!!item.instructor_email && (
                      <Text style={{ color: theme.textSub, fontSize: 13 }}>✉️ {item.instructor_email}</Text>
                    )}

                    {/* Eligibility criteria */}
                    {criteria.length > 0 ? (
                      <View style={{
                        backgroundColor: theme.accent + "10", borderRadius: 10,
                        padding: 12, borderWidth: 1, borderColor: theme.accent + "33", marginTop: 4,
                      }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                          <Ionicons name="shield-checkmark-outline" size={15} color={theme.accent} />
                          <Text style={{ color: theme.accent, fontSize: 13, fontWeight: "800" }}>
                            Eligibility Criteria
                          </Text>
                        </View>
                        {criteria.map((c, i) => (
                          <View key={i} style={{ flexDirection: "row", gap: 8, marginBottom: 4 }}>
                            <Ionicons name="checkmark" size={14} color={theme.accent} style={{ marginTop: 2 }} />
                            <Text style={{ color: theme.text, fontSize: 13, flex: 1 }}>{c}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={{ color: theme.textMuted, fontSize: 12, fontStyle: "italic" }}>
                        No eligibility criteria set for this sport.
                      </Text>
                    )}
                  </View>
                )}
              </View>
            );
          }}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}
