import React, { useEffect, useState } from "react";
import { View, Text, Pressable, FlatList, ActivityIndicator, Alert } from "react-native";
import { apiGet, apiPost } from "../lib/api";
import { loadAuth } from "../lib/authStore";
import { router } from "expo-router";

type Notif = {
  id: number;
  title: string;
  message: string;
  type: "ENROLLMENT" | "SYSTEM";
  is_read: number; // 0 or 1
  created_at: string;
};

export default function StudentNotifications() {
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { token, role } = await loadAuth();

      console.log("DEBUG token exists?", !!token, "role:", role);

      if (!token) {
        Alert.alert("Session expired", "Please log in again.");
        router.replace("/login");
        return;
      }
      if (role !== "STUDENT") {
        router.replace("/");
        return;
      }

      const data = await apiGet<Notif[]>("/api/student/notifications", token);
      setItems(data || []);
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.log("NOTIFICATIONS LOAD ERROR:", msg);
      Alert.alert("Notifications error", msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: number) => {
    try {
      const { token } = await loadAuth();
      if (!token) return;

      await apiPost(`/api/student/notifications/${id}/read`, {}, token);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
    } catch (e: any) {
      const msg = e?.message || String(e);
      console.log("MARK READ ERROR:", msg);
      Alert.alert("Mark as read failed", msg);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 10 }}>Loading notifications...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 22, fontWeight: "700", marginBottom: 12 }}>
        Notifications
      </Text>

      <FlatList
        data={items}
        keyExtractor={(i) => String(i.id)}
        onRefresh={load}
        refreshing={loading}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => markRead(item.id)}
            style={{
              padding: 14,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              backgroundColor: item.is_read ? "#fff" : "#f3f4f6",
            }}
          >
            <Text style={{ fontWeight: "700", fontSize: 16 }}>{item.title}</Text>
            <Text style={{ marginTop: 6 }}>{item.message}</Text>
            <Text style={{ marginTop: 8, color: "#6b7280", fontSize: 12 }}>
              {new Date(item.created_at).toLocaleString()}
            </Text>
            {!item.is_read ? (
              <Text style={{ marginTop: 6, fontSize: 12, color: "#6b7280" }}>
                Tap to mark as read
              </Text>
            ) : null}
          </Pressable>
        )}
        ListEmptyComponent={
          <Text style={{ color: "#6b7280", marginTop: 24 }}>
            No notifications yet.
          </Text>
        }
      />
    </View>
  );
}
