import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { loadAuth } from "../lib/authStore";
import { logout } from "../lib/logout";

export default function AdminHome() {
  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "ADMIN") router.replace("/login");
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>

      <TouchableOpacity style={styles.btn} onPress={logout}>
        <Text style={styles.btnText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0F14", justifyContent: "center", alignItems: "center" },
  title: { color: "white", fontSize: 28, fontWeight: "900", marginBottom: 18 },
  btn: { backgroundColor: "#C9A227", paddingVertical: 14, paddingHorizontal: 28, borderRadius: 999 },
  btnText: { color: "#111827", fontSize: 16, fontWeight: "900" },
});
