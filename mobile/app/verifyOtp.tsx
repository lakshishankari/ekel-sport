import React, { useMemo, useState, useEffect, useRef } from "react";
import { View, Text, TextInput, Pressable, Alert, ActivityIndicator, Keyboard } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";
import { API_BASE_URL } from "../lib/config";
import { useAppTheme } from "../lib/themeStore";

const RESEND_COOLDOWN = 60;

export default function VerifyOtp() {
  const { theme } = useAppTheme();
  const params = useLocalSearchParams();
  const email = useMemo(() => String(params.email || "").trim().toLowerCase(), [params.email]);

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

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

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
    if (!email) return Alert.alert("Missing email", "Go back and enter email again.");
    if (otp.length !== 6) return Alert.alert("Invalid OTP", "Please enter all 6 digits.");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Verification failed");
      const resetToken = data?.reset_token;
      if (!resetToken) throw new Error("Missing reset token");
      router.push({ pathname: "/resetPassword", params: { email, reset_token: resetToken } });
    } catch (e: any) { Alert.alert("Error", e?.message || "Something went wrong"); }
    finally { setLoading(false); }
  };

  const resendOtp = async () => {
    if (cooldown > 0) return;
    setResendLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/resend-otp`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to resend OTP");
      Alert.alert("OTP Sent", "A new OTP has been sent to your email.");
      setDigits(["", "", "", "", "", ""]); inputRefs.current[0]?.focus(); startCooldown();
    } catch (e: any) { Alert.alert("Error", e?.message || "Failed to resend OTP"); }
    finally { setResendLoading(false); }
  };

  const allFilled = otp.length === 6;

  return (
    <Screen>
      <AppHeader title="Verify OTP" subtitle="Enter the 6-digit code sent to" showBack />
      <AppCard style={{ marginTop: 14 }}>
        {/* Email badge */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: theme.accent + "18", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 18, borderWidth: 1, borderColor: theme.accent + "44" }}>
          <Ionicons name="mail-outline" size={14} color={theme.accent} />
          <Text style={{ color: theme.accent, fontSize: 12.5, fontWeight: "700", flexShrink: 1 }} numberOfLines={1}>{email}</Text>
        </View>

        <Text style={{ color: theme.textSub, fontSize: 12.5, fontWeight: "800", marginBottom: 12 }}>Enter OTP Code</Text>

        {/* OTP boxes */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 20 }}>
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

        {/* Verify button */}
        <Pressable
          style={({ pressed }) => [{ height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: theme.btnPrimary, flexDirection: "row", gap: 8 }, pressed && { opacity: 0.88 }, (!allFilled || loading) && { opacity: 0.45 }]}
          onPress={submit} disabled={!allFilled || loading}
        >
          {loading ? <ActivityIndicator color={theme.btnPrimaryText} /> : (
            <>
              <Ionicons name="checkmark-circle" size={20} color={theme.btnPrimaryText} />
              <Text style={{ color: theme.btnPrimaryText, fontSize: 16, fontWeight: "900" }}>Verify OTP</Text>
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
      </AppCard>
    </Screen>
  );
}
