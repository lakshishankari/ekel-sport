import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { apiPost } from "../lib/api";
import { loadAuth } from "../lib/authStore";

export default function CreateAdvisory() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
        {
          fullName,
          email,
          password,
        },
        token
      );

      Alert.alert("Success", "Advisory account created");
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to create advisory");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Advisory Account</Text>

      <TextInput
        style={styles.input}
        placeholder="Full name"
        placeholderTextColor="#6B7280"
        value={fullName}
        onChangeText={setFullName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#6B7280"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        style={styles.input}
        placeholder="Password (min 8 chars)"
        placeholderTextColor="#6B7280"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity
        style={[styles.btn, loading && { opacity: 0.7 }]}
        onPress={onCreate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.btnText}>Create Advisory</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F14",
    padding: 24,
    justifyContent: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "white",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#263041",
    borderRadius: 12,
    padding: 12,
    color: "white",
    backgroundColor: "#121826",
    marginBottom: 12,
  },
  btn: {
    backgroundColor: "#D4AF37",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: {
    fontWeight: "800",
    fontSize: 16,
    color: "#111827",
  },
  backText: {
    marginTop: 16,
    color: "#A7B0BE",
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
