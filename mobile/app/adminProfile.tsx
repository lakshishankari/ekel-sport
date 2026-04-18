import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, StatusBar,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth, saveAuth } from "../lib/authStore";
import { apiGet, apiPut } from "../lib/api";
import { useAppTheme } from "../lib/themeStore";

export default function AdminProfile() {
  const { theme, isDark } = useAppTheme();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [editing, setEditing]   = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail]       = useState("");
  const [role, setRole]         = useState("ADMIN");
  const [editName, setEditName] = useState("");

  const load = useCallback(async () => {
    try {
      const { token, role: r } = await loadAuth();
      if (!token || r !== "ADMIN") { router.replace("/login"); return; }
      const data = await apiGet<{ full_name: string; email: string; role: string }>("/api/admin/profile", token);
      setFullName(data.full_name || "Admin");
      setEmail(data.email || "");
      setRole(data.role || "ADMIN");
    } catch { /* fall back */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function saveEdit() {
    if (!editName.trim()) { Alert.alert("Error", "Name cannot be empty"); return; }
    try {
      setSaving(true);
      const { token } = await loadAuth();
      await apiPut("/api/admin/profile", { fullName: editName.trim() }, token!);
      await saveAuth(token!, role, editName.trim(), email);
      setFullName(editName.trim());
      setEditing(false);
      Alert.alert("Saved ✅", "Your profile has been updated.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not save profile.");
    } finally { setSaving(false); }
  }

  const initials = fullName.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

      {/* Top bar */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14 }}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={26} color={theme.text} />
        </TouchableOpacity>
        <Text style={{ color: theme.text, fontSize: 18, fontWeight: "800" }}>Admin Profile</Text>
        {!editing ? (
          <TouchableOpacity onPress={() => { setEditName(fullName); setEditing(true); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="pencil-outline" size={22} color={theme.accent} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setEditing(false)}>
            <Text style={{ color: theme.textSub, fontWeight: "700", fontSize: 15 }}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

        {/* Avatar */}
        <View style={{ alignItems: "center", paddingTop: 20, paddingBottom: 28 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: theme.accent, alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <Text style={{ color: "white", fontWeight: "900", fontSize: 34 }}>{initials || "A"}</Text>
          </View>
          <Text style={{ color: theme.text, fontSize: 24, fontWeight: "900" }}>{fullName}</Text>
          <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "600", marginTop: 4 }}>{email}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10, backgroundColor: theme.accent + "18", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999 }}>
            <Ionicons name="shield-checkmark-outline" size={13} color={theme.accent} />
            <Text style={{ color: theme.accent, fontSize: 12, fontWeight: "800" }}>Administrator</Text>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: theme.border, marginHorizontal: 20, marginBottom: 24 }} />

        {/* View mode */}
        {!editing && (
          <View style={{ paddingHorizontal: 20, gap: 12 }}>
            {[
              { icon: "person-outline",  label: "Full Name", value: fullName },
              { icon: "mail-outline",    label: "Email",     value: email },
              { icon: "id-card-outline", label: "Role",      value: "Administrator" },
            ].map((row) => (
              <View key={row.label} style={{ flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: theme.bgCard, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: theme.border }}>
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

        {/* Edit mode */}
        {editing && (
          <View style={{ paddingHorizontal: 20 }}>
            <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900", marginBottom: 20 }}>Edit Profile</Text>
            <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "800", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>Full Name</Text>
            <TextInput
              style={{ backgroundColor: theme.bgInput, borderRadius: 12, borderWidth: 1, borderColor: theme.border, color: theme.text, fontSize: 15, fontWeight: "600", paddingHorizontal: 14, paddingVertical: 12 }}
              value={editName}
              onChangeText={setEditName}
              placeholder="e.g. Sports Admin"
              placeholderTextColor={theme.textMuted}
            />
            <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 8, lineHeight: 16 }}>
              Email cannot be changed. Contact a system administrator if needed.
            </Text>
            <TouchableOpacity
              style={[{ marginTop: 28, backgroundColor: theme.btnPrimary, borderRadius: 14, height: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }, saving && { opacity: 0.7 }]}
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
