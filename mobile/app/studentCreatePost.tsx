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

type VisibilityOption = "PUBLIC" | "ALL_USERS" | "ENROLLED" | "ONLY_ME";

const VISIBILITY_OPTIONS: {
  value: VisibilityOption;
  label: string;
  icon: any;
  desc: string;
  color: string;
  bg: string;
}[] = [
  {
    value: "PUBLIC",
    label: "Public",
    icon: "earth-outline",
    desc: "Everyone, including guests",
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
  },
  {
    value: "ALL_USERS",
    label: "All Users",
    icon: "people-outline",
    desc: "All logged-in students & admins",
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.12)",
  },
  {
    value: "ENROLLED",
    label: "Enrolled Only",
    icon: "shield-checkmark-outline",
    desc: "Only students enrolled in tagged sport",
    color: "#D4AF37",
    bg: "rgba(212,175,55,0.12)",
  },
  {
    value: "ONLY_ME",
    label: "Only Me",
    icon: "lock-closed-outline",
    desc: "Private draft — only you can see it",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.12)",
  },
];

const AVATAR_COLORS = ["#4F46E5", "#10B981", "#C9A227", "#EF4444", "#8B5CF6", "#3B82F6", "#F59E0B"];
function hashColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function StudentCreatePost() {
  const { theme, isDark } = useAppTheme();
  const [fullName, setFullName]           = useState("Student");
  const [avatarColor, setAvatarColor]     = useState("#4F46E5");
  const [content, setContent]             = useState("");
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [sports, setSports]               = useState<string[]>([]);
  const [visibility, setVisibility]       = useState<VisibilityOption>("ALL_USERS");
  const [submitting, setSubmitting]       = useState(false);

  useEffect(() => {
    (async () => {
      const { token, role, fullName: name } = await loadAuth();
      if (!token || role !== "STUDENT") { router.replace("/login"); return; }
      if (name) { setFullName(name); setAvatarColor(hashColor(name)); }
      try {
        const data = await apiGet<{ id: number; name: string }[]>("/api/student/sports", token);
        setSports(data.map((s) => s.name));
      } catch {
        setSports([]);
      }
    })();
  }, []);

  const initials = fullName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

  const handlePost = async () => {
    if (!content.trim()) { Alert.alert("Empty Post", "Please write something before posting."); return; }
    setSubmitting(true);
    try {
      const { token } = await loadAuth();
      await apiPost("/api/student/posts", {
        content: content.trim(),
        sportTag: selectedSport,
        visibility,
      }, token!);
      Alert.alert("Posted! 🎉", "Your post has been shared.", [
        { text: "OK", onPress: () => router.replace("/studentHome") },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to create post.");
    } finally { setSubmitting(false); }
  };

  const selectedVis = VISIBILITY_OPTIONS.find((v) => v.value === visibility)!;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bgCard} />

      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingTop: 48, paddingBottom: 14, backgroundColor: theme.bgCard, borderBottomWidth: 1, borderBottomColor: theme.border }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }} activeOpacity={0.7}>
          <Ionicons name="close" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: "900", flex: 1 }}>Create Post</Text>
        {/* Visibility badge in header */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: selectedVis.bg, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginRight: 10 }}>
          <Ionicons name={selectedVis.icon} size={13} color={selectedVis.color} />
          <Text style={{ color: selectedVis.color, fontSize: 12, fontWeight: "800" }}>{selectedVis.label}</Text>
        </View>
        <TouchableOpacity
          onPress={handlePost}
          disabled={submitting || !content.trim()}
          style={{ backgroundColor: content.trim() ? "#10B981" : theme.border, paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20 }}
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
            <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center", backgroundColor: avatarColor }}>
              <Text style={{ color: "white", fontSize: 15, fontWeight: "900" }}>{initials}</Text>
            </View>
            <View>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "900" }}>{fullName}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                <View style={{ backgroundColor: "#10B98122", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
                  <Text style={{ color: "#10B981", fontSize: 10, fontWeight: "700" }}>Student</Text>
                </View>
              </View>
            </View>
          </View>

          <TextInput
            placeholder="Share your achievement, training experience, or team update..."
            placeholderTextColor={theme.textSub + "99"}
            multiline
            value={content}
            onChangeText={setContent}
            style={{ color: theme.text, fontSize: 16, lineHeight: 24, paddingHorizontal: 16, minHeight: 160, textAlignVertical: "top" }}
            autoFocus
          />

          {/* ── Visibility Picker ── */}
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "800", marginBottom: 10, letterSpacing: 0.5 }}>
              WHO CAN SEE THIS POST?
            </Text>
            <View style={{ gap: 8 }}>
              {VISIBILITY_OPTIONS.map((opt) => {
                const active = visibility === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setVisibility(opt.value)}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 12,
                      padding: 13, borderRadius: 14, borderWidth: 1.5,
                      backgroundColor: active ? opt.bg : theme.bgInput,
                      borderColor: active ? opt.color : theme.border,
                    }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: opt.bg }}>
                      <Ionicons name={opt.icon} size={18} color={opt.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: active ? opt.color : theme.text, fontSize: 14, fontWeight: "800" }}>{opt.label}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "600", marginTop: 2 }}>{opt.desc}</Text>
                    </View>
                    {active && <Ionicons name="checkmark-circle" size={20} color={opt.color} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Sport tag */}
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "800", marginBottom: 10, letterSpacing: 0.5 }}>
              TAG A SPORT <Text style={{ color: theme.textMuted, fontWeight: "600" }}>(optional)</Text>
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: "row" }}>
              {sports.map((sport) => {
                const isSelected = selectedSport === sport;
                return (
                  <TouchableOpacity
                    key={sport}
                    onPress={() => setSelectedSport(isSelected ? null : sport)}
                    style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999, backgroundColor: isSelected ? "#10B98122" : theme.bgInput, borderWidth: 1, borderColor: isSelected ? "#10B981" : theme.border }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: isSelected ? "#10B981" : theme.textSub, fontSize: 13, fontWeight: isSelected ? "800" : "500" }}>{sport}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {visibility === "ENROLLED" && !selectedSport && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, backgroundColor: "rgba(212,175,55,0.1)", borderRadius: 10, padding: 10, borderWidth: 1, borderColor: "rgba(212,175,55,0.3)" }}>
                <Ionicons name="information-circle-outline" size={15} color="#D4AF37" />
                <Text style={{ color: "#D4AF37", fontSize: 12, fontWeight: "700", flex: 1 }}>
                  Tag a sport so only enrolled students can see this post.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
