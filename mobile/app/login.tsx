import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from "react-native";
import { useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiPost } from "../lib/api";
import { saveAuth } from "../lib/authStore";
import { useAppTheme } from "../lib/themeStore";

type LoginResponse = {
  token: string;
  user: { role: "STUDENT" | "ADMIN" | "ADVISORY"; fullName: string; email: string };
};

export default function LoginScreen() {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    const em = email.trim().toLowerCase();
    const pw = password;
    if (!em || !pw) { Alert.alert("Missing fields", "Please enter email and password."); return; }
    try {
      setLoading(true);
      const data = await apiPost<LoginResponse>("/api/auth/login", { email: em, password: pw });
      await saveAuth(data.token, data.user.role, data.user.fullName, data.user.email);
      if (data.user.role === "STUDENT") router.replace("/studentHome" as Href);
      else if (data.user.role === "ADMIN") router.replace("/adminHome" as Href);
      else router.replace("/advisoryHome" as Href);
    } catch (e: any) {
      Alert.alert("Login failed", e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ flexGrow: 1, padding: 22, justifyContent: "center" }}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

      <Text style={{ color: theme.text, fontSize: 34, fontWeight: "900" }}>Login</Text>
      <Text style={{ color: theme.textSub, marginTop: 6, marginBottom: 18 }}>
        Use your system-provided account
      </Text>

      <Text style={{ color: theme.text, marginTop: 10, marginBottom: 6, fontWeight: "700" }}>Email</Text>
      <TextInput
        style={{
          backgroundColor: theme.bgInput,
          borderWidth: 1,
          borderColor: theme.border,
          color: theme.text,
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 14,
        }}
        placeholder="name@domain.com"
        placeholderTextColor={theme.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={{ color: theme.text, marginTop: 10, marginBottom: 6, fontWeight: "700" }}>Password</Text>
      <View style={{ position: "relative" }}>
        <TextInput
          style={{
            backgroundColor: theme.bgInput,
            borderWidth: 1,
            borderColor: theme.border,
            color: theme.text,
            paddingVertical: 12,
            paddingHorizontal: 14,
            paddingRight: 44,
            borderRadius: 14,
          }}
          placeholder="Your password"
          placeholderTextColor={theme.textMuted}
          secureTextEntry={!showPw}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          style={{ position: "absolute", right: 12, top: 12, height: 24, width: 24, alignItems: "center", justifyContent: "center" }}
          onPress={() => setShowPw((v) => !v)}
        >
          <Ionicons name={showPw ? "eye-off" : "eye"} size={20} color={theme.textSub} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={{
          marginTop: 18,
          backgroundColor: theme.btnPrimary,
          paddingVertical: 14,
          borderRadius: 999,
          alignItems: "center",
        }}
        onPress={onLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={theme.btnPrimaryText} />
        ) : (
          <Text style={{ fontWeight: "800", fontSize: 16, color: theme.btnPrimaryText }}>Login</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/forgotPassword" as Href)} style={{ marginTop: 14 }}>
        <Text style={{ color: theme.accent, fontWeight: "700", textAlign: "center" }}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/" as Href)} style={{ marginTop: 10 }}>
        <Text style={{ color: theme.textSub, textAlign: "center" }}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
