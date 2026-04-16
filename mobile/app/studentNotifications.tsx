import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  FlatList,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPost } from "../lib/api";
import { loadAuth } from "../lib/authStore";
import { router } from "expo-router";
import Screen from "../components/Screen";

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
      if (!token) { router.replace("/login"); return; }
      if (role !== "STUDENT") { router.replace("/"); return; }
      const data = await apiGet<Notif[]>("/api/student/notifications", token);
      setItems(data || []);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load notifications");
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
      Alert.alert("Error", e?.message || "Failed to mark as read");
    }
  };

  useEffect(() => { load(); }, []);

  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <Screen>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#F9FAFB" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSub}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
          </Text>
        </View>
        <View style={styles.bellWrap}>
          <Ionicons name="notifications-outline" size={22} color="#C9A227" />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#C9A227" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id)}
          onRefresh={load}
          refreshing={loading}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="notifications-off-outline" size={56} color="#374151" />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySub}>Enrollment updates will appear here</Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => !item.is_read && markRead(item.id)}
              style={[styles.card, !item.is_read && styles.cardUnread]}
            >
              {/* Left dot indicator */}
              <View style={styles.cardLeft}>
                <View style={[styles.dot, item.is_read ? styles.dotRead : styles.dotUnread]} />
              </View>

              {/* Content */}
              <View style={{ flex: 1 }}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  <View style={[styles.typeBadge, item.type === "ENROLLMENT" ? styles.badgeEnroll : styles.badgeSystem]}>
                    <Text style={styles.typeText}>{item.type}</Text>
                  </View>
                </View>
                <Text style={styles.cardMessage}>{item.message}</Text>
                <View style={styles.cardBottom}>
                  <Ionicons name="time-outline" size={12} color="#6B7280" />
                  <Text style={styles.cardDate}>
                    {new Date(item.created_at).toLocaleString("en-US", {
                      month: "short", day: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </Text>
                  {!item.is_read && (
                    <Text style={styles.tapHint}>Tap to mark read</Text>
                  )}
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: { padding: 4, marginTop: 2 },
  headerTitle: { color: "#F9FAFB", fontSize: 24, fontWeight: "900" },
  headerSub: { color: "rgba(229,231,235,0.6)", fontSize: 13, fontWeight: "600", marginTop: 2 },
  bellWrap: { position: "relative", padding: 8, marginTop: 2 },
  badge: {
    position: "absolute", top: 2, right: 2,
    minWidth: 16, height: 16, borderRadius: 999,
    backgroundColor: "#EF4444",
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "white", fontSize: 10, fontWeight: "900" },

  list: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 4 },

  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#121826",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1E2A3A",
  },
  cardUnread: {
    borderColor: "rgba(201,162,39,0.35)",
    backgroundColor: "rgba(18,24,38,0.95)",
  },
  cardLeft: { alignItems: "center", paddingTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 999 },
  dotUnread: { backgroundColor: "#C9A227" },
  dotRead: { backgroundColor: "#374151" },

  cardTop: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  cardTitle: { flex: 1, color: "#F9FAFB", fontSize: 15, fontWeight: "800" },
  typeBadge: {
    paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8,
  },
  badgeEnroll: { backgroundColor: "rgba(201,162,39,0.15)" },
  badgeSystem: { backgroundColor: "rgba(59,130,246,0.15)" },
  typeText: { color: "#A7B0BE", fontSize: 10, fontWeight: "700" },

  cardMessage: { color: "rgba(229,231,235,0.75)", fontSize: 13, lineHeight: 18, marginBottom: 8 },

  cardBottom: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardDate: { color: "#6B7280", fontSize: 11, fontWeight: "600", flex: 1 },
  tapHint: { color: "#C9A227", fontSize: 11, fontWeight: "700" },

  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60 },
  loadingText: { color: "#A7B0BE", marginTop: 12, fontSize: 14, fontWeight: "600" },
  emptyTitle: { color: "#F9FAFB", fontSize: 18, fontWeight: "900", marginTop: 16 },
  emptySub: { color: "#A7B0BE", fontSize: 13, marginTop: 6, fontWeight: "600" },
});

