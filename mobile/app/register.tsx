import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { router } from "expo-router";
import { apiPost } from "../lib/api";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../lib/themeStore";

export default function RegisterScreen() {
  const { theme, isDark } = useAppTheme();
  const [studentId, setStudentId] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const emailHint = useMemo(() => "Student ID format: IM/2022/048 (DEPT/YEAR/SERIAL)", []);

  function isValidStudentId(value: string) {
    return /^[A-Z]{2,4}\/\d{4}\/\d{3}$/.test(value.trim());
  }

  function isValidStudentEmail(value: string) {
    return /^[a-z0-9._-]+-[a-z]{2,}\d+@stu\.kln\.ac\.lk$/.test(value.trim().toLowerCase());
  }

  async function onRegister() {
    const sid = studentId.trim();
    const name = fullName.trim();
    const em = email.trim().toLowerCase();
    const pw = password;
    const cpw = confirmPassword;

    if (!sid || !name || !em || !pw || !cpw) { Alert.alert("Missing fields", "Please fill all fields."); return; }
    if (!isValidStudentId(sid)) { Alert.alert("Invalid Student ID", "Use format: DEPT/YEAR/SERIAL\nExamples:\n• IM/2022/048\n• PY/2023/123"); return; }
    if (!isValidStudentEmail(em)) { Alert.alert("Invalid student email", "Use your university student email like: shankar-im2022048@stu.kln.ac.lk"); return; }
    if (pw.length < 8) { Alert.alert("Weak password", "Password must be at least 8 characters."); return; }
    if (pw !== cpw) { Alert.alert("Password mismatch", "Password and Confirm Password do not match."); return; }

    try {
      setLoading(true);
      await apiPost<{ message: string }>("/api/auth-otp/send-registration-otp", { studentId: sid, fullName: name, email: em, password: pw });
      // Success — navigate directly without an intermediate alert
      router.push({ pathname: "/verifyRegistrationOtp", params: { email: em, studentId: sid, fullName: name, password: pw } });
    } catch (e: any) {
      const msg: string = e?.message || "";

      // Rate-limited: an OTP was already sent recently — redirect to enter it
      if (msg.toLowerCase().includes("please wait") || msg.toLowerCase().includes("wait before")) {
        Alert.alert(
          "OTP Already Sent 📧",
          "A verification code was already sent to your email. Please check your inbox and enter the code.",
          [{ text: "Enter OTP", onPress: () => router.push({ pathname: "/verifyRegistrationOtp", params: { email: em, studentId: sid, fullName: name, password: pw } }) }]
        );
        return;
      }

      // Timeout: OTP was likely saved to DB but response was slow
      if (msg.toLowerCase().includes("timed out") || msg.toLowerCase().includes("request timed out")) {
        Alert.alert(
          "Check your email 📧",
          "The server took a while to respond, but your OTP may have been sent. Please check your email and enter the code.",
          [{ text: "Enter OTP", onPress: () => router.push({ pathname: "/verifyRegistrationOtp", params: { email: em, studentId: sid, fullName: name, password: pw } }) }]
        );
        return;
      }

      Alert.alert("Failed to send OTP", msg || "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: 12,
    padding: 12,
    color: theme.text,
    backgroundColor: theme.bgInput,
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.bg }}
      contentContainerStyle={{ flexGrow: 1, padding: 20, justifyContent: "center" }}
      keyboardShouldPersistTaps="handled"
    >
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />

      <Text style={{ fontSize: 28, fontWeight: "800", color: theme.text, marginBottom: 6 }}>Create account</Text>
      <Text style={{ color: theme.textSub, marginBottom: 10 }}>Student self-registration</Text>
      <Text style={{ color: theme.textSub, marginBottom: 14, fontSize: 12 }}>{emailHint}</Text>

      <Text style={{ color: theme.text, marginBottom: 6, marginTop: 10 }}>Student ID</Text>
      <TextInput style={inputStyle} placeholder="IM/2022/048" placeholderTextColor={theme.textMuted} value={studentId} onChangeText={setStudentId} autoCapitalize="characters" />

      <Text style={{ color: theme.text, marginBottom: 6, marginTop: 10 }}>Full name</Text>
      <TextInput style={inputStyle} placeholder="Your full name" placeholderTextColor={theme.textMuted} value={fullName} onChangeText={setFullName} />

      <Text style={{ color: theme.text, marginBottom: 6, marginTop: 10 }}>University email</Text>
      <TextInput style={inputStyle} placeholder="shankar-im2022048@stu.kln.ac.lk" placeholderTextColor={theme.textMuted} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />

      <Text style={{ color: theme.text, marginBottom: 6, marginTop: 10 }}>Password</Text>
      <View style={{ position: "relative" }}>
        <TextInput style={[inputStyle, { paddingRight: 44 }]} placeholder="Min 8 characters" placeholderTextColor={theme.textMuted} secureTextEntry={!showPw} value={password} onChangeText={setPassword} />
        <TouchableOpacity style={{ position: "absolute", right: 12, top: 12, height: 24, width: 24, alignItems: "center", justifyContent: "center" }} onPress={() => setShowPw((v) => !v)}>
          <Ionicons name={showPw ? "eye-off" : "eye"} size={20} color={theme.textSub} />
        </TouchableOpacity>
      </View>

      <Text style={{ color: theme.text, marginBottom: 6, marginTop: 10 }}>Confirm password</Text>
      <View style={{ position: "relative" }}>
        <TextInput style={[inputStyle, { paddingRight: 44 }]} placeholder="Re-enter password" placeholderTextColor={theme.textMuted} secureTextEntry={!showConfirmPw} value={confirmPassword} onChangeText={setConfirmPassword} />
        <TouchableOpacity style={{ position: "absolute", right: 12, top: 12, height: 24, width: 24, alignItems: "center", justifyContent: "center" }} onPress={() => setShowConfirmPw((v) => !v)}>
          <Ionicons name={showConfirmPw ? "eye-off" : "eye"} size={20} color={theme.textSub} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[{ marginTop: 18, backgroundColor: theme.btnPrimary, padding: 14, borderRadius: 12, alignItems: "center" }, loading && { opacity: 0.7 }]}
        onPress={onRegister}
        disabled={loading}
      >
        {loading ? <ActivityIndicator color={theme.btnPrimaryText} /> : <Text style={{ fontWeight: "800", fontSize: 16, color: theme.btnPrimaryText }}>Send OTP</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={{ marginTop: 14, alignSelf: "center" }} onPress={() => router.push("/login")}>
        <Text style={{ color: theme.textSub, textDecorationLine: "underline" }}>Already have an account? Login</Text>
      </TouchableOpacity>

      <TouchableOpacity style={{ marginTop: 14, alignSelf: "center" }} onPress={() => router.replace("/")}>
        <Text style={{ color: theme.textSub, textDecorationLine: "underline" }}>Back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
