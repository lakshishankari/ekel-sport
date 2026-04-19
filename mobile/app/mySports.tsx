import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Linking, RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiGet } from "../lib/api";
import { loadAuth } from "../lib/authStore";
import StudentScreen from "../components/StudentScreen";
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
  decided_at: string | null;
};

const SPORT_COLORS = ["#C9A227", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#F59E0B"];

/** Navigate to the schedule detail screen, passing all sport data as params */
function openSchedule(item: MySport) {
  router.push({
    pathname: "/sportSchedule",
    params: {
      id:                String(item.id),
      name:              item.name,
      venue:             item.venue             ?? "",
      schedule_text:     item.schedule_text     ?? "",
      instructor_name:   item.instructor_name   ?? "",
      instructor_email:  item.instructor_email  ?? "",
      whatsapp_link:     item.whatsapp_link     ?? "",
      decided_at:        item.decided_at        ?? "",
    },
  });
}

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

  async function openWhatsAppDirect(url: string) {
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) { Alert.alert("Cannot open", "Link not supported on this device."); return; }
      await Linking.openURL(url);
    } catch { Alert.alert("Error", "Failed to open link"); }
  }

  if (loading) {
    return (
      <StudentScreen activeRoute="/mySports">
        <AppHeader title="My Sports" subtitle="Your approved sports" showBack={false} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={{ color: theme.textSub, marginTop: 12, fontSize: 14 }}>Loading your sports...</Text>
        </View>
      </StudentScreen>
    );
  }

  if (error) {
    return (
      <StudentScreen activeRoute="/mySports">
        <AppHeader title="My Sports" subtitle="Your approved sports" showBack={false} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 }}>
          <Ionicons name="wifi-outline" size={56} color="#EF4444" />
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", marginTop: 16, textAlign: "center" }}>Connection Error</Text>
          <Text style={{ color: theme.textSub, textAlign: "center", marginTop: 8, lineHeight: 20 }}>{error}</Text>
          <TouchableOpacity
            style={{ marginTop: 20, backgroundColor: theme.btnPrimary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 }}
            onPress={() => fetchMySports()}
          >
            <Text style={{ color: theme.btnPrimaryText, fontWeight: "900", fontSize: 15 }}>Retry</Text>
          </TouchableOpacity>
        </View>
      </StudentScreen>
    );
  }

  return (
    <StudentScreen activeRoute="/mySports">
      <AppHeader title="My Sports" subtitle={`${items.length} approved sport${items.length !== 1 ? "s" : ""}`} showBack={false} />

      <FlatList
        data={items}
        keyExtractor={(x) => String(x.id)}
        contentContainerStyle={{ paddingBottom: 28 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} />
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
            /* ── Tap anywhere on card to view schedule ── */
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => openSchedule(item)}
              style={{
                backgroundColor: theme.bgCard, borderRadius: 18, padding: 16,
                marginBottom: 14, borderWidth: 1, borderColor: theme.border,
              }}
            >
              {/* Sport name row */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <View style={{ width: 46, height: 46, borderRadius: 14, backgroundColor: accent + "22", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name="basketball-outline" size={24} color={accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900" }}>{item.name}</Text>
                  {item.schedule_text ? (
                    <Text style={{ color: theme.textSub, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                      🕐 {item.schedule_text}
                    </Text>
                  ) : (
                    <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2, fontStyle: "italic" }}>
                      Schedule not set
                    </Text>
                  )}
                </View>
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: "#10B98122" }}>
                  <Text style={{ color: "#10B981", fontSize: 11, fontWeight: "800" }}>APPROVED</Text>
                </View>
              </View>

              {/* Quick info pills */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                {item.venue ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: theme.bgInput, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                    <Ionicons name="location-outline" size={13} color={theme.textMuted} />
                    <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "600" }}>{item.venue}</Text>
                  </View>
                ) : null}
                {item.instructor_name ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: theme.bgInput, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                    <Ionicons name="person-outline" size={13} color={theme.textMuted} />
                    <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "600" }}>{item.instructor_name}</Text>
                  </View>
                ) : null}
              </View>

              {/* "View Schedule" tap hint + WhatsApp */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 6, borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10 }}>
                  <Ionicons name="calendar-outline" size={14} color={accent} />
                  <Text style={{ color: accent, fontWeight: "800", fontSize: 13 }}>View Full Schedule</Text>
                  <Ionicons name="chevron-forward" size={14} color={accent} />
                </View>

                {item.whatsapp_link ? (
                  <TouchableOpacity
                    style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#25D36622", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "#25D36644" }}
                    onPress={(e) => { e.stopPropagation?.(); openWhatsAppDirect(item.whatsapp_link as string); }}
                  >
                    <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                    <Text style={{ color: "#25D366", fontWeight: "800", fontSize: 12 }}>WhatsApp</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </StudentScreen>
  );
}
