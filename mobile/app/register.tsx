import React, { useMemo, useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { apiPost } from "../lib/api";
import { Ionicons } from "@expo/vector-icons";

export default function RegisterScreen() {
  const [studentId, setStudentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  const [loading, setLoading] = useState(false);

  const emailHint = useMemo(
    () => "Student email format: shankar-im22048@stu.kln.ac.lk",
    []
  );

  function isValidStudentEmail(value: string) {
    const v = value.trim().toLowerCase();
    return v.endsWith("@stu.kln.ac.lk");
  }

  async function onRegister() {
    const sid = studentId.trim();
    const name = fullName.trim();
    const em = email.trim().toLowerCase();
    const pw = password;
    const cpw = confirmPassword;

    if (!sid || !name || !em || !pw || !cpw) {
      Alert.alert("Missing fields", "Please fill all fields.");
      return;
    }

    if (!isValidStudentEmail(em)) {
      Alert.alert(
        "Invalid student email",
        "Use your university student email like: name-im22048@stu.kln.ac.lk"
      );
      return;
    }

    if (pw.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters.");
      return;
    }

    if (pw !== cpw) {
      Alert.alert("Password mismatch", "Password and Confirm Password do not match.");
      return;
    }

    try {
      setLoading(true);

      // ✅ IMPORTANT: use the student self-registration endpoint
      await apiPost<{ message: string }>("/api/auth/register-student", {
        studentId: sid,
        fullName: name,
        email: em,
        password: pw,
      });

      Alert.alert("Success", "Account created! Now login.");
      router.replace("/login");
    } catch (e: any) {
      Alert.alert("Register failed", e?.message || "Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.sub}>Student self-registration</Text>

        <Text style={styles.hint}>{emailHint}</Text>

        <Text style={styles.label}>Student ID</Text>
        <TextInput
          style={styles.input}
          placeholder="IM22048"
          placeholderTextColor="#6B7280"
          value={studentId}
          onChangeText={setStudentId}
          autoCapitalize="characters"
        />

        <Text style={styles.label}>Full name</Text>
        <TextInput
          style={styles.input}
          placeholder="Your full name"
          placeholderTextColor="#6B7280"
          value={fullName}
          onChangeText={setFullName}
        />

        <Text style={styles.label}>University email</Text>
        <TextInput
          style={styles.input}
          placeholder="shankar-im22048@stu.kln.ac.lk"
          placeholderTextColor="#6B7280"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.pwRow}>
          <TextInput
            style={[styles.input, styles.pwInput]}
            placeholder="Min 8 characters"
            placeholderTextColor="#6B7280"
            secureTextEntry={!showPw}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPw((v) => !v)}>
            <Ionicons name={showPw ? "eye-off" : "eye"} size={20} color="#A7B0BE" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Confirm password</Text>
        <View style={styles.pwRow}>
          <TextInput
            style={[styles.input, styles.pwInput]}
            placeholder="Re-enter password"
            placeholderTextColor="#6B7280"
            secureTextEntry={!showConfirmPw}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            style={styles.eyeBtn}
            onPress={() => setShowConfirmPw((v) => !v)}
          >
            <Ionicons name={showConfirmPw ? "eye-off" : "eye"} size={20} color="#A7B0BE" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, loading && { opacity: 0.7 }]}
          onPress={onRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.primaryBtnText}>Register</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.push("/login")}>
          <Text style={styles.backText}>Already have an account? Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={() => router.push("/")}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0B0F14" },
  container: { flex: 1, padding: 20, justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "800", color: "white", marginBottom: 6 },
  sub: { color: "#A7B0BE", marginBottom: 10 },
  hint: { color: "#A7B0BE", marginBottom: 14, fontSize: 12 },
  label: { color: "white", marginBottom: 6, marginTop: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#263041",
    borderRadius: 12,
    padding: 12,
    color: "white",
    backgroundColor: "#121826",
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
    backgroundColor: "#D4AF37",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnText: { fontWeight: "800", fontSize: 16 },
  backBtn: { marginTop: 14, alignSelf: "center" },
  backText: { color: "#A7B0BE", textDecorationLine: "underline" },
});
