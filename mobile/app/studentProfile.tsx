import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { loadAuth } from "../lib/authStore";
import { apiGet, apiPost } from "../lib/api";

type Profile = {
  faculty: string | null;
  degree: string | null;
  year_of_study: string | null;
  bio: string | null;
  contact_number: string | null;
};

export default function StudentProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [faculty, setFaculty] = useState("");
  const [degree, setDegree] = useState("");
  const [year, setYear] = useState("");
  const [bio, setBio] = useState("");
  const [contact, setContact] = useState("");

  async function load() {
    try {
      setLoading(true);
      const { token, role } = await loadAuth();
      if (!token || role !== "STUDENT") return router.replace("/login");

      // If backend endpoint not implemented yet, this will fail, and we just show empty fields.
      const data = await apiGet<Profile>("/api/student/profile", token);

      setFaculty(data.faculty || "");
      setDegree(data.degree || "");
      setYear(data.year_of_study || "");
      setBio(data.bio || "");
      setContact(data.contact_number || "");
    } catch {
      // keep empty if API not ready
    } finally {
      setLoading(false);
    }
  }

  async function save() {
    try {
      setSaving(true);
      const { token } = await loadAuth();
      if (!token) return router.replace("/login");

      await apiPost("/api/student/profile", {
        faculty: faculty.trim() || null,
        degree: degree.trim() || null,
        year_of_study: year.trim() || null,
        bio: bio.trim() || null,
        contact_number: contact.trim() || null,
      }, token);

      Alert.alert("Saved", "Profile updated");
    } catch (e: any) {
      Alert.alert("Save failed", e?.message || "Backend not ready yet.");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ color: "#A7B0BE", marginTop: 10 }}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Profile</Text>
      <Text style={styles.sub}>Update your academic details and bio</Text>

      <Text style={styles.label}>Faculty</Text>
      <TextInput style={styles.input} value={faculty} onChangeText={setFaculty} placeholder="Faculty of Computing" placeholderTextColor="#6B7280" />

      <Text style={styles.label}>Degree</Text>
      <TextInput style={styles.input} value={degree} onChangeText={setDegree} placeholder="BSc (Hons) in ..." placeholderTextColor="#6B7280" />

      <Text style={styles.label}>Year of study</Text>
      <TextInput style={styles.input} value={year} onChangeText={setYear} placeholder="2nd Year" placeholderTextColor="#6B7280" />

      <Text style={styles.label}>Contact number</Text>
      <TextInput style={styles.input} value={contact} onChangeText={setContact} placeholder="07XXXXXXXX" placeholderTextColor="#6B7280" keyboardType="phone-pad" />

      <Text style={styles.label}>Bio</Text>
      <TextInput
        style={[styles.input, { height: 110, textAlignVertical: "top" }]}
        value={bio}
        onChangeText={setBio}
        placeholder="Write a short bio (like LinkedIn)..."
        placeholderTextColor="#6B7280"
        multiline
      />

      <TouchableOpacity style={[styles.primaryBtn, saving && { opacity: 0.7 }]} onPress={save} disabled={saving}>
        <Text style={styles.primaryText}>{saving ? "Saving..." : "Save Profile"}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.linkBtn} onPress={() => router.back()}>
        <Text style={styles.linkText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: "#0B0F14", justifyContent: "center", alignItems: "center" },
  container: { flex: 1, backgroundColor: "#0B0F14", padding: 20 },
  title: { color: "white", fontSize: 26, fontWeight: "900", textAlign: "center", marginTop: 10 },
  sub: { color: "#A7B0BE", textAlign: "center", marginTop: 6, marginBottom: 18 },

  label: { color: "white", marginTop: 12, marginBottom: 6, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#263041",
    borderRadius: 12,
    padding: 12,
    color: "white",
    backgroundColor: "#121826",
  },

  primaryBtn: { marginTop: 18, backgroundColor: "#D4AF37", padding: 14, borderRadius: 12, alignItems: "center" },
  primaryText: { fontWeight: "900", color: "#111827" },

  linkBtn: { marginTop: 14, alignSelf: "center" },
  linkText: { color: "#A7B0BE", textDecorationLine: "underline" },
});
