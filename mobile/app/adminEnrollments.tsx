import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPost } from "../lib/api";
import { loadAuth } from "../lib/authStore";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../lib/themeStore";

type PendingEnrollment = {
  enrollment_id: number; status: "PENDING"; requested_at: string;
  sport_id: number; sport_name: string; student_user_id: number;
  student_id: string | null; full_name: string; email: string;
};

export default function AdminEnrollments() {
  const { theme } = useAppTheme();
  const [items, setItems] = useState<PendingEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actingId, setActingId] = useState<number | null>(null);

  const fetchPending = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const { token, role } = await loadAuth();
      if (!token) { router.replace("/login"); return; }
      if (role !== "ADMIN") { router.replace("/"); return; }
      const data = await apiGet<PendingEnrollment[]>("/api/admin/enrollments/pending", token);
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load pending enrollments");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);
  const onRefresh = useCallback(() => { setRefreshing(true); fetchPending(true); }, [fetchPending]);

  async function decide(enrollmentId: number, decision: "APPROVE" | "REJECT") {
    try {
      setActingId(enrollmentId);
      const { token } = await loadAuth();
      if (!token) return;
      await apiPost(`/api/admin/enrollments/${enrollmentId}/decision`, { decision }, token);
      Alert.alert("Done", `Request ${decision === "APPROVE" ? "approved ✅" : "rejected ❌"}`);
      await fetchPending(true);
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "Could not update request");
    } finally { setActingId(null); }
  }

  if (loading) {
    return (
      <Screen>
        <AppHeader title="Enrollments" subtitle="Approve or reject student requests" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <AppHeader title="Enrollments" subtitle="Approve or reject student requests" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Ionicons name="wifi-outline" size={56} color="#EF4444" />
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", marginTop: 16 }}>Connection Error</Text>
          <Text style={{ color: theme.textSub, textAlign: "center", marginTop: 8 }}>{error}</Text>
          <TouchableOpacity style={{ marginTop: 20, backgroundColor: theme.btnPrimary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 }} onPress={() => fetchPending()}>
            <Text style={{ color: theme.btnPrimaryText, fontWeight: "900", fontSize: 15 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="Enrollments" subtitle={`${items.length} pending request${items.length !== 1 ? "s" : ""}`} />
      <FlatList
        data={items}
        keyExtractor={(x) => String(x.enrollment_id)}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} />}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Ionicons name="checkmark-circle-outline" size={56} color={theme.accent} />
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", marginTop: 16 }}>All Clear! 🎉</Text>
            <Text style={{ color: theme.textSub, textAlign: "center", marginTop: 8 }}>No pending enrollment requests.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const busy = actingId === item.enrollment_id;
          return (
            <View style={{ backgroundColor: theme.bgCard, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: theme.accent + "22", alignItems: "center", justifyContent: "center" }}>
                    <Ionicons name="football-outline" size={20} color={theme.accent} />
                  </View>
                  <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900" }}>{item.sport_name}</Text>
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: "#F59E0B22" }}>
                  <Text style={{ color: "#F59E0B", fontSize: 11, fontWeight: "800" }}>PENDING</Text>
                </View>
              </View>

              <View style={{ gap: 4, paddingLeft: 4, marginBottom: 14 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="person-outline" size={14} color={theme.textMuted} />
                  <Text style={{ color: theme.textSub, fontSize: 13 }}>
                    {item.full_name}{item.student_id ? ` (${item.student_id})` : ""}
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="mail-outline" size={14} color={theme.textMuted} />
                  <Text style={{ color: theme.textSub, fontSize: 13 }}>{item.email}</Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity
                  style={[{ flex: 1, padding: 12, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6, backgroundColor: "#10B98122", borderWidth: 1, borderColor: "#10B98144" }, busy && { opacity: 0.6 }]}
                  onPress={() => decide(item.enrollment_id, "APPROVE")} disabled={busy}
                >
                  {busy ? <ActivityIndicator size="small" color="#10B981" /> : <Ionicons name="checkmark-circle-outline" size={16} color="#10B981" />}
                  <Text style={{ fontWeight: "900", color: "#10B981" }}>Approve</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[{ flex: 1, padding: 12, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 6, backgroundColor: "#EF444422", borderWidth: 1, borderColor: "#EF444444" }, busy && { opacity: 0.6 }]}
                  onPress={() => decide(item.enrollment_id, "REJECT")} disabled={busy}
                >
                  {busy ? <ActivityIndicator size="small" color="#EF4444" /> : <Ionicons name="close-circle-outline" size={16} color="#EF4444" />}
                  <Text style={{ fontWeight: "900", color: "#EF4444" }}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />
    </Screen>
  );
}
