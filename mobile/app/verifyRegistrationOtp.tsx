import React, { useMemo, useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator, Keyboard } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";
import { API_BASE_URL } from "../lib/config";
import { saveAuth } from "../lib/authStore";
import { useAppTheme } from "../lib/themeStore";

const RESEND_COOLDOWN = 60;

export default function VerifyRegistrationOtp() {
  const { theme } = useAppTheme();
  const params = useLocalSearchParams();
  const email    = useMemo(() => String(params.email    || "").trim().toLowerCase(), [params.email]);
  const studentId= useMemo(() => String(params.studentId|| ""),                       [params.studentId]);
  const fullName = useMemo(() => String(params.fullName || ""),                       [params.fullName]);
  const password = useMemo(() => String(params.password || ""),                       [params.password]);

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN);
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => { if (prev <= 1) { clearInterval(intervalRef.current!); return 0; } return prev - 1; });
    }, 1000);
  };

  useEffect(() => { startCooldown(); return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; }, []);

  const otp = digits.join("");

  const handleDigitChange = (text: string, index: number) => {
    const clean = text.replace(/[^\d]/g, "").slice(-1);
    const next = [...digits]; next[index] = clean; setDigits(next);
    if (clean && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      const next = [...digits]; next[index - 1] = ""; setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (text: string) => {
    const clean = text.replace(/[^\d]/g, "").slice(0, 6);
    if (clean.length === 6) { setDigits(clean.split("")); Keyboard.dismiss(); }
  };

  const submit = async () => {
    if (!email || !studentId || !fullName || !password) return Alert.alert("Missing data", "Registration data is incomplete. Please start over.");
    if (otp.length !== 6) return Alert.alert("Invalid OTP", "Please enter all 6 digits.");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth-otp/verify-and-register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId, fullName, email, password, otp }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Verification failed");
      if (data.token && data.user) await saveAuth(data.token, data.user.role, data.user.fullName || fullName, data.user.email || email);
      Alert.alert("Welcome to EKEL Sport! 🎉", "Your account has been created successfully!", [{ text: "Get Started", onPress: () => router.replace("/studentHome") }]);
    } catch (e: any) { Alert.alert("Verification Failed", e?.message || "Please try again."); }
    finally { setLoading(false); }
  };

  const resendOtp = async () => {
    if (cooldown > 0) return;
    setResendLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth-otp/send-registration-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId, fullName, email, password }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to resend OTP");
      Alert.alert("OTP Sent ✉️", "A new verification code has been sent to your email.");
      setDigits(["", "", "", "", "", ""]); inputRefs.current[0]?.focus(); startCooldown();
    } catch (e: any) { Alert.alert("Error", e?.message || "Failed to resend OTP"); }
    finally { setResendLoading(false); }
  };

  const allFilled = otp.length === 6;

  return (
    <Screen>
      <AppHeader title="Verify Your Email" subtitle="Enter the 6-digit code we sent you" showBack />
      <AppCard style={{ marginTop: 14 }}>

        {/* Email badge */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.accent + "18", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 18, borderWidth: 1, borderColor: theme.accent + "44" }}>
          <Ionicons name="mail-outline" size={14} color={theme.accent} />
          <Text style={{ color: theme.accent, fontSize: 12.5, fontWeight: "700", flexShrink: 1 }} numberOfLines={1}>{email}</Text>
        </View>

        <Text style={{ color: theme.textSub, fontSize: 12.5, fontWeight: "800", marginBottom: 12 }}>Enter OTP Code</Text>

        {/* OTP Boxes */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
          {digits.map((digit, i) => (
            <TextInput
              key={i} ref={(r) => { inputRefs.current[i] = r; }}
              style={[{ flex: 1, height: 56, borderRadius: 14, borderWidth: 2, borderColor: theme.border, backgroundColor: theme.bgInput, color: theme.text, fontSize: 24, fontWeight: "900", textAlign: "center" },
                digit ? { borderColor: theme.accent, backgroundColor: theme.accent + "18" } : null,
                i === digits.findIndex((d) => !d) ? { borderColor: theme.accent + "88" } : null,
              ]}
              value={digit}
              onChangeText={(t) => { if (t.length > 1) { handlePaste(t); return; } handleDigitChange(t, i); }}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="numeric" maxLength={6} selectTextOnFocus editable={!loading} caretHidden
            />
          ))}
        </View>

        <Text style={{ color: theme.textMuted, fontSize: 12, textAlign: "center", marginBottom: 16 }}>
          ⏱ Code expires in 10 minutes
        </Text>

        {/* Verify button */}
        <Pressable
          style={({ pressed }) => [{ height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: theme.btnPrimary, flexDirection: "row", gap: 8 }, pressed && { opacity: 0.88 }, (!allFilled || loading) && { opacity: 0.45 }]}
          onPress={submit} disabled={!allFilled || loading}
        >
          {loading ? <ActivityIndicator color={theme.btnPrimaryText} /> : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={theme.btnPrimaryText} />
              <Text style={{ color: theme.btnPrimaryText, fontSize: 16, fontWeight: "900" }}>Verify & Create Account</Text>
            </>
          )}
        </Pressable>

        {/* Resend */}
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 16 }}>
          <Text style={{ color: theme.textMuted, fontSize: 13 }}>Didn't receive the code? </Text>
          <Pressable onPress={resendOtp} disabled={cooldown > 0 || resendLoading}>
            {resendLoading ? <ActivityIndicator size="small" color={theme.accent} /> :
              cooldown > 0 ? <Text style={{ color: theme.textSub, fontWeight: "700", fontSize: 13 }}>Resend in {cooldown}s</Text> :
              <Text style={{ color: theme.accent, fontWeight: "700", fontSize: 13, textDecorationLine: "underline" }}>Resend OTP</Text>}
          </Pressable>
        </View>

        <Pressable onPress={() => router.back()} style={{ marginTop: 8, alignSelf: "center" }}>
          <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "600", marginTop: 4 }}>← Change email address</Text>
        </Pressable>
      </AppCard>
    </Screen>
  );
}
