import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, StatusBar,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import { apiGet, apiPut } from "../lib/api";
import { useAppTheme } from "../lib/themeStore";

const AVATAR_COLORS = ["#4F46E5", "#10B981", "#C9A227", "#EF4444", "#8B5CF6", "#3B82F6", "#F59E0B"];
function hashColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type ProfileData = {
  full_name: string; email: string; student_id: string | null; role: string;
  department: string; yearOfStudy: string; bio: string; avatarColor: string;
};

export default function StudentProfile() {
  const { theme, isDark } = useAppTheme();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [editing, setEditing]   = useState(false);
  const [profile, setProfile]   = useState<ProfileData>({
    full_name: "Student", email: "", student_id: null, role: "STUDENT",
    department: "", yearOfStudy: "", bio: "", avatarColor: "#4F46E5",
  });
  const [editDept, setEditDept] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editBio, setEditBio]   = useState("");

  const load = useCallback(async () => {
    try {
      const auth = await loadAuth();
      if (!auth.token || auth.role !== "STUDENT") { router.replace("/login"); return; }
      const data = await apiGet<ProfileData>("/api/student/profile", auth.token);
      setProfile({ ...data, avatarColor: hashColor(data.full_name) });
    } catch { /* fall back to auth cache */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit() { setEditDept(profile.department); setEditYear(profile.yearOfStudy); setEditBio(profile.bio); setEditing(true); }

  async function saveEdit() {
    try {
      setSaving(true);
      const { token } = await loadAuth();
      await apiPut("/api/student/profile", {
        department: editDept.trim(),
        yearOfStudy: editYear.trim(),
        bio: editBio.trim(),
        avatarColor: profile.avatarColor,
      }, token!);
      setProfile((p) => ({ ...p, department: editDept.trim(), yearOfStudy: editYear.trim(), bio: editBio.trim() }));
      setEditing(false);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not save profile.");
    } finally { setSaving(false); }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  const initials = profile.full_name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  const inputStyle = { backgroundColor: theme.bgInput, borderRadius: 12, borderWidth: 1, borderColor: theme.border, color: theme.text, fontSize: 15, fontWeight: "600" as const, paddingHorizontal: 14, paddingVertical: 12 };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

      {/* Top bar */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: "800" }}>Profile</Text>
        {!editing ? (
          <TouchableOpacity onPress={startEdit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="pencil-outline" size={22} color={theme.accent} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setEditing(false)}>
            <Text style={{ color: theme.textSub, fontWeight: "700", fontSize: 15 }}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {/* Avatar + Name */}
        <View style={{ alignItems: "center", paddingTop: 20, paddingBottom: 24 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: profile.avatarColor, alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <Text style={{ color: "white", fontWeight: "900", fontSize: 34 }}>{initials || "?"}</Text>
          </View>

          <Text style={{ color: theme.text, fontSize: 24, fontWeight: "900", letterSpacing: 0.3 }}>{profile.full_name}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "600", marginTop: 4 }}>{profile.email}</Text>

          {profile.student_id && (
            <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "600", marginTop: 4 }}>{profile.student_id}</Text>
          )}

          {profile.department ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10, backgroundColor: theme.accent + "18", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 }}>
              <Ionicons name="school-outline" size={13} color={theme.accent} />
              <Text style={{ color: theme.accent, fontSize: 12, fontWeight: "800" }}>{profile.department}</Text>
            </View>
          ) : null}

          {profile.yearOfStudy ? (
            <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "600", marginTop: 6 }}>{profile.yearOfStudy}</Text>
          ) : null}
        </View>

        {/* Bio */}
        {!editing && (
          <View style={{ paddingHorizontal: 28, paddingBottom: 20 }}>
            {profile.bio ? (
              <Text style={{ color: theme.textSub, fontSize: 14, lineHeight: 22, textAlign: "center" }}>{profile.bio}</Text>
            ) : (
              <Text style={{ color: theme.textMuted, fontSize: 13, fontStyle: "italic", textAlign: "center" }}>Tap the pencil to add your bio</Text>
            )}
          </View>
        )}

        <View style={{ height: 1, backgroundColor: theme.border, marginHorizontal: 20, marginBottom: 20 }} />

        {/* VIEW MODE */}
        {!editing && (
          <View style={{ paddingHorizontal: 20 }}>
            {[
              { icon: "id-card-outline",   label: "Role",          value: "Student" },
              { icon: "school-outline",    label: "Department",    value: profile.department || "—" },
              { icon: "calendar-outline",  label: "Year of Study", value: profile.yearOfStudy || "—" },
            ].map((row) => (
              <View key={row.label} style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: theme.bgCard, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: theme.border }}>
                <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: theme.accent + "22", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={row.icon as any} size={18} color={theme.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>{row.label}</Text>
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: "700", marginTop: 2 }}>{row.value}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* EDIT MODE */}
        {editing && (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900", marginBottom: 16 }}>Edit Profile</Text>

            <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "800", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Department</Text>
            <TextInput style={inputStyle} value={editDept} onChangeText={setEditDept} placeholder="e.g. Faculty of Computing" placeholderTextColor={theme.textMuted} />

            <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "800", marginBottom: 6, marginTop: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Year of Study</Text>
            <TextInput style={inputStyle} value={editYear} onChangeText={setEditYear} placeholder="e.g. 2nd Year" placeholderTextColor={theme.textMuted} />

            <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "800", marginBottom: 6, marginTop: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>Bio</Text>
            <TextInput style={[inputStyle, { height: 100, paddingTop: 12, textAlignVertical: "top" }]} value={editBio} onChangeText={setEditBio} placeholder="Write something about yourself..." placeholderTextColor={theme.textMuted} multiline />

            <TouchableOpacity
              style={[{ marginTop: 24, backgroundColor: theme.btnPrimary, borderRadius: 14, height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, saving && { opacity: 0.7 }]}
              onPress={saveEdit} disabled={saving}
            >
              {saving ? <ActivityIndicator size="small" color={theme.btnPrimaryText} /> : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color={theme.btnPrimaryText} />
                  <Text style={{ color: theme.btnPrimaryText, fontSize: 16, fontWeight: "900" }}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
