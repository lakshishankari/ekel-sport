import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { apiGet, apiPost } from "../lib/api";
import { loadAuth } from "../lib/authStore";

type Sport = {
  id: number;
  name: string;
  venue: string | null;
  schedule_text: string | null;
  instructor_name: string | null;
  instructor_email: string | null;
  whatsapp_link: string | null;
};

export default function AdminSports() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [venue, setVenue] = useState("");
  const [scheduleText, setScheduleText] = useState("");
  const [instructorName, setInstructorName] = useState("");
  const [instructorEmail, setInstructorEmail] = useState("");
  const [whatsappLink, setWhatsappLink] = useState("");

  async function fetchSports() {
    try {
      const { token } = await loadAuth();
      if (!token) return router.replace("/login");

      const data = await apiGet<Sport[]>("/api/admin/sports", token);
      setSports(data);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load sports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSports();
  }, []);

  async function onCreateSport() {
    if (!name.trim()) {
      Alert.alert("Missing", "Sport name is required");
      return;
    }

    try {
      const { token } = await loadAuth();
      if (!token) return router.replace("/login");

      await apiPost(
        "/api/admin/sports",
        {
          name: name.trim(),
          venue: venue.trim(),
          schedule_text: scheduleText.trim(),
          instructor_name: instructorName.trim(),
          instructor_email: instructorEmail.trim(),
          whatsapp_link: whatsappLink.trim(),
        },
        token
      );

      Alert.alert("Success", "Sport created");
      setName("");
      setVenue("");
      setScheduleText("");
      setInstructorName("");
      setInstructorEmail("");
      setWhatsappLink("");

      setLoading(true);
      await fetchSports();
    } catch (e: any) {
      Alert.alert("Create failed", e?.message || "Try again");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manage Sports</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Sport name (e.g., Cricket)"
          placeholderTextColor="#6B7280"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Venue (optional)"
          placeholderTextColor="#6B7280"
          value={venue}
          onChangeText={setVenue}
        />
        <TextInput
          style={styles.input}
          placeholder="Schedule (optional) e.g., Mon/Wed 4-6PM"
          placeholderTextColor="#6B7280"
          value={scheduleText}
          onChangeText={setScheduleText}
        />
        <TextInput
          style={styles.input}
          placeholder="Instructor name (optional)"
          placeholderTextColor="#6B7280"
          value={instructorName}
          onChangeText={setInstructorName}
        />
        <TextInput
          style={styles.input}
          placeholder="Instructor email (optional) @kln.ac.lk"
          placeholderTextColor="#6B7280"
          autoCapitalize="none"
          keyboardType="email-address"
          value={instructorEmail}
          onChangeText={setInstructorEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="WhatsApp link (optional)"
          placeholderTextColor="#6B7280"
          autoCapitalize="none"
          value={whatsappLink}
          onChangeText={setWhatsappLink}
        />

        <TouchableOpacity style={styles.btn} onPress={onCreateSport}>
          <Text style={styles.btnText}>Create Sport</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.section}>Existing Sports</Text>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={sports}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {!!item.venue && <Text style={styles.cardText}>Venue: {item.venue}</Text>}
              {!!item.schedule_text && (
                <Text style={styles.cardText}>Schedule: {item.schedule_text}</Text>
              )}
            </View>
          )}
        />
      )}

      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0F14", padding: 20 },
  title: { color: "white", fontSize: 26, fontWeight: "900", textAlign: "center", marginBottom: 12 },
  form: { backgroundColor: "#121826", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#263041" },
  input: {
    borderWidth: 1,
    borderColor: "#263041",
    borderRadius: 12,
    padding: 12,
    color: "white",
    backgroundColor: "#0B0F14",
    marginBottom: 10,
  },
  btn: { backgroundColor: "#D4AF37", padding: 14, borderRadius: 12, alignItems: "center" },
  btnText: { fontWeight: "800", fontSize: 16, color: "#111827" },
  section: { color: "white", fontSize: 16, fontWeight: "800", marginTop: 16, marginBottom: 10 },
  card: { backgroundColor: "#121826", borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: "#263041" },
  cardTitle: { color: "white", fontSize: 16, fontWeight: "800" },
  cardText: { color: "#A7B0BE", marginTop: 4 },
  backBtn: { alignSelf: "center", marginTop: 10 },
  backText: { color: "#A7B0BE", textDecorationLine: "underline" },
});
