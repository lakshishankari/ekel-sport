import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, Pressable, FlatList,
  ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPost } from "../lib/api";
import { loadAuth } from "../lib/authStore";
import { router } from "expo-router";
import Screen from "../components/Screen";
import { useAppTheme } from "../lib/themeStore";

type Notif = {
  id: number;
  title: string;
  message: string;
  type: "ENROLLMENT" | "SYSTEM";
  is_read: number;
  created_at: string;
};

export default function StudentNotifications() {
  const { theme } = useAppTheme();
  const [items, setItems] = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const { token, role } = await loadAuth();
      if (!token) { router.replace("/login"); return; }
      if (role !== "STUDENT") { router.replace("/"); return; }
      const data = await apiGet<Notif[]>("/api/student/notifications", token);
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load notifications");
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  const markRead = async (id: number) => {
    try {
      const { token } = await loadAuth();
      if (!token) return;
      await apiPost(`/api/student/notifications/${id}/read`, {}, token);
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to mark as read");
    }
  };

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <Screen>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "flex-start", paddingBottom: 12, gap: 12 }}>
        <Pressable onPress={() => router.back()} style={{ padding: 4, marginTop: 2 }} hitSlop={10}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 24, fontWeight: "900" }}>Notifications</Text>
          <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "600", marginTop: 2 }}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </Text>
        </View>
        <View style={{ position: "relative", padding: 8, marginTop: 2 }}>
          <Ionicons name="notifications-outline" size={22} color={theme.accent} />
          {unreadCount > 0 && (
            <View style={{ position: "absolute", top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 999, backgroundColor: "#EF4444", alignItems: "center", justifyContent: "center", paddingHorizontal: 4 }}>
              <Text style={{ color: "white", fontSize: 10, fontWeight: "900" }}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.textSub, marginTop: 12, fontSize: 14 }}>Loading notifications...</Text>
        </View>
      ) : error ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Ionicons name="wifi-outline" size={56} color="#EF4444" />
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", marginTop: 16, textAlign: "center" }}>Connection Error</Text>
          <Text style={{ color: theme.textSub, textAlign: "center", marginTop: 8, lineHeight: 20 }}>{error}</Text>
          <Pressable
            style={{ marginTop: 20, backgroundColor: theme.btnPrimary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 }}
            onPress={() => load()}
          >
            <Text style={{ color: theme.btnPrimaryText, fontWeight: "900", fontSize: 15 }}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          onRefresh={onRefresh}
          refreshing={refreshing}
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 4 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
              <Ionicons name="notifications-off-outline" size={56} color={theme.border} />
              <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", marginTop: 16 }}>No notifications yet</Text>
              <Text style={{ color: theme.textSub, fontSize: 13, marginTop: 6, fontWeight: "600" }}>Enrollment updates will appear here</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => !item.is_read && markRead(item.id)}
              style={[
                { flexDirection: "row", gap: 12, backgroundColor: theme.bgCard, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: theme.border },
                !item.is_read && { borderColor: theme.accent + "55", backgroundColor: theme.accent + "0A" },
              ]}
            >
              <View style={{ alignItems: "center", paddingTop: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: item.is_read ? theme.border : theme.accent }} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Text style={{ flex: 1, color: theme.text, fontSize: 15, fontWeight: "800" }} numberOfLines={1}>{item.title}</Text>
                  <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: item.type === "ENROLLMENT" ? theme.accent + "22" : "#3B82F622" }}>
                    <Text style={{ color: theme.textSub, fontSize: 10, fontWeight: "700" }}>{item.type}</Text>
                  </View>
                </View>
                <Text style={{ color: theme.textSub, fontSize: 13, lineHeight: 18, marginBottom: 8 }}>{item.message}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                  <Ionicons name="time-outline" size={12} color={theme.textMuted} />
                  <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "600", flex: 1 }}>
                    {new Date(item.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </Text>
                  {!item.is_read && <Text style={{ color: theme.accent, fontSize: 11, fontWeight: "700" }}>Tap to mark read</Text>}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}
