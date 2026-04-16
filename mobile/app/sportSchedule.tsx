import React from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Linking, Alert,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../lib/themeStore";

// Parse schedule_text like "Mon/Wed 4-6PM" or "Mon, Wed, Fri 3:00PM–5:00PM"
function parseScheduleDays(text: string): string[] {
  const dayMap: Record<string, string> = {
    mon: "Monday", tue: "Tuesday", wed: "Wednesday",
    thu: "Thursday", fri: "Friday", sat: "Saturday", sun: "Sunday",
  };
  const days: string[] = [];
  Object.keys(dayMap).forEach((abbr) => {
    if (text.toLowerCase().includes(abbr)) days.push(dayMap[abbr]);
  });
  return days;
}

function extractTime(text: string): string {
  // Extract time portion after day abbreviations
  const match = text.match(/(\d{1,2}(?::\d{2})?(?:\s*[AP]M)?[\s–-]+\d{1,2}(?::\d{2})?(?:\s*[AP]M)?)/i);
  return match ? match[0].trim() : text;
}

const ALL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function SportSchedule() {
  const { theme } = useAppTheme();
  const params = useLocalSearchParams<{
    id: string; name: string; venue: string; schedule_text: string;
    instructor_name: string; instructor_email: string; whatsapp_link: string;
    decided_at: string;
  }>();

  const name           = params.name           || "Sport";
  const venue          = params.venue          || "";
  const scheduleText   = params.schedule_text  || "";
  const instructorName = params.instructor_name || "";
  const instructorEmail= params.instructor_email|| "";
  const whatsappLink   = params.whatsapp_link  || "";
  const decidedAt      = params.decided_at     || "";

  const activeDays = scheduleText ? parseScheduleDays(scheduleText) : [];
  const timeDisplay = scheduleText ? extractTime(scheduleText) : "";

  async function openWhatsApp() {
    if (!whatsappLink) return;
    try {
      const ok = await Linking.canOpenURL(whatsappLink);
      if (!ok) { Alert.alert("Cannot open", "WhatsApp link not supported on this device."); return; }
      await Linking.openURL(whatsappLink);
    } catch { Alert.alert("Error", "Failed to open WhatsApp link."); }
  }

  async function emailInstructor() {
    if (!instructorEmail) return;
    const url = `mailto:${instructorEmail}`;
    try { await Linking.openURL(url); }
    catch { Alert.alert("Error", "Could not open email app."); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>

      {/* Header */}
      <View style={{ paddingTop: 52, paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", gap: 12 }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border, alignItems: "center", justifyContent: "center" }}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900" }} numberOfLines={1}>{name}</Text>
          <Text style={{ color: theme.textSub, fontSize: 13, marginTop: 2 }}>Schedule & Details</Text>
        </View>
        <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, backgroundColor: "#10B98122" }}>
          <Text style={{ color: "#10B981", fontWeight: "800", fontSize: 11 }}>APPROVED</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}>

        {/* ── Weekly Timetable ── */}
        <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900", marginBottom: 12 }}>Weekly Schedule</Text>

        {scheduleText ? (
          <>
            {/* Grid of days */}
            <View style={{ backgroundColor: theme.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 16 }}>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {ALL_DAYS.map((day) => {
                  const isActive = activeDays.includes(day);
                  return (
                    <View
                      key={day}
                      style={{
                        flex: 1, minWidth: 80, alignItems: "center", paddingVertical: 12, borderRadius: 12,
                        backgroundColor: isActive ? theme.accent + "22" : theme.bgInput,
                        borderWidth: 1,
                        borderColor: isActive ? theme.accent + "55" : theme.border,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontWeight: "900", color: isActive ? theme.accent : theme.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                        {day.slice(0, 3)}
                      </Text>
                      {isActive && (
                        <View style={{ marginTop: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: theme.accent }} />
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Time banner */}
              {timeDisplay ? (
                <View style={{ marginTop: 14, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: theme.bgInput, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border }}>
                  <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: theme.accent + "22", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="time-outline" size={18} color={theme.accent} />
                  </View>
                  <View>
                    <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>Practice Time</Text>
                    <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900", marginTop: 2 }}>{timeDisplay}</Text>
                  </View>
                </View>
              ) : null}

              {/* Raw schedule text */}
              <View style={{ marginTop: 12, padding: 10, backgroundColor: theme.accent + "0F", borderRadius: 10, borderWidth: 1, borderColor: theme.accent + "33" }}>
                <Text style={{ color: theme.accent, fontSize: 13, fontWeight: "700" }}>📋 {scheduleText}</Text>
              </View>
            </View>

            {/* Active days summary */}
            {activeDays.length > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20, backgroundColor: theme.bgCard, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border }}>
                <Ionicons name="calendar" size={18} color={theme.accent} />
                <Text style={{ color: theme.textSub, fontSize: 14, flex: 1, lineHeight: 20 }}>
                  <Text style={{ color: theme.text, fontWeight: "800" }}>Training Days: </Text>
                  {activeDays.join(" · ")}
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={{ backgroundColor: theme.bgCard, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: theme.border, alignItems: "center", marginBottom: 16 }}>
            <Ionicons name="calendar-outline" size={40} color={theme.border} />
            <Text style={{ color: theme.textSub, marginTop: 10, fontSize: 14, textAlign: "center" }}>
              Schedule not set yet. Contact your instructor for session times.
            </Text>
          </View>
        )}

        {/* ── Venue ── */}
        <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900", marginBottom: 12 }}>Venue</Text>
        <View style={{ backgroundColor: theme.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "#3B82F622", alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="location" size={22} color="#3B82F6" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>Location</Text>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800", marginTop: 2 }}>
              {venue || "Not specified"}
            </Text>
          </View>
        </View>

        {/* ── Instructor ── */}
        <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900", marginBottom: 12 }}>Instructor</Text>
        <View style={{ backgroundColor: theme.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: theme.border, marginBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: instructorEmail ? 14 : 0 }}>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: "#8B5CF622", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="person" size={24} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>Instructor Name</Text>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800", marginTop: 2 }}>
                {instructorName || "Not assigned"}
              </Text>
            </View>
          </View>

          {instructorEmail ? (
            <TouchableOpacity
              onPress={emailInstructor}
              style={{ flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: theme.bgInput, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border }}
            >
              <Ionicons name="mail-outline" size={18} color={theme.accent} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "700" }}>Email</Text>
                <Text style={{ color: theme.text, fontSize: 13, fontWeight: "700", marginTop: 2 }}>{instructorEmail}</Text>
              </View>
              <Ionicons name="open-outline" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── Enrollment info ── */}
        {decidedAt ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#10B98112", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#10B98133", marginBottom: 20 }}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
            <Text style={{ color: theme.textSub, fontSize: 13, flex: 1 }}>
              Enrolled on {new Date(decidedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </Text>
          </View>
        ) : null}

        {/* ── WhatsApp ── */}
        {whatsappLink ? (
          <>
            <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900", marginBottom: 12 }}>Team Group</Text>
            <TouchableOpacity
              onPress={openWhatsApp}
              style={{ backgroundColor: "#25D366", borderRadius: 16, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 20 }}
            >
              <Ionicons name="logo-whatsapp" size={28} color="white" />
              <View>
                <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>Open WhatsApp Group</Text>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, marginTop: 2 }}>Stay connected with your team</Text>
              </View>
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: theme.bgCard, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: theme.border, marginBottom: 20 }}>
            <Ionicons name="logo-whatsapp" size={18} color={theme.textMuted} />
            <Text style={{ color: theme.textMuted, fontSize: 13 }}>WhatsApp group link not added yet by admin.</Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}
