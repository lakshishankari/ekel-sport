import React, { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter, type Href } from "expo-router";
import { loadAuth } from "../lib/authStore";

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();

      if (token && role) {
        if (role === "STUDENT") router.replace("/studentHome" as Href);
        else if (role === "ADMIN") router.replace("/adminHome" as Href);
        else router.replace("/advisoryWeightages" as Href);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.kicker}>Sports Management System</Text>
      <Text style={styles.title}>
        Welcome to{"\n"}
        <Text style={styles.brand}>EKEL-Sport</Text>
      </Text>
      <Text style={styles.sub}>University of Kelaniya sports platform</Text>

      <TouchableOpacity
        style={styles.primaryBtn}
        onPress={() => router.push("/login" as Href)}
      >
        <Text style={styles.primaryBtnText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/register" as Href)}>
        <Text style={styles.link}>Student Register</Text>
      </TouchableOpacity>

      <Text style={styles.note}>Admin & Advisory accounts are provided by the system.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0F14", padding: 22, justifyContent: "center" },
  kicker: { color: "#C9A227", opacity: 0.9, fontWeight: "700", marginBottom: 14 },
  title: { color: "white", fontSize: 40, fontWeight: "900", lineHeight: 44 },
  brand: { color: "#C9A227" },
  sub: { color: "#98A2B3", marginTop: 10, fontSize: 16 },
  primaryBtn: {
    marginTop: 28,
    backgroundColor: "#C9A227",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryBtnText: { fontWeight: "800", fontSize: 16, color: "#111827" },
  link: { marginTop: 14, color: "#C9A227", fontWeight: "700", textAlign: "center" },
  note: { marginTop: 18, color: "#667085", textAlign: "center" },
});
