import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";
import { API_BASE_URL } from "../lib/config";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (val: string) => /\S+@\S+\.\S+/.test(val.trim());

  const submit = async () => {
    const clean = email.trim().toLowerCase();
    if (!clean) return Alert.alert("Enter email", "Please enter your email address.");
    if (!isValidEmail(clean))
      return Alert.alert("Invalid email", "Please enter a valid email address.");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed");

      Alert.alert(
        "OTP Sent 📧",
        "We've sent a verification code to your email. Check your inbox (and spam folder).",
        [
          {
            text: "Enter OTP",
            onPress: () =>
              router.push({ pathname: "/verifyOtp", params: { email: clean } }),
          },
        ]
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Forgot Password" subtitle="We'll send a reset code to your email." showBack />

      <AppCard style={{ marginTop: 14 }}>
        <Text style={styles.label}>Email Address</Text>
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
            editable={!loading}
            onSubmitEditing={submit}
            returnKeyType="send"
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.btn,
            pressed && { opacity: 0.85 },
            loading && styles.btnDisabled,
          ]}
          onPress={submit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#111827" />
          ) : (
            <>
              <Ionicons name="send-outline" size={18} color="#111827" />
              <Text style={styles.btnText}>Send OTP</Text>
            </>
          )}
        </Pressable>

        <Pressable
          onPress={() => router.replace("/login")}
          style={{ marginTop: 14, alignSelf: "center" }}
          disabled={loading}
        >
          <Text style={styles.link}>← Back to Login</Text>
        </Pressable>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: "rgba(229,231,235,0.70)", fontSize: 12.5, fontWeight: "800", marginBottom: 8 },
  inputRow: {
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
    marginTop: 16,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C9A227",
    flexDirection: "row",
    gap: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#111827", fontSize: 16, fontWeight: "900" },
  link: { color: "#A7B0BE", textDecorationLine: "underline", fontWeight: "700", fontSize: 13 },
});
