import React, { useState } from "react";
import { Text, TextInput, Pressable, Alert, View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";
import { API_BASE_URL } from "../lib/config";
import { useAppTheme } from "../lib/themeStore";

export default function ForgotPassword() {
  const { theme } = useAppTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const isValidEmail = (val: string) => /\S+@\S+\.\S+/.test(val.trim());

  const submit = async () => {
    const clean = email.trim().toLowerCase();
    if (!clean) return Alert.alert("Enter email", "Please enter your email address.");
    if (!isValidEmail(clean)) return Alert.alert("Invalid email", "Please enter a valid email address.");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed");
      Alert.alert("OTP Sent 📧", "We've sent a verification code to your email. Check your inbox (and spam folder).", [{
        text: "Enter OTP",
        onPress: () => router.push({ pathname: "/verifyOtp", params: { email: clean } }),
      }]);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Something went wrong");
    } finally { setLoading(false); }
  };

  return (
    <Screen>
      <AppHeader title="Forgot Password" subtitle="We'll send a reset code to your email." showBack />
      <AppCard style={{ marginTop: 14 }}>
        <Text style={{ color: theme.textSub, fontSize: 12.5, fontWeight: "800", marginBottom: 8 }}>Email Address</Text>
        <View style={{ height: 48, borderRadius: 14, paddingHorizontal: 12, flexDirection: "row", gap: 10, alignItems: "center", backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border }}>
          <Ionicons name="mail-outline" size={18} color={theme.textSub} />
          <TextInput
            value={email} onChangeText={setEmail} autoCapitalize="none"
            keyboardType="email-address" style={{ flex: 1, color: theme.text, fontWeight: "800" }}
            placeholder="name@stu.kln.ac.lk" placeholderTextColor={theme.textMuted}
            editable={!loading} onSubmitEditing={submit} returnKeyType="send"
          />
        </View>

        <Pressable
          style={({ pressed }) => [{ marginTop: 16, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: theme.btnPrimary, flexDirection: "row", gap: 8 }, pressed && { opacity: 0.85 }, loading && { opacity: 0.6 }]}
          onPress={submit} disabled={loading}
        >
          {loading ? <ActivityIndicator color={theme.btnPrimaryText} /> : (
            <>
              <Ionicons name="send-outline" size={18} color={theme.btnPrimaryText} />
              <Text style={{ color: theme.btnPrimaryText, fontSize: 16, fontWeight: "900" }}>Send OTP</Text>
            </>
          )}
        </Pressable>

        <Pressable onPress={() => router.replace("/login")} style={{ marginTop: 14, alignSelf: "center" }} disabled={loading}>
          <Text style={{ color: theme.textSub, textDecorationLine: "underline", fontWeight: "700", fontSize: 13 }}>← Back to Login</Text>
        </Pressable>
      </AppCard>
    </Screen>
  );
}
