import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiPost } from "../lib/api";
import { loadAuth } from "../lib/authStore";
import Screen from "../components/Screen";
import { useAppTheme } from "../lib/themeStore";

export default function CreateAdvisory() {
  const { theme } = useAppTheme();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onCreate() {
    if (!fullName || !email || !password) { Alert.alert("Missing fields", "Please fill all fields"); return; }
    if (password.length < 8) { Alert.alert("Weak password", "Password must be at least 8 characters"); return; }
    try {
      setLoading(true);
      const { token } = await loadAuth();
      if (!token) { Alert.alert("Unauthorized", "Please login again"); router.replace("/login"); return; }
      await apiPost("/api/admin/create-advisory", { fullName, email, password }, token);
      Alert.alert("Success ✅", "Advisory board account created successfully", [{ text: "Done", onPress: () => router.back() }]);
    } catch (e: any) { Alert.alert("Error", e?.message || "Failed to create advisory account"); }
    finally { setLoading(false); }
  }

  const inputWrap = { flexDirection: "row" as const, alignItems: "center" as const, backgroundColor: theme.bgInput, borderRadius: 12, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, height: 48, gap: 10 };
  const labelStyle = { color: theme.textSub, fontSize: 12, fontWeight: "800" as const, marginBottom: 8, marginTop: 16, letterSpacing: 0.3 };

  return (
    <Screen>
      {/* Header */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingBottom: 12, gap: 12 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border }} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 20, fontWeight: "900" }}>Create Advisory Account</Text>
          <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: "600", marginTop: 2 }}>Add a new advisory board member</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">

          {/* Info banner */}
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14, backgroundColor: theme.accent + "12", borderRadius: 14, borderWidth: 1, borderColor: theme.accent + "33", marginBottom: 20 }}>
            <Ionicons name="shield-checkmark" size={18} color={theme.accent} />
            <Text style={{ flex: 1, color: theme.textSub, fontSize: 12, fontWeight: "600", lineHeight: 18 }}>
              Advisory board members can review student eligibility, configure weightages, and access analytics.
            </Text>
          </View>

          {/* Form card */}
          <View style={{ backgroundColor: theme.bgCard, borderRadius: 18, padding: 18, borderWidth: 1, borderColor: theme.border, marginBottom: 20 }}>

            <Text style={labelStyle}>Full Name</Text>
            <View style={inputWrap}>
              <Ionicons name="person-outline" size={18} color={theme.textMuted} />
              <TextInput value={fullName} onChangeText={setFullName} style={{ flex: 1, color: theme.text, fontSize: 14, fontWeight: "600" }} placeholder="e.g. Dr. Ashan Perera" placeholderTextColor={theme.textMuted} autoCapitalize="words" returnKeyType="next" />
            </View>

            <Text style={labelStyle}>Email Address</Text>
            <View style={inputWrap}>
              <Ionicons name="mail-outline" size={18} color={theme.textMuted} />
              <TextInput value={email} onChangeText={setEmail} style={{ flex: 1, color: theme.text, fontSize: 14, fontWeight: "600" }} placeholder="e.g. advisory@kln.ac.lk" placeholderTextColor={theme.textMuted} autoCapitalize="none" keyboardType="email-address" returnKeyType="next" />
            </View>

            <Text style={labelStyle}>Password</Text>
            <View style={inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={theme.textMuted} />
              <TextInput value={password} onChangeText={setPassword} style={{ flex: 1, color: theme.text, fontSize: 14, fontWeight: "600" }} placeholder="Minimum 8 characters" placeholderTextColor={theme.textMuted} secureTextEntry={!showPassword} returnKeyType="done" onSubmitEditing={onCreate} />
              <TouchableOpacity onPress={() => setShowPassword((p) => !p)} hitSlop={8}>
                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={{ color: theme.textMuted, fontSize: 11, fontWeight: "600", marginTop: 8, lineHeight: 16 }}>
              Use a strong password — the member can change it after logging in.
            </Text>
          </View>

          {/* Create button */}
          <TouchableOpacity
            style={[{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 54, borderRadius: 16, backgroundColor: theme.btnPrimary, marginBottom: 14 }, loading && { opacity: 0.65 }]}
            onPress={onCreate} disabled={loading} activeOpacity={0.85}
          >
            {loading ? <ActivityIndicator color={theme.btnPrimaryText} /> : (
              <>
                <Ionicons name="person-add" size={20} color={theme.btnPrimaryText} />
                <Text style={{ color: theme.btnPrimaryText, fontSize: 16, fontWeight: "900" }}>Create Advisory Account</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={{ alignItems: "center", paddingVertical: 10 }} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={{ color: theme.textMuted, fontSize: 14, fontWeight: "600" }}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
