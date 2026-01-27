import React, { useMemo, useState } from "react";
import { Text, StyleSheet, TextInput, Pressable, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL || "http://192.168.1.7:5000";

export default function ResetPassword() {
  const params = useLocalSearchParams();
  const email = useMemo(() => String(params.email || "").trim().toLowerCase(), [params.email]);
  const resetToken = useMemo(() => String(params.reset_token || ""), [params.reset_token]);

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [showPw1, setShowPw1] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email || !resetToken) return Alert.alert("Missing data", "Go back and try again.");
    if (pw1.length < 6) return Alert.alert("Weak password", "Use at least 6 characters.");
    if (pw1 !== pw2) return Alert.alert("Mismatch", "Passwords do not match.");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, reset_token: resetToken, new_password: pw1 }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed");

      Alert.alert("Success", "Password reset successful. Please login.");
      router.replace("/login");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <AppHeader title="Reset Password" subtitle="Set a new password" showBack />

      <AppCard style={{ marginTop: 14 }}>
        <Text style={styles.label}>New password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            value={pw1}
            onChangeText={setPw1}
            secureTextEntry={!showPw1}
            style={styles.field}
            placeholder="••••••"
            placeholderTextColor="rgba(229,231,235,0.35)"
          />
          <Pressable
            onPress={() => setShowPw1(!showPw1)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPw1 ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="rgba(229,231,235,0.5)"
            />
          </Pressable>
        </View>

        <Text style={styles.label}>Confirm password</Text>
        <View style={styles.inputContainer}>
          <TextInput
            value={pw2}
            onChangeText={setPw2}
            secureTextEntry={!showPw2}
            style={styles.field}
            placeholder="••••••"
            placeholderTextColor="rgba(229,231,235,0.35)"
          />
          <Pressable
            onPress={() => setShowPw2(!showPw2)}
            style={styles.eyeIcon}
          >
            <Ionicons
              name={showPw2 ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="rgba(229,231,235,0.5)"
            />
          </Pressable>
        </View>

        <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }]} onPress={submit} disabled={loading}>
          <Ionicons name="checkmark-circle-outline" size={18} color="#111827" />
          <Text style={styles.btnText}>{loading ? "Saving..." : "Save New Password"}</Text>
        </Pressable>
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { marginTop: 10, color: "rgba(229,231,235,0.70)", fontSize: 12.5, fontWeight: "800" },
  inputContainer: {
    position: "relative",
    marginTop: 6,
  },
  field: {
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingRight: 45,
    color: "#F9FAFB",
    fontWeight: "800",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  eyeIcon: {
    position: "absolute",
    right: 12,
    top: 14,
  },
  btn: {
    marginTop: 14,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#C9A227",
    flexDirection: "row",
    gap: 8,
  },
  btnText: { color: "#111827", fontSize: 16, fontWeight: "900" },
});
