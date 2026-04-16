import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, StatusBar,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import { loadLocalProfile, saveLocalProfile, type LocalProfile } from "../lib/profileStore";
import { useAppTheme } from "../lib/themeStore";

function InitialsAvatar({ name, color, size = 90 }: { name: string; color: string; size?: number }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: "center", justifyContent: "center" }}>
      <Text style={{ color: "white", fontWeight: "900", fontSize: size * 0.36 }}>{initials || "?"}</Text>
    </View>
  );
}

function InfoRow({ icon, label, value, theme }: { icon: any; label: string; value: string; theme: any }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: theme.bgCard, borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: theme.border }}>
      <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: theme.accent + "22", alignItems: "center", justifyContent: "center" }}>
        <Ionicons name={icon} size={18} color={theme.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</Text>
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: "700", marginTop: 2 }}>{value}</Text>
      </View>
    </View>
  );
}

export default function StudentProfile() {
  const { theme, isDark } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<LocalProfile>({ department: "", yearOfStudy: "", bio: "", avatarColor: "#4F46E5" });
  const [editDept, setEditDept] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editBio, setEditBio] = useState("");

  const load = useCallback(async () => {
    try {
      const auth = await loadAuth();
      if (!auth.token || auth.role !== "STUDENT") { router.replace("/login"); return; }
      setFullName(auth.fullName || "Student");
      setEmail(auth.email || "");
      const local = await loadLocalProfile(auth.fullName || "");
      setProfile(local);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit() { setEditDept(profile.department); setEditYear(profile.yearOfStudy); setEditBio(profile.bio); setEditing(true); }
  function cancelEdit() { setEditing(false); }

  async function saveEdit() {
    try {
      setSaving(true);
      const updated: LocalProfile = { ...profile, department: editDept.trim(), yearOfStudy: editYear.trim(), bio: editBio.trim() };
      await saveLocalProfile(updated);
      setProfile(updated);
      setEditing(false);
    } catch { Alert.alert("Error", "Could not save profile."); }
    finally { setSaving(false); }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  const inputStyle = {
    backgroundColor: theme.bgInput, borderRadius: 12, borderWidth: 1, borderColor: theme.border,
    color: theme.text, fontSize: 15, fontWeight: "600" as const, paddingHorizontal: 14, paddingVertical: 12,
  };

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
          <TouchableOpacity onPress={cancelEdit}>
            <Text style={{ color: theme.textSub, fontWeight: "700", fontSize: 15 }}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

        {/* Avatar + Name */}
        <View style={{ alignItems: "center", paddingTop: 20, paddingBottom: 24 }}>
          <View style={{ position: "relative", marginBottom: 14 }}>
            <InitialsAvatar name={fullName} color={profile.avatarColor} size={96} />
            <View style={{ position: "absolute", bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: theme.bg }}>
              <Ionicons name="camera" size={14} color={theme.btnPrimaryText} />
            </View>
          </View>

          <Text style={{ color: theme.text, fontSize: 24, fontWeight: "900", letterSpacing: 0.3 }}>{fullName}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "600", marginTop: 4 }}>{email}</Text>

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

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: theme.border, marginHorizontal: 20, marginBottom: 20 }} />

        {/* VIEW MODE */}
        {!editing && (
          <View style={{ paddingHorizontal: 20 }}>
            <InfoRow icon="id-card-outline"   label="Role"          value="Student"                       theme={theme} />
            <InfoRow icon="school-outline"    label="Department"    value={profile.department || "—"}     theme={theme} />
            <InfoRow icon="calendar-outline"  label="Year of Study" value={profile.yearOfStudy || "—"}   theme={theme} />
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
