import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, Alert, TouchableOpacity, RefreshControl } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiGet } from "../lib/api";
import { loadAuth } from "../lib/authStore";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../lib/themeStore";

type User = { id: number; role: string; student_id: string | null; full_name: string; email: string };

const ROLE_CONFIG: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  STUDENT:  { color: "#3B82F6", icon: "person-outline" },
  ADMIN:    { color: "#C9A227", icon: "shield-outline" },
  ADVISORY: { color: "#10B981", icon: "ribbon-outline" },
};

export default function AdminUsers() {
  const { theme } = useAppTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const { token } = await loadAuth();
      if (!token) { router.replace("/login"); return; }
      const data = await apiGet<User[]>("/api/admin/users", token);
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || "Failed to load users");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const onRefresh = useCallback(() => { setRefreshing(true); loadUsers(true); }, [loadUsers]);

  if (loading) {
    return (
      <Screen>
      <AppHeader title={`${users.length} registered accounts`} subtitle="Registered accounts" backRoute="/adminHome" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
      <AppHeader title={`${users.length} registered accounts`} subtitle="Registered accounts" backRoute="/adminHome" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Ionicons name="wifi-outline" size={56} color="#EF4444" />
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", marginTop: 16 }}>Connection Error</Text>
          <Text style={{ color: theme.textSub, textAlign: "center", marginTop: 8 }}>{error}</Text>
          <TouchableOpacity style={{ marginTop: 20, backgroundColor: theme.btnPrimary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 }} onPress={() => loadUsers()}>
            <Text style={{ color: theme.btnPrimaryText, fontWeight: "900", fontSize: 15 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="All Users" subtitle={`${users.length} registered accounts`} backRoute="/adminHome" />
      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} />}
        ListEmptyComponent={
          <View style={{ alignItems: "center", paddingTop: 60 }}>
            <Ionicons name="people-outline" size={56} color={theme.border} />
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", marginTop: 16 }}>No Users Found</Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = ROLE_CONFIG[item.role] || { color: theme.textSub, icon: "person-outline" as const };
          return (
            <View style={{ backgroundColor: theme.bgCard, borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: theme.border, flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: cfg.color + "22", alignItems: "center", justifyContent: "center" }}>
                <Ionicons name={cfg.icon} size={22} color={cfg.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800" }}>{item.full_name}</Text>
                <Text style={{ color: theme.textSub, marginTop: 3, fontSize: 13 }}>{item.email}</Text>
                {item.student_id && <Text style={{ color: theme.textMuted, marginTop: 2, fontSize: 12 }}>ID: {item.student_id}</Text>}
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: cfg.color + "22" }}>
                <Text style={{ color: cfg.color, fontWeight: "800", fontSize: 11 }}>{item.role}</Text>
              </View>
            </View>
          );
        }}
      />
    </Screen>
  );
}
