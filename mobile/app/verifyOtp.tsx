import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.1.7:5000";

export default function VerifyOtp() {
  const params = useLocalSearchParams();
  const email = useMemo(() => String(params.email || "").trim().toLowerCase(), [params.email]);

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email) return Alert.alert("Missing email", "Go back and enter email again.");
    if (otp.trim().length !== 6) return Alert.alert("Invalid OTP", "OTP must be 6 digits.");

    setLoading(true);
    try {
      const url = `${API_BASE}/auth/verify-otp`;
      console.log("📱 Verifying OTP:", url, "email:", email);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: otp.trim() }),
      });

      console.log("📱 Response status:", res.status);
      const data = await res.json().catch(() => ({}));
      console.log("📱 Response data:", data);
      if (!res.ok) throw new Error(data?.message || "Failed");

      // backend returns reset_token
      const resetToken = data?.reset_token;
      if (!resetToken) throw new Error("Missing reset token");

      router.push({ pathname: "/resetPassword", params: { email, reset_token: resetToken } });
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Verify OTP" subtitle={`Enter the 6-digit OTP sent to ${email}`} showBack />

      <AppCard style={{ marginTop: 14 }}>
        <Text style={styles.label}>OTP</Text>
        <View style={styles.inputRow}>
          <Ionicons name="key-outline" size={18} color="rgba(229,231,235,0.8)" />
          <TextInput
            value={otp}
            onChangeText={(t) => setOtp(t.replace(/[^\d]/g, "").slice(0, 6))}
            keyboardType="numeric"
            style={styles.input}
            placeholder="123456"
            placeholderTextColor="rgba(229,231,235,0.35)"
            maxLength={6}
          />
        </View>

        <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]} onPress={submit} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "Verifying..." : "Verify OTP"}</Text>
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
  input: { flex: 1, color: "#F9FAFB", fontWeight: "900", letterSpacing: 2 },
  btn: {
    marginTop: 14,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C9A227",
  },
  btnText: { color: "#111827", fontSize: 16, fontWeight: "900" },
});
