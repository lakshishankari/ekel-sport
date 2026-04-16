import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, StatusBar,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import { loadLocalProfile, saveLocalProfile, type LocalProfile } from "../lib/profileStore";

function InitialsAvatar({ name, color, size = 90 }: { name: string; color: string; size?: number }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
  return (
    <View style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials || "?"}</Text>
    </View>
  );
}

export default function StudentProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  // From auth store
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  // From local store (editable)
  const [profile, setProfile] = useState<LocalProfile>({
    department: "", yearOfStudy: "", bio: "", avatarColor: "#4F46E5",
  });

  // Temp edit state
  const [editDept, setEditDept] = useState("");
  const [editYear, setEditYear] = useState("");
  const [editBio, setEditBio] = useState("");

  const load = useCallback(async () => {
    try {
      const auth = await loadAuth();
      if (!auth.token || auth.role !== "STUDENT") {
        router.replace("/login");
        return;
      }
      setFullName(auth.fullName || "Student");
      setEmail(auth.email || "");
      const local = await loadLocalProfile(auth.fullName || "");
      setProfile(local);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function startEdit() {
    setEditDept(profile.department);
    setEditYear(profile.yearOfStudy);
    setEditBio(profile.bio);
    setEditing(true);
  }

  function cancelEdit() { setEditing(false); }

  async function saveEdit() {
    try {
      setSaving(true);
      const updated: LocalProfile = {
        ...profile,
        department: editDept.trim(),
        yearOfStudy: editYear.trim(),
        bio: editBio.trim(),
      };
      await saveLocalProfile(updated);
      setProfile(updated);
      setEditing(false);
    } catch {
      Alert.alert("Error", "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#C9A227" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={26} color="#F9FAFB" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Profile</Text>
        {!editing ? (
          <TouchableOpacity onPress={startEdit} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="pencil-outline" size={22} color="#C9A227" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={cancelEdit}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Avatar + Name */}
        <View style={styles.heroSection}>
          <View style={styles.avatarWrapper}>
            <InitialsAvatar name={fullName} color={profile.avatarColor} size={96} />
            {/* Camera icon for future image upload */}
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={14} color="#111827" />
            </View>
          </View>

          <Text style={styles.nameText}>{fullName}</Text>
          <Text style={styles.emailText}>{email}</Text>

          {profile.department ? (
            <View style={styles.deptPill}>
              <Ionicons name="school-outline" size={13} color="#C9A227" />
              <Text style={styles.deptText}>{profile.department}</Text>
            </View>
          ) : null}

          {profile.yearOfStudy ? (
            <Text style={styles.yearText}>{profile.yearOfStudy}</Text>
          ) : null}
        </View>

        {/* Bio */}
        {!editing && (
          <View style={styles.bioSection}>
            {profile.bio ? (
              <Text style={styles.bioText}>{profile.bio}</Text>
            ) : (
              <Text style={styles.bioPlaceholder}>Tap the pencil to add your bio</Text>
            )}
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* --- VIEW MODE: info rows --- */}
        {!editing && (
          <View style={styles.infoSection}>
            <InfoRow icon="id-card-outline" label="Role" value="Student" />
            <InfoRow icon="school-outline"  label="Department" value={profile.department || "—"} />
            <InfoRow icon="calendar-outline" label="Year of Study" value={profile.yearOfStudy || "—"} />
          </View>
        )}

        {/* --- EDIT MODE --- */}
        {editing && (
          <View style={styles.editSection}>
            <Text style={styles.editSectionTitle}>Edit Profile</Text>

            <Text style={styles.fieldLabel}>Department</Text>
            <TextInput
              style={styles.textInput}
              value={editDept}
              onChangeText={setEditDept}
              placeholder="e.g. Faculty of Computing"
              placeholderTextColor="#4B5563"
            />

            <Text style={styles.fieldLabel}>Year of Study</Text>
            <TextInput
              style={styles.textInput}
              value={editYear}
              onChangeText={setEditYear}
              placeholder="e.g. 2nd Year"
              placeholderTextColor="#4B5563"
            />

            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.textInput, styles.bioInput]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Write something about yourself..."
              placeholderTextColor="#4B5563"
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={saveEdit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#111827" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#111827" />
                  <Text style={styles.saveBtnText}>Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={18} color="#C9A227" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B0F14" },
  center: { flex: 1, backgroundColor: "#0B0F14", alignItems: "center", justifyContent: "center" },

  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
  },
  topBarTitle: { color: "#F9FAFB", fontSize: 18, fontWeight: "800" },
  cancelText: { color: "#A7B0BE", fontWeight: "700", fontSize: 15 },

  scroll: { paddingBottom: 48 },

  // ── Hero ──────────────────────────────────────────────
  heroSection: { alignItems: "center", paddingTop: 20, paddingBottom: 24 },
  avatarWrapper: { position: "relative", marginBottom: 14 },
  avatar: { alignItems: "center", justifyContent: "center" },
  avatarText: { color: "white", fontWeight: "900" },
  cameraBadge: {
    position: "absolute", bottom: 0, right: 0,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#C9A227",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#0B0F14",
  },
  nameText: { color: "#F9FAFB", fontSize: 24, fontWeight: "900", letterSpacing: 0.3 },
  emailText: { color: "#6B7280", fontSize: 13, fontWeight: "600", marginTop: 4 },
  deptPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    marginTop: 10, backgroundColor: "rgba(201,162,39,0.12)",
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
  },
  deptText: { color: "#C9A227", fontSize: 12, fontWeight: "800" },
  yearText: { color: "#A7B0BE", fontSize: 12, fontWeight: "600", marginTop: 6 },

  // ── Bio ───────────────────────────────────────────────
  bioSection: { paddingHorizontal: 28, paddingBottom: 20 },
  bioText: { color: "rgba(229,231,235,0.75)", fontSize: 14, lineHeight: 22, textAlign: "center" },
  bioPlaceholder: { color: "#374151", fontSize: 13, fontStyle: "italic", textAlign: "center" },

  divider: { height: 1, backgroundColor: "#1E2A3A", marginHorizontal: 20, marginBottom: 20 },

  // ── Info rows ─────────────────────────────────────────
  infoSection: { paddingHorizontal: 20, gap: 4 },
  infoRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "#121826", borderRadius: 14, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: "#1E2A3A",
  },
  infoIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: "rgba(201,162,39,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  infoLabel: { color: "#6B7280", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  infoValue: { color: "#F9FAFB", fontSize: 15, fontWeight: "700", marginTop: 2 },

  // ── Edit Section ──────────────────────────────────────
  editSection: { paddingHorizontal: 20 },
  editSectionTitle: { color: "#F9FAFB", fontSize: 17, fontWeight: "900", marginBottom: 16 },
  fieldLabel: { color: "#A7B0BE", fontSize: 12, fontWeight: "800", marginBottom: 6, marginTop: 14, textTransform: "uppercase", letterSpacing: 0.5 },
  textInput: {
    backgroundColor: "#121826", borderRadius: 12,
    borderWidth: 1, borderColor: "#263041",
    color: "#F9FAFB", fontSize: 15, fontWeight: "600",
    paddingHorizontal: 14, paddingVertical: 12,
  },
  bioInput: { height: 100, paddingTop: 12 },

  saveBtn: {
    marginTop: 24, backgroundColor: "#C9A227",
    borderRadius: 14, height: 52,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  saveBtnText: { color: "#111827", fontSize: 16, fontWeight: "900" },
});
