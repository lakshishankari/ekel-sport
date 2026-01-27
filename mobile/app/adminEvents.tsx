import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function AdminEvents() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Events</Text>
      <Text style={styles.sub}>Create competitions + divisions (UI coming next)</Text>

      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0F14", justifyContent: "center", alignItems: "center", padding: 24 },
  title: { color: "white", fontSize: 28, fontWeight: "900" },
  sub: { color: "#A7B0BE", marginTop: 10, textAlign: "center" },
  backBtn: { marginTop: 18 },
  backText: { color: "#A7B0BE", textDecorationLine: "underline" },
});
