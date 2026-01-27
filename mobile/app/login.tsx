import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useRouter, type Href } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiPost } from "../lib/api";
import { saveAuth } from "../lib/authStore";

type LoginResponse = {
  token: string;
  user: { role: "STUDENT" | "ADMIN" | "ADVISORY"; fullName: string; email: string };
};

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onLogin() {
    const em = email.trim().toLowerCase();
    const pw = password;

    if (!em || !pw) {
      Alert.alert("Missing fields", "Please enter email and password.");
      return;
    }

    try {
      setLoading(true);

      const data = await apiPost<LoginResponse>("/api/auth/login", {
        email: em,
        password: pw,
      });

      await saveAuth(data.token, data.user.role);

      if (data.user.role === "STUDENT") router.replace("/studentHome" as Href);
      else if (data.user.role === "ADMIN") router.replace("/adminHome" as Href);
      else router.replace("/advisoryWeightages" as Href);
    } catch (e: any) {
      Alert.alert("Login failed", e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <Text style={styles.sub}>Use your system-provided account</Text>

      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        placeholder="name@domain.com"
        placeholderTextColor="#667085"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Password</Text>

      <View style={styles.pwRow}>
        <TextInput
          style={[styles.input, styles.pwInput]}
          placeholder="Your password"
          placeholderTextColor="#667085"
          secureTextEntry={!showPw}
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw((v) => !v)}>
          <Ionicons name={showPw ? "eye-off" : "eye"} size={20} color="#98A2B3" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={onLogin} disabled={loading}>
        {loading ? <ActivityIndicator /> : <Text style={styles.primaryBtnText}>Login</Text>}
      </TouchableOpacity>

      {/* Forgot Password */}
      <TouchableOpacity onPress={() => router.push("/forgotPassword" as Href)}>
        <Text style={styles.link}>Forgot password?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/" as Href)}>
        <Text style={styles.back}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0F14", padding: 22, justifyContent: "center" },
  title: { color: "white", fontSize: 34, fontWeight: "900" },
  sub: { color: "#98A2B3", marginTop: 6, marginBottom: 18 },
  label: { color: "#E4E7EC", marginTop: 10, marginBottom: 6, fontWeight: "700" },
  input: {
    backgroundColor: "#111827",
    borderWidth: 1,
    borderColor: "#1F2937",
    color: "white",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
  },
  pwRow: { position: "relative" },
  pwInput: { paddingRight: 44 },
  eyeBtn: {
    position: "absolute",
    right: 12,
    top: 12,
    height: 24,
    width: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtn: {
    marginTop: 18,
    backgroundColor: "#C9A227",
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: "center",
  },
  primaryBtnText: { fontWeight: "800", fontSize: 16, color: "#111827" },
  link: { marginTop: 14, color: "#C9A227", fontWeight: "700", textAlign: "center" },
  back: { marginTop: 10, color: "#98A2B3", textAlign: "center" },
});
