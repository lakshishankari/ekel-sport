import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Linking, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiGet } from "../lib/api";
import { loadAuth } from "../lib/authStore";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../lib/themeStore";

type MySport = {
  id: number;
  name: string;
  venue: string | null;
  schedule_text: string | null;
  instructor_name: string | null;
  instructor_email: string | null;
  whatsapp_link: string | null;
  status: "APPROVED";
};

const SPORT_COLORS = ["#C9A227", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B"];

export default function MySports() {
  const { theme } = useAppTheme();
  const [items, setItems] = useState<MySport[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMySports = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setError(null);
      const { token, role } = await loadAuth();
      if (!token) { router.replace("/login"); return; }
      if (role !== "STUDENT") { router.replace("/"); return; }
      const data = await apiGet<MySport[]>("/api/student/my-sports", token);
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load your sports");
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchMySports(); }, [fetchMySports]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchMySports(true);
  }, [fetchMySports]);

  async function openLink(url: string) {
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) { Alert.alert("Cannot open", "Link not supported on this device."); return; }
      await Linking.openURL(url);
    } catch { Alert.alert("Error", "Failed to open link"); }
  }

  if (loading) {
    return (
      <Screen>
        <AppHeader title="My Sports" subtitle="Your approved sports" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.textSub, marginTop: 12, fontSize: 14 }}>Loading your sports...</Text>
        </View>
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <AppHeader title="My Sports" subtitle="Your approved sports" />
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
            onPress={() => fetchMySports()}
          >
            <Text style={{ color: theme.btnPrimaryText, fontWeight: "900", fontSize: 15 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader title="My Sports" subtitle="Your approved sports" />

      <FlatList
        data={items}
        keyExtractor={(x) => String(x.id)}
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
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.bgInput, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Ionicons name="medal-outline" size={38} color={theme.textMuted} />
            </View>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>No Approved Sports</Text>
            <Text style={{ color: theme.textSub, textAlign: "center", marginTop: 8, lineHeight: 20 }}>
              Once an admin approves your enrollment request, your sports will appear here.
            </Text>
            <TouchableOpacity
              style={{ marginTop: 18, backgroundColor: theme.btnPrimary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
              onPress={() => router.push("/studentSports")}
            >
              <Text style={{ color: theme.btnPrimaryText, fontWeight: "900" }}>Browse & Enroll →</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item, index }) => {
          const accent = SPORT_COLORS[index % SPORT_COLORS.length];
          return (
            <View style={{ backgroundColor: theme.bgCard, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: theme.border }}>
              {/* Sport name row */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: accent + "22", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="basketball-outline" size={22} color={accent} />
                </View>
                <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", flex: 1 }}>{item.name}</Text>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: "#10B98122" }}>
                  <Text style={{ color: "#10B981", fontSize: 11, fontWeight: "800" }}>APPROVED</Text>
                </View>
              </View>

              {/* Details */}
              {!!item.venue && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Ionicons name="location-outline" size={14} color={theme.textMuted} />
                  <Text style={{ color: theme.textSub, fontSize: 13 }}>{item.venue}</Text>
                </View>
              )}
              {!!item.schedule_text && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Ionicons name="calendar-outline" size={14} color={theme.textMuted} />
                  <Text style={{ color: theme.textSub, fontSize: 13 }}>{item.schedule_text}</Text>
                </View>
              )}
              {!!item.instructor_name && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Ionicons name="person-outline" size={14} color={theme.textMuted} />
                  <Text style={{ color: theme.textSub, fontSize: 13 }}>{item.instructor_name}</Text>
                </View>
              )}
              {!!item.instructor_email && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <Ionicons name="mail-outline" size={14} color={theme.textMuted} />
                  <Text style={{ color: theme.textSub, fontSize: 13 }}>{item.instructor_email}</Text>
                </View>
              )}

              {/* WhatsApp button */}
              {item.whatsapp_link ? (
                <TouchableOpacity
                  style={{ marginTop: 12, backgroundColor: "#25D366", padding: 12, borderRadius: 12, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 }}
                  onPress={() => openLink(item.whatsapp_link as string)}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="white" />
                  <Text style={{ fontWeight: "900", color: "white", fontSize: 14 }}>Open WhatsApp Group</Text>
                </TouchableOpacity>
              ) : (
                <Text style={{ color: theme.textMuted, marginTop: 10, fontSize: 12 }}>
                  WhatsApp link not added yet.
                </Text>
              )}
            </View>
          );
        }}
      />
    </Screen>
  );
}
