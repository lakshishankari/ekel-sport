import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Linking, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPost } from "../lib/api";
import { loadAuth } from "../lib/authStore";
import StudentScreen from "../components/StudentScreen";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../lib/themeStore";

type EnrollmentStatus = "NOT_REQUESTED" | "PENDING" | "APPROVED" | "REJECTED";

type Sport = {
  id: number;
  name: string;
  venue: string | null;
  schedule_text: string | null;
  instructor_name: string | null;
  instructor_email: string | null;
  whatsapp_link: string | null;
  enrollment_status: EnrollmentStatus;
};

const STATUS_CONFIG: Record<EnrollmentStatus, { label: string; bg: string; text: string }> = {
  NOT_REQUESTED: { label: "Not enrolled", bg: "#37415122", text: "#9CA3AF" },
  PENDING:       { label: "Pending",       bg: "#F59E0B22", text: "#F59E0B" },
  APPROVED:      { label: "Approved",      bg: "#10B98122", text: "#10B981" },
  REJECTED:      { label: "Rejected",      bg: "#EF444422", text: "#EF4444" },
};

export default function StudentSports() {
  const { theme } = useAppTheme();
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  const fetchSports = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const { token, role } = await loadAuth();
      if (!token) { router.replace("/login"); return; }
      if (role !== "STUDENT") { router.replace("/"); return; }
      const data = await apiGet<Sport[]>("/api/student/sports", token);
      setSports(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load sports");
      setSports([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchSports(); }, [fetchSports]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchSports(true);
  }, [fetchSports]);

  async function requestEnroll(sportId: number) {
    try {
      setSubmittingId(sportId);
      const { token } = await loadAuth();
      if (!token) { router.replace("/login"); return; }
      const res = await apiPost<{ message: string }>(`/api/student/sports/${sportId}/enroll`, {}, token);
      Alert.alert("Request Sent ✅", res.message || "Enrollment request submitted");
      await fetchSports(true);
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "Could not submit request");
    } finally {
      setSubmittingId(null);
    }
  }

  async function openWhatsApp(link: string) {
    try {
      const ok = await Linking.canOpenURL(link);
      if (!ok) { Alert.alert("Cannot open", "Your phone can't open this WhatsApp link."); return; }
      await Linking.openURL(link);
    } catch { Alert.alert("Error", "Failed to open WhatsApp link."); }
  }

  if (loading) {
    return (
      <StudentScreen activeRoute="/studentSports">
        <AppHeader title="Sports & Enrollment" subtitle="Browse sports and request to join" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.textSub, marginTop: 12, fontSize: 14 }}>Loading sports...</Text>
        </View>
      </StudentScreen>
    );
  }

  if (error) {
    return (
      <StudentScreen activeRoute="/studentSports">
        <AppHeader title="Sports & Enrollment" subtitle="Browse sports and request to join" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Ionicons name="wifi-outline" size={56} color="#EF4444" />
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", marginTop: 16, textAlign: "center" }}>
            Connection Error
          </Text>
          <Text style={{ color: theme.textSub, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
            {error}
          </Text>
          <TouchableOpacity
            style={{ marginTop: 20, backgroundColor: theme.btnPrimary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 }}
            onPress={() => fetchSports()}
          >
            <Text style={{ color: theme.btnPrimaryText, fontWeight: "900", fontSize: 15 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </StudentScreen>
    );
  }

  return (
    <StudentScreen activeRoute="/studentSports">
      <AppHeader title="Sports & Enrollment" subtitle="Browse sports and request to join" />

      <FlatList
        data={sports}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ paddingBottom: 28 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 24 }}>
            <Ionicons name="basketball-outline" size={56} color={theme.border} />
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", marginTop: 16 }}>No Sports Available</Text>
            <Text style={{ color: theme.textSub, textAlign: "center", marginTop: 8 }}>
              No sports have been added yet. Check back soon.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const status = (item.enrollment_status as EnrollmentStatus) || "NOT_REQUESTED";
          const isBusy = submittingId === item.id;
          const canRequest = status === "NOT_REQUESTED" || status === "REJECTED";
          const showWhatsApp = status === "APPROVED" && !!item.whatsapp_link;
          const chip = STATUS_CONFIG[status] ?? STATUS_CONFIG.NOT_REQUESTED;

          return (
            <View style={{ backgroundColor: theme.bgCard, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border }}>

              {/* Title + status chip */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900", flex: 1, paddingRight: 8 }}>
                  {item.name}
                </Text>
                <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: chip.bg }}>
                  <Text style={{ color: chip.text, fontWeight: "800", fontSize: 12 }}>{chip.label}</Text>
                </View>
              </View>

              {/* Details */}
              {!!item.venue && (
                <View style={{ flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 4 }}>
                  <Ionicons name="location-outline" size={13} color={theme.textMuted} />
                  <Text style={{ color: theme.textSub, fontSize: 13 }}>{item.venue}</Text>
                </View>
              )}
              {!!item.schedule_text && (
                <View style={{ flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 4 }}>
                  <Ionicons name="calendar-outline" size={13} color={theme.textMuted} />
                  <Text style={{ color: theme.textSub, fontSize: 13 }}>{item.schedule_text}</Text>
                </View>
              )}
              {!!item.instructor_name && (
                <View style={{ flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 4 }}>
                  <Ionicons name="person-outline" size={13} color={theme.textMuted} />
                  <Text style={{ color: theme.textSub, fontSize: 13 }}>{item.instructor_name}</Text>
                </View>
              )}
              {!!item.instructor_email && (
                <View style={{ flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 4 }}>
                  <Ionicons name="mail-outline" size={13} color={theme.textMuted} />
                  <Text style={{ color: theme.textSub, fontSize: 13 }}>{item.instructor_email}</Text>
                </View>
              )}

              {/* Separator */}
              <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 10 }} />

              {/* Enroll button */}
              <TouchableOpacity
                style={[
                  { padding: 12, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
                  canRequest
                    ? { backgroundColor: theme.btnPrimary }
                    : { backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border },
                  isBusy && { opacity: 0.6 },
                ]}
                onPress={() => canRequest && requestEnroll(item.id)}
                disabled={!canRequest || isBusy}
              >
                {isBusy ? (
                  <ActivityIndicator size="small" color={theme.accent} />
                ) : (
                  <Ionicons
                    name={
                      status === "APPROVED" ? "checkmark-circle" :
                      status === "PENDING"  ? "time-outline" :
                      status === "REJECTED" ? "refresh-circle-outline" :
                      "add-circle-outline"
                    }
                    size={18}
                    color={canRequest ? theme.btnPrimaryText : theme.textMuted}
                  />
                )}
                <Text style={{ fontWeight: "900", color: canRequest ? theme.btnPrimaryText : theme.textMuted }}>
                  {isBusy        ? "Requesting..." :
                   status === "PENDING"  ? "Requested (Pending)" :
                   status === "APPROVED" ? "Enrolled ✓" :
                   status === "REJECTED" ? "Request Again" :
                   "Request Enrollment"}
                </Text>
              </TouchableOpacity>

              {/* WhatsApp */}
              {showWhatsApp && (
                <TouchableOpacity
                  style={{ marginTop: 10, backgroundColor: "#25D366", padding: 12, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                  onPress={() => openWhatsApp(item.whatsapp_link as string)}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="white" />
                  <Text style={{ fontWeight: "900", color: "white" }}>Open WhatsApp Group</Text>
                </TouchableOpacity>
              )}
              {status === "APPROVED" && !item.whatsapp_link && (
                <Text style={{ color: theme.textMuted, marginTop: 10, fontSize: 12 }}>
                  WhatsApp link not added yet by Admin.
                </Text>
              )}
            </View>
          );
        }}
      />
    </StudentScreen>
  );
}
