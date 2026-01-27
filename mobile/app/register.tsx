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
    () => "Student ID format: IM/2022/048 (DEPT/YEAR/SERIAL)",
    []
  );

  function isValidStudentId(value: string) {
    // Format: DEPT/YEAR/SERIAL (e.g., IM/2022/048)
    const regex = /^[A-Z]{2,4}\/\d{4}\/\d{3}$/;
    return regex.test(value.trim());
  }

  function isValidStudentEmail(value: string) {
    // Format: name-dept2022serial@stu.kln.ac.lk (e.g., shankar-im2022048@stu.kln.ac.lk)
    const v = value.trim().toLowerCase();
    const regex = /^[a-z0-9._-]+-[a-z]{2,}\d+@stu\.kln\.ac\.lk$/;
    return regex.test(v);
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

    if (!isValidStudentId(sid)) {
      Alert.alert(
        "Invalid Student ID",
        "Use format: DEPT/YEAR/SERIAL\nExamples:\n• IM/2022/048\n• PY/2023/123\n• CS/2021/017"
      );
      return;
    }

    if (!isValidStudentEmail(em)) {
      Alert.alert(
        "Invalid student email",
        "Use your university student email like: shankar-im2022048@stu.kln.ac.lk"
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

      // ✅ NEW FLOW: Send OTP for email verification
      await apiPost<{ message: string }>("/api/auth-otp/send-registration-otp", {
        studentId: sid,
        fullName: name,
        email: em,
        password: pw,
      });

      Alert.alert(
        "OTP Sent! 📧",
        "We've sent a verification code to your email. Please check your inbox (and spam folder).",
        [
          {
            text: "OK",
            onPress: () => {
              router.push({
                pathname: "/verifyRegistrationOtp",
                params: {
                  email: em,
                  studentId: sid,
                  fullName: name,
                  password: pw,
                },
              });
            },
          },
        ]
      );
    } catch (e: any) {
      Alert.alert("Failed to send OTP", e?.message || "Try again.");
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
          placeholder="IM/2022/048"
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
          placeholder="shankar-im2022048@stu.kln.ac.lk"
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
            <Text style={styles.primaryBtnText}>Send OTP</Text>
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
