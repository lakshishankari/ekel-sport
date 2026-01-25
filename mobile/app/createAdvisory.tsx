import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";

export default function CreateAdvisory() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Advisory Account</Text>

      <Text style={styles.text}>
        This feature will be implemented next.
      </Text>

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F14",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "white",
    marginBottom: 12,
    textAlign: "center",
  },
  text: {
    color: "#A7B0BE",
    textAlign: "center",
    marginBottom: 24,
  },
  backBtn: {
    alignSelf: "center",
  },
  backText: {
    color: "#D4AF37",
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
