import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StatusBar,
  Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import { apiGet, apiPost } from "../lib/api";
import { useAppTheme } from "../lib/themeStore";

export default function AdminCreatePost() {
  const { theme, isDark } = useAppTheme();
  const [userName, setUserName]           = useState("Admin");
  const [content, setContent]             = useState("");
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [sports, setSports]               = useState<string[]>([]);
  const [submitting, setSubmitting]       = useState(false);

  useEffect(() => {
    (async () => {
      const { token, role, fullName } = await loadAuth();
      if (!token || role !== "ADMIN") { router.replace("/login"); return; }
      if (fullName) setUserName(fullName);
      try {
        const data = await apiGet<{ id: number; name: string }[]>("/api/admin/sports", token);
        setSports(data.map((s) => s.name));
      } catch {
        setSports([]);
      }
    })();
  }, []);

  const adminInitials = userName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

  const handlePost = async () => {
    if (!content.trim()) { Alert.alert("Empty Post", "Please write something before posting."); return; }
    setSubmitting(true);
    try {
      const { token } = await loadAuth();
      await apiPost("/api/admin/posts", { content: content.trim(), sportTag: selectedSport }, token!);
      Alert.alert("Posted! 🎉", "Your post has been shared to the feed.", [
        { text: "OK", onPress: () => router.replace("/adminHome") },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to create post.");
    } finally { setSubmitting(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bgCard} />

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 48, paddingBottom: 14, backgroundColor: theme.bgCard, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }} activeOpacity={0.7}>
          <Ionicons name="close" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", flex: 1 }}>Create Post</Text>
        <TouchableOpacity
          onPress={handlePost}
          disabled={submitting || !content.trim()}
          style={{ backgroundColor: content.trim() ? theme.accent : theme.border, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20 }}
          activeOpacity={0.8}
        >
          {submitting ? <ActivityIndicator size="small" color="white" /> : (
            <Text style={{ color: "white", fontWeight: "900", fontSize: 14 }}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
          {/* Author row */}
          <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 12 }}>
            <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: theme.accent }}>
              <Text style={{ color: "white", fontSize: 15, fontWeight: "900" }}>{adminInitials}</Text>
            </View>
            <View>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>{userName}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                <View style={{ backgroundColor: theme.accent + "22", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
                  <Text style={{ color: theme.accent, fontSize: 10, fontWeight: "700" }}>Coach / Admin</Text>
                </View>
              </View>
            </View>
          </View>

          <TextInput
            placeholder="Share an update, training note, or match result with your students..."
            placeholderTextColor={theme.textSub + "99"}
            multiline
            value={content}
            onChangeText={setContent}
            style={{ color: theme.text, fontSize: 16, lineHeight: 24, paddingHorizontal: 16, minHeight: 160, textAlignVertical: "top" }}
            autoFocus
          />

          {/* Sport tag selector */}
          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "700", marginBottom: 10 }}>Tag a Sport (optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: "row" }}>
              {sports.map((sport) => {
                const isSelected = selectedSport === sport;
                return (
                  <TouchableOpacity
                    key={sport}
                    onPress={() => setSelectedSport(isSelected ? null : sport)}
                    style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: isSelected ? theme.accent + "22" : theme.bgInput, borderWidth: 1, borderColor: isSelected ? theme.accent : theme.border }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: isSelected ? theme.accent : theme.textSub, fontSize: 13, fontWeight: isSelected ? "800" : "500" }}>{sport}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
