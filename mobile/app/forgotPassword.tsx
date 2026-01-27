import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.1.7:5000";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const clean = email.trim().toLowerCase();
    if (!clean) return Alert.alert("Enter email", "Please enter your email address.");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed");

      // Go OTP screen (we pass email)
      router.push({ pathname: "/verifyOtp", params: { email: clean } });
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Forgot Password" subtitle="We will send an OTP to your email." showBack />

      <AppCard style={{ marginTop: 14 }}>
        <Text style={styles.label}>Email</Text>
        <View style={styles.inputRow}>
          <Ionicons name="mail-outline" size={18} color="rgba(229,231,235,0.8)" />
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            placeholder="name@stu.kln.ac.lk"
            placeholderTextColor="rgba(229,231,235,0.35)"
          />
        </View>

        <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]} onPress={submit} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "Sending..." : "Send OTP"}</Text>
        </Pressable>

        <Pressable onPress={() => router.replace("/login")} style={{ marginTop: 12, alignSelf: "center" }}>
          <Text style={styles.link}>Back to Login</Text>
        </Pressable>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: "rgba(229,231,235,0.70)", fontSize: 12.5, fontWeight: "800" },
  inputRow: {
    marginTop: 8,
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  input: { flex: 1, color: "#F9FAFB", fontWeight: "800" },
  btn: {
    marginTop: 14,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C9A227",
  },
  btnText: { color: "#111827", fontSize: 16, fontWeight: "900" },
  link: { color: "#A7B0BE", textDecorationLine: "underline", fontWeight: "700" },
});
