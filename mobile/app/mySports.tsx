import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from "react-native";
import { router } from "expo-router";
import { apiGet } from "../lib/api";
import { loadAuth } from "../lib/authStore";

type MySport = {
  id: number;
  name: string;
  venue: string | null;
  schedule_text: string | null;
  instructor_name: string | null;
  instructor_email: string | null;
  whatsapp_link: string | null;
  status: "APPROVED";
};

export default function MySports() {
  const [items, setItems] = useState<MySport[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchMySports() {
    try {
      setLoading(true);
      const { token, role } = await loadAuth();
      if (!token) return router.replace("/login");
      if (role !== "STUDENT") return router.replace("/");

      const data = await apiGet<MySport[]>("/api/student/my-sports", token);
      setItems(data);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load your sports");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMySports();
  }, []);

  async function openLink(url: string) {
    try {
      const ok = await Linking.canOpenURL(url);
      if (!ok) return Alert.alert("Cannot open", "Link not supported on this device.");
      await Linking.openURL(url);
    } catch {
      Alert.alert("Error", "Failed to open link");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Sports</Text>
      <Text style={styles.sub}>Only approved sports appear here</Text>

      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(x) => String(x.id)}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>{item.name}</Text>

              {!!item.venue && <Text style={styles.text}>Venue: {item.venue}</Text>}
              {!!item.schedule_text && <Text style={styles.text}>Schedule: {item.schedule_text}</Text>}
              {!!item.instructor_name && <Text style={styles.text}>Instructor: {item.instructor_name}</Text>}
              {!!item.instructor_email && <Text style={styles.text}>Email: {item.instructor_email}</Text>}

              {!!item.whatsapp_link ? (
                <TouchableOpacity
                  style={styles.btn}
                  onPress={() => openLink(item.whatsapp_link as string)}
                >
                  <Text style={styles.btnText}>Open WhatsApp Group</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.note}>WhatsApp link not added yet.</Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ color: "#A7B0BE", textAlign: "center", marginTop: 30 }}>
              You don’t have any approved sports yet.
            </Text>
          }
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
  title: { color: "white", fontSize: 26, fontWeight: "900", textAlign: "center" },
  sub: { color: "#A7B0BE", textAlign: "center", marginTop: 6, marginBottom: 14 },

  card: {
    backgroundColor: "#121826",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#263041",
  },
  cardTitle: { color: "white", fontSize: 18, fontWeight: "900" },
  text: { color: "#A7B0BE", marginTop: 6 },

  btn: {
    marginTop: 12,
    backgroundColor: "#D4AF37",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnText: { fontWeight: "900", color: "#111827" },
  note: { color: "#A7B0BE", marginTop: 10, fontSize: 12 },

  backBtn: { alignSelf: "center", marginTop: 10 },
  backText: { color: "#A7B0BE", textDecorationLine: "underline" },
});
