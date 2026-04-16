import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert, ScrollView, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";
import { useAppTheme } from "../lib/themeStore";

type Announcement = { id: string; title: string; message: string; sport: string; createdAt: string };

export default function AdminAnnouncements() {
  const { theme } = useAppTheme();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sport, setSport] = useState("");
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([
    { id: "1", title: "Practice Session Tomorrow", message: "All cricket team members please attend", sport: "Cricket", createdAt: "2026-01-27" },
  ]);

  const handleCreate = async () => {
    if (!title.trim() || !message.trim()) { Alert.alert("Error", "Please fill in all fields"); return; }
    setLoading(true);
    setTimeout(() => {
      setAnnouncements([{ id: Date.now().toString(), title: title.trim(), message: message.trim(), sport: sport.trim() || "All Sports", createdAt: new Date().toISOString().split("T")[0] }, ...announcements]);
      setTitle(""); setMessage(""); setSport(""); setShowForm(false); setLoading(false);
      Alert.alert("Success", "Announcement created");
    }, 800);
  };

  const inputStyle = { marginTop: 6, height: 48, borderRadius: 14, paddingHorizontal: 12, color: theme.text, fontWeight: "600" as const, backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border };

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false}>
        <AppHeader
          title="Announcements"
          subtitle="Manage notifications"
          rightSlot={
            <Pressable
              style={{ padding: 8, backgroundColor: theme.accent + "18", borderRadius: 10, borderWidth: 1, borderColor: theme.accent + "33" }}
              onPress={() => setShowForm(!showForm)}
            >
              <Ionicons name={showForm ? "close" : "add-circle"} size={22} color={theme.accent} />
            </Pressable>
          }
        />

        {showForm && (
          <AppCard style={{ marginTop: 14 }}>
            <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", marginBottom: 8 }}>New Announcement</Text>

            <Text style={{ marginTop: 12, color: theme.textSub, fontSize: 13, fontWeight: "800" }}>Title</Text>
            <TextInput value={title} onChangeText={setTitle} style={inputStyle as any} placeholder="e.g., Practice Cancelled" placeholderTextColor={theme.textMuted} />

            <Text style={{ marginTop: 12, color: theme.textSub, fontSize: 13, fontWeight: "800" }}>Message</Text>
            <TextInput value={message} onChangeText={setMessage} style={[inputStyle as any, { height: 100, paddingTop: 12, textAlignVertical: "top" }]} placeholder="Enter announcement details..." placeholderTextColor={theme.textMuted} multiline numberOfLines={4} />

            <Text style={{ marginTop: 12, color: theme.textSub, fontSize: 13, fontWeight: "800" }}>Sport (Optional)</Text>
            <TextInput value={sport} onChangeText={setSport} style={inputStyle as any} placeholder="Leave blank for all sports" placeholderTextColor={theme.textMuted} />

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
          <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800", marginBottom: 4 }}>Recent Announcements</Text>
          {announcements.map((item) => (
            <AppCard key={item.id} style={{ marginTop: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <Text style={{ flex: 1, color: theme.text, fontSize: 16, fontWeight: "800" }}>{item.title}</Text>
                <View style={{ backgroundColor: theme.accent + "22", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ color: theme.accent, fontSize: 12, fontWeight: "700" }}>{item.sport}</Text>
                </View>
              </View>
              <Text style={{ color: theme.textSub, fontSize: 14, lineHeight: 20, marginBottom: 8 }}>{item.message}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="calendar-outline" size={12} color={theme.textMuted} />
                <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: "600" }}>{item.createdAt}</Text>
              </View>
            </AppCard>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </Screen>
  );
}
