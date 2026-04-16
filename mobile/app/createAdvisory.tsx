import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiPost } from "../lib/api";
import { loadAuth } from "../lib/authStore";
import Screen from "../components/Screen";

export default function CreateAdvisory() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onCreate() {
    if (!fullName || !email || !password) {
      Alert.alert("Missing fields", "Please fill all fields");
      return;
    }

    if (password.length < 8) {
      Alert.alert("Weak password", "Password must be at least 8 characters");
      return;
    }

    try {
      setLoading(true);

      const { token } = await loadAuth();
      if (!token) {
        Alert.alert("Unauthorized", "Please login again");
        router.replace("/login");
        return;
      }

      await apiPost(
        "/api/admin/create-advisory",
        { fullName, email, password },
        token
      );

      Alert.alert("Success ✅", "Advisory board account created successfully", [
        { text: "Done", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to create advisory account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={12}
          activeOpacity={0.75}
        >
          <Ionicons name="chevron-back" size={22} color="#F9FAFB" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Create Advisory Account</Text>
          <Text style={styles.headerSub}>Add a new advisory board member</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Info banner ── */}
          <View style={styles.infoBanner}>
            <Ionicons name="shield-checkmark" size={18} color="#C9A227" />
            <Text style={styles.infoText}>
              Advisory board members can review student eligibility, configure
              weightages, and access analytics.
            </Text>
          </View>

          {/* ── Form card ── */}
          <View style={styles.formCard}>
            {/* Full Name */}
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                style={styles.input}
                placeholder="e.g. Dr. Ashan Perera"
                placeholderTextColor="rgba(229,231,235,0.3)"
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            {/* Email */}
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                placeholder="e.g. advisory@kln.ac.lk"
                placeholderTextColor="rgba(229,231,235,0.3)"
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#6B7280" style={styles.inputIcon} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                style={[styles.input, { flex: 1 }]}
                placeholder="Minimum 8 characters"
                placeholderTextColor="rgba(229,231,235,0.3)"
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={onCreate}
              />
              <TouchableOpacity onPress={() => setShowPassword((p) => !p)} hitSlop={8}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.passwordHint}>
              Use a strong password — the member can change it after logging in.
            </Text>
          </View>

          {/* ── Create button ── */}
          <TouchableOpacity
            style={[styles.createBtn, loading && { opacity: 0.65 }]}
            onPress={onCreate}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <>
                <Ionicons name="person-add" size={20} color="#111827" />
                <Text style={styles.createBtnText}>Create Advisory Account</Text>
              </>
            )}
          </TouchableOpacity>

          {/* ── Cancel link ── */}
          <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  headerTitle: {
    color: "#F9FAFB",
    fontSize: 20,
    fontWeight: "900",
  },
  headerSub: {
    color: "rgba(229,231,235,0.45)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  // Scroll
  scroll: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  // Info banner
  infoBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    padding: 14,
    backgroundColor: "rgba(201,162,39,0.07)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.2)",
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    color: "rgba(229,231,235,0.65)",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
  },

  // Form card
  formCard: {
    backgroundColor: "rgba(18,24,38,0.85)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    marginBottom: 20,
  },
  label: {
    color: "rgba(229,231,235,0.7)",
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 8,
    marginTop: 16,
    letterSpacing: 0.3,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(11,15,20,0.6)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
  },
  inputIcon: {
    flexShrink: 0,
  },
  input: {
    flex: 1,
    color: "#F9FAFB",
    fontSize: 14,
    fontWeight: "600",
  },
  passwordHint: {
    color: "rgba(229,231,235,0.35)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 8,
    lineHeight: 16,
  },

  // Create button
  createBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#C9A227",
    marginBottom: 14,
  },
  createBtnText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "900",
  },

  // Cancel
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 10,
  },
  cancelText: {
    color: "rgba(229,231,235,0.4)",
    fontSize: 14,
    fontWeight: "600",
  },
});
