import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { apiGet, apiPost } from "../lib/api";
import { loadAuth } from "../lib/authStore";

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

function statusLabel(s: EnrollmentStatus) {
  if (s === "NOT_REQUESTED") return "Not requested";
  if (s === "PENDING") return "Pending approval";
  if (s === "APPROVED") return "Approved";
  return "Rejected";
}

export default function StudentSports() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  async function fetchSports() {
    try {
      setLoading(true);
      const { token, role } = await loadAuth();
      if (!token) return router.replace("/login");
      if (role !== "STUDENT") return router.replace("/");

      const data = await apiGet<Sport[]>("/api/student/sports", token);
      setSports(data);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load sports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSports();
  }, []);

  async function requestEnroll(sportId: number) {
    try {
      setSubmittingId(sportId);

      const { token } = await loadAuth();
      if (!token) return router.replace("/login");

      const res = await apiPost<{ message: string }>(
        `/api/student/sports/${sportId}/enroll`,
        {},
        token
      );

      Alert.alert("Request sent", res.message || "Enrollment request submitted");
      await fetchSports(); // ✅ refresh statuses
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "Could not submit request");
    } finally {
      setSubmittingId(null);
    }
  }

  async function openWhatsApp(link: string) {
    try {
      const ok = await Linking.canOpenURL(link);
      if (!ok) {
        Alert.alert("Cannot open link", "Your phone can't open this WhatsApp link.");
        return;
      }
      await Linking.openURL(link);
    } catch {
      Alert.alert("Error", "Failed to open WhatsApp link.");
    }
  }

  function StatusChip({ status }: { status: EnrollmentStatus }) {
    const isApproved = status === "APPROVED";
    const isPending = status === "PENDING";
    const isRejected = status === "REJECTED";

    return (
      <View
        style={[
          styles.chip,
          isApproved && styles.chipApproved,
          isPending && styles.chipPending,
          isRejected && styles.chipRejected,
        ]}
      >
        <Text style={styles.chipText}>{statusLabel(status)}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sports</Text>
      <Text style={styles.sub}>Request enrollment to join a sport (Admin must approve)</Text>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={sports}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => {
            const status = item.enrollment_status || "NOT_REQUESTED";
            const isBusy = submittingId === item.id;

            const canRequest = status === "NOT_REQUESTED" || status === "REJECTED";
            const showWhatsApp = status === "APPROVED" && !!item.whatsapp_link;

            return (
              <View style={styles.card}>
                <View style={styles.rowBetween}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <StatusChip status={status} />
                </View>

                {!!item.venue && <Text style={styles.cardText}>Venue: {item.venue}</Text>}
                {!!item.schedule_text && (
                  <Text style={styles.cardText}>Schedule: {item.schedule_text}</Text>
                )}
                {!!item.instructor_name && (
                  <Text style={styles.cardText}>Instructor: {item.instructor_name}</Text>
                )}
                {!!item.instructor_email && (
                  <Text style={styles.cardText}>Email: {item.instructor_email}</Text>
                )}

                {/* ✅ Request button */}
                <TouchableOpacity
                  style={[
                    styles.btn,
                    !canRequest && styles.btnDisabled,
                    isBusy && { opacity: 0.7 },
                  ]}
                  onPress={() => requestEnroll(item.id)}
                  disabled={!canRequest || isBusy}
                >
                  <Text style={styles.btnText}>
                    {isBusy
                      ? "Requesting..."
                      : status === "PENDING"
                      ? "Requested (Pending)"
                      : status === "APPROVED"
                      ? "Enrolled (Approved)"
                      : status === "REJECTED"
                      ? "Request Again"
                      : "Request Enroll"}
                  </Text>
                </TouchableOpacity>

                {/* ✅ WhatsApp link only after approval */}
                {showWhatsApp ? (
                  <TouchableOpacity
                    style={[styles.btn, styles.btnWhatsApp]}
                    onPress={() => openWhatsApp(item.whatsapp_link as string)}
                  >
                    <Text style={styles.btnText}>Open WhatsApp Group</Text>
                  </TouchableOpacity>
                ) : status === "APPROVED" && !item.whatsapp_link ? (
                  <Text style={styles.smallNote}>
                    WhatsApp link not added yet by Admin.
                  </Text>
                ) : null}
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={{ color: "#A7B0BE", textAlign: "center", marginTop: 30 }}>
              No sports available yet
            </Text>
          }
        />
      )}

      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0F14", padding: 20 },
  title: { color: "white", fontSize: 26, fontWeight: "900", textAlign: "center" },
  sub: { color: "#A7B0BE", textAlign: "center", marginTop: 6, marginBottom: 14 },

  card: {
    backgroundColor: "#121826",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#263041",
  },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTitle: { color: "white", fontSize: 18, fontWeight: "900", flex: 1, paddingRight: 10 },
  cardText: { color: "#A7B0BE", marginTop: 6 },

  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#1F2937",
  },
  chipApproved: { backgroundColor: "#1B4332" },
  chipPending: { backgroundColor: "#3B2F1A" },
  chipRejected: { backgroundColor: "#4A1C1C" },
  chipText: { color: "white", fontWeight: "800", fontSize: 12 },

  btn: {
    marginTop: 12,
    backgroundColor: "#D4AF37",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnDisabled: { backgroundColor: "#2C3442" },
  btnWhatsApp: { marginTop: 10 },

  btnText: { fontWeight: "900", color: "#111827" },
  smallNote: { color: "#A7B0BE", marginTop: 10, fontSize: 12 },

  backBtn: { alignSelf: "center", marginTop: 10 },
  backText: { color: "#A7B0BE", textDecorationLine: "underline" },
});
