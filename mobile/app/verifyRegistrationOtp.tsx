import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ActivityIndicator } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";
import { API_BASE_URL } from "../lib/config";
import { saveAuth } from "../lib/authStore";

export default function VerifyRegistrationOtp() {
    const params = useLocalSearchParams();
    const email = useMemo(() => String(params.email || "").trim().toLowerCase(), [params.email]);
    const studentId = useMemo(() => String(params.studentId || ""), [params.studentId]);
    const fullName = useMemo(() => String(params.fullName || ""), [params.fullName]);
    const password = useMemo(() => String(params.password || ""), [params.password]);

    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async () => {
        if (!email || !studentId || !fullName || !password) {
            return Alert.alert("Missing data", "Registration data is incomplete. Please start over.");
        }

        if (otp.trim().length !== 6) {
            return Alert.alert("Invalid OTP", "OTP must be 6 digits.");
        }

        setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth-otp/verify-and-register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentId,
                    fullName,
                    email,
                    password,
                    otp: otp.trim(),
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || "Verification failed");

            // Save token and user data using authStore for consistency
            if (data.token && data.user) {
                await saveAuth(data.token, data.user.role);
            }

            Alert.alert("Success! 🎉", "Your account has been created successfully!", [
                {
                    text: "OK",
                    onPress: () => {
                        // Navigate to student home
                        router.replace("/studentHome");
                    },
                },
            ]);
        } catch (e: any) {
            Alert.alert("Verification Failed", e?.message || "Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const resendOtp = async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/auth-otp/send-registration-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ studentId, fullName, email, password }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data?.message || "Failed to resend OTP");

            Alert.alert("OTP Sent", "A new OTP has been sent to your email.");
        } catch (e: any) {
            Alert.alert("Error", e?.message || "Failed to resend OTP");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Screen>
            <AppHeader
                title="Verify Your Email"
                subtitle={`Enter the 6-digit OTP sent to ${email}`}
                showBack
            />

            <AppCard style={{ marginTop: 14 }}>
                <Text style={styles.label}>OTP Code</Text>
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
                        editable={!loading}
                    />
                </View>

                <Pressable
                    style={({ pressed }) => [
                        styles.btn,
                        pressed && { opacity: 0.85 },
                        loading && { opacity: 0.6 }
                    ]}
                    onPress={submit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#111827" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle" size={20} color="#111827" />
                            <Text style={styles.btnText}>Verify & Complete Registration</Text>
                        </>
                    )}
                </Pressable>

                <Pressable
                    onPress={resendOtp}
                    style={{ marginTop: 12, alignSelf: "center" }}
                    disabled={loading}
                >
                    <Text style={styles.link}>Didn't receive the code? Resend OTP</Text>
                </Pressable>

                <Pressable
                    onPress={() => router.back()}
                    style={{ marginTop: 8, alignSelf: "center" }}
                >
                    <Text style={styles.link}>Change email address</Text>
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
        flexDirection: "row",
        gap: 8,
    },
    btnText: { color: "#111827", fontSize: 16, fontWeight: "900" },
    link: { color: "#A7B0BE", textDecorationLine: "underline", fontWeight: "700", fontSize: 13 },
});
