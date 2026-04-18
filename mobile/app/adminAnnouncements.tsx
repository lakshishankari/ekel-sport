import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, Pressable, Alert, ScrollView, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";
import { useAppTheme } from "../lib/themeStore";
import { apiGet, apiPost } from "../lib/api";
import { loadAuth } from "../lib/authStore";

type Announcement = {
  id: number; admin_name: string; title: string; message: string;
  sport_tag: string | null; created_at: string;
};

export default function AdminAnnouncements() {
  const { theme } = useAppTheme();
  const [showForm, setShowForm]           = useState(false);
  const [title, setTitle]                 = useState("");
  const [message, setMessage]             = useState("");
  const [sport, setSport]                 = useState("");
  const [loading, setLoading]             = useState(false);
  const [refreshing, setRefreshing]       = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [fetching, setFetching]           = useState(true);
  const [sports, setSports]               = useState<string[]>([]);

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setFetching(true);
      const { token } = await loadAuth();
      if (!token) return;
      const [ann, sp] = await Promise.all([
        apiGet<Announcement[]>("/api/admin/announcements", token),
        apiGet<{ id: number; name: string }[]>("/api/admin/sports", token),
      ]);
      setAnnouncements(Array.isArray(ann) ? ann : []);
      setSports(sp.map((s) => s.name));
    } catch { /* silent */ }
    finally { setFetching(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(true); };

  const handleCreate = async () => {
    if (!title.trim() || !message.trim()) { Alert.alert("Error", "Title and message are required"); return; }
    setLoading(true);
    try {
      const { token } = await loadAuth();
      const res = await apiPost<{ ok: boolean; notified: number }>(
        "/api/admin/announcements",
        { title: title.trim(), message: message.trim(), sportTag: sport.trim() || null },
        token!
      );
      Alert.alert("Sent ✅", `Announcement sent to ${res.notified} student${res.notified !== 1 ? "s" : ""}.`);
      setTitle(""); setMessage(""); setSport(""); setShowForm(false);
      fetchData(true);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to send announcement");
    } finally { setLoading(false); }
  };

  const inputStyle = { marginTop: 6, minHeight: 48, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 12, color: theme.text, fontWeight: "600" as const, backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border };

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.accent} colors={[theme.accent]} />}
      >
        <AppHeader
          title="Announcements"
          subtitle="Send targeted messages to students"
          showBack
          rightSlot={
            <Pressable
              style={{ padding: 8, backgroundColor: theme.accent + "18", borderRadius: 10, borderWidth: 1, borderColor: theme.accent + "33" }}
              onPress={() => setShowForm(!showForm)}
            >
              <Ionicons name={showForm ? "close" : "add-circle"} size={22} color={theme.accent} />
            </Pressable>
          }
        />

        {/* Info banner */}
        <AppCard style={{ marginTop: 4, marginBottom: 0 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
            <Ionicons name="information-circle-outline" size={18} color={theme.accent} />
            <Text style={{ flex: 1, color: theme.textSub, fontSize: 12, fontWeight: "600", lineHeight: 17 }}>
              Announcements are sent directly to student notifications — separate from social feed posts.
              Target all students or a specific sport.
            </Text>
          </View>
        </AppCard>

        {showForm && (
          <AppCard style={{ marginTop: 14 }}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", marginBottom: 8 }}>New Announcement</Text>

            <Text style={{ marginTop: 12, color: theme.textSub, fontSize: 13, fontWeight: "800" }}>Title *</Text>
            <TextInput value={title} onChangeText={setTitle} style={inputStyle as any} placeholder="e.g., Practice Cancelled Tomorrow" placeholderTextColor={theme.textMuted} />

            <Text style={{ marginTop: 12, color: theme.textSub, fontSize: 13, fontWeight: "800" }}>Message *</Text>
            <TextInput value={message} onChangeText={setMessage} style={[inputStyle as any, { height: 100, textAlignVertical: "top" }]} placeholder="Enter announcement details..." placeholderTextColor={theme.textMuted} multiline numberOfLines={4} />

            <Text style={{ marginTop: 12, color: theme.textSub, fontSize: 13, fontWeight: "800" }}>Target Sport (optional)</Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {["All Sports", ...sports].map((s) => {
                const val = s === "All Sports" ? "" : s;
                const isSelected = sport === val;
                return (
                  <Pressable key={s} onPress={() => setSport(val)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: isSelected ? theme.accent + "22" : theme.bgInput, borderWidth: 1, borderColor: isSelected ? theme.accent : theme.border }}>
                    <Text style={{ color: isSelected ? theme.accent : theme.textSub, fontSize: 12, fontWeight: "700" }}>{s}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={({ pressed }) => [{ marginTop: 20, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: theme.btnPrimary, flexDirection: "row", gap: 8 }, pressed && { opacity: 0.88 }, loading && { opacity: 0.6 }]}
              onPress={handleCreate} disabled={loading}
            >
              {loading ? <ActivityIndicator color={theme.btnPrimaryText} /> : (
                <>
                  <Ionicons name="send" size={18} color={theme.btnPrimaryText} />
                  <Text style={{ color: theme.btnPrimaryText, fontSize: 16, fontWeight: "900" }}>Send Announcement</Text>
                </>
              )}
            </Pressable>
          </AppCard>
        )}

        <View style={{ marginTop: 20 }}>
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800", marginBottom: 4, paddingHorizontal: 4 }}>
            Recent Announcements
          </Text>
          {fetching && !refreshing ? (
            <View style={{ alignItems: "center", paddingVertical: 32 }}>
              <ActivityIndicator color={theme.accent} />
            </View>
          ) : announcements.length === 0 ? (
            <AppCard style={{ marginTop: 12, alignItems: "center", paddingVertical: 32 }}>
              <Ionicons name="megaphone-outline" size={40} color={theme.textSub} />
              <Text style={{ color: theme.textSub, marginTop: 12, fontWeight: "700" }}>No announcements yet</Text>
            </AppCard>
          ) : (
            announcements.map((item) => (
              <AppCard key={item.id} style={{ marginTop: 12 }}>
                <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: "800" }}>{item.title}</Text>
                  {item.sport_tag && (
                    <View style={{ backgroundColor: theme.accent + "22", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                      <Text style={{ color: theme.accent, fontSize: 12, fontWeight: "700" }}>{item.sport_tag}</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: theme.textSub, fontSize: 14, lineHeight: 20, marginBottom: 8 }}>{item.message}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Ionicons name="person-outline" size={12} color={theme.textMuted} />
                  <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: "600" }}>{item.admin_name}</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12 }}>·</Text>
                  <Ionicons name="calendar-outline" size={12} color={theme.textMuted} />
                  <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: "600" }}>
                    {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </Text>
                </View>
              </AppCard>
            ))
          )}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </Screen>
  );
}
