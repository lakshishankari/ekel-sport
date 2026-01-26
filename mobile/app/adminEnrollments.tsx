import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { apiGet, apiPost } from "../lib/api";
import { loadAuth } from "../lib/authStore";

type PendingEnrollment = {
  enrollment_id: number;
  status: "PENDING";
  requested_at: string;
  sport_id: number;
  sport_name: string;
  student_user_id: number;
  student_id: string | null;
  full_name: string;
  email: string;
};

export default function AdminEnrollments() {
  const [items, setItems] = useState<PendingEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<number | null>(null);

  async function fetchPending() {
    try {
      setLoading(true);
      const { token, role } = await loadAuth();
      if (!token) return router.replace("/login");
      if (role !== "ADMIN") return router.replace("/");

      const data = await apiGet<PendingEnrollment[]>("/api/admin/enrollments/pending", token);
      setItems(data);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load pending enrollments");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPending();
  }, []);

  async function decide(enrollmentId: number, decision: "APPROVE" | "REJECT") {
    try {
      setActingId(enrollmentId);
      const { token } = await loadAuth();
      if (!token) return router.replace("/login");

      await apiPost(
        `/api/admin/enrollments/${enrollmentId}/decision`,
        { decision },
        token
      );

      Alert.alert("Done", `Request ${decision === "APPROVE" ? "approved" : "rejected"}`);
      await fetchPending();
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "Could not update request");
    } finally {
      setActingId(null);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Enrollment Requests</Text>
      <Text style={styles.sub}>Approve or reject student sport enrollments</Text>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(x) => String(x.enrollment_id)}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => {
            const busy = actingId === item.enrollment_id;

            return (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{item.sport_name}</Text>
                <Text style={styles.cardText}>
                  Student: {item.full_name} {item.student_id ? `(${item.student_id})` : ""}
                </Text>
                <Text style={styles.cardText}>Email: {item.email}</Text>
                <Text style={styles.cardText}>Status: {item.status}</Text>

                <View style={styles.row}>
                  <TouchableOpacity
                    style={[styles.btn, styles.approveBtn, busy && { opacity: 0.7 }]}
                    onPress={() => decide(item.enrollment_id, "APPROVE")}
                    disabled={busy}
                  >
                    <Text style={styles.btnText}>Approve</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.btn, styles.rejectBtn, busy && { opacity: 0.7 }]}
                    onPress={() => decide(item.enrollment_id, "REJECT")}
                    disabled={busy}
                  >
                    <Text style={styles.btnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <Text style={{ color: "#A7B0BE", textAlign: "center", marginTop: 30 }}>
              No pending requests 🎉
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
  cardTitle: { color: "white", fontSize: 18, fontWeight: "900" },
  cardText: { color: "#A7B0BE", marginTop: 6 },

  row: { flexDirection: "row", gap: 10, marginTop: 12 },
  btn: { flex: 1, padding: 12, borderRadius: 12, alignItems: "center" },
  approveBtn: { backgroundColor: "#D4AF37" },
  rejectBtn: { backgroundColor: "#2C3442" },
  btnText: { fontWeight: "900", color: "#111827" },

  backBtn: { alignSelf: "center", marginTop: 10 },
  backText: { color: "#A7B0BE", textDecorationLine: "underline" },
});
