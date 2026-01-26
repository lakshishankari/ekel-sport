import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { loadAuth } from "../lib/authStore";
import { logout } from "../lib/logout";

export default function StudentHome() {
  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "STUDENT") {
        router.replace("/login");
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Student Dashboard</Text>

      {/* View sports & request enrollment */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/studentSports")}
      >
        <Text style={styles.cardText}>
          View Sports & Request Enrollment
        </Text>
      </TouchableOpacity>

      {/* Logout */}
      <TouchableOpacity style={styles.btn} onPress={logout}>
        <Text style={styles.btnText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F14",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#121826",
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#263041",
    width: "100%",
  },
  cardText: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  btn: {
    backgroundColor: "#C9A227",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 999,
    marginTop: 10,
  },
  btnText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
  },
});
