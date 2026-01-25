import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { apiGet } from "../lib/api";
import { loadAuth } from "../lib/authStore";

type User = {
  id: number;
  role: string;
  student_id: string | null;
  full_name: string;
  email: string;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const { token } = await loadAuth();
      if (!token) {
        Alert.alert("Unauthorized", "Please login again");
        router.replace("/login");
        return;
      }

      const data = await apiGet<User[]>("/api/admin/users", token);
      setUsers(data);
    } catch (err: any) {
      Alert.alert("Error", err.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>All Users</Text>

      <FlatList
        data={users}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.full_name}</Text>
            <Text style={styles.text}>{item.email}</Text>
            <Text style={styles.role}>{item.role}</Text>
          </View>
        )}
      />

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F14",
    padding: 20,
  },
  center: {
    flex: 1,
    backgroundColor: "#0B0F14",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "900",
    color: "white",
    marginBottom: 16,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#121826",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#263041",
  },
  name: {
    color: "white",
    fontSize: 16,
    fontWeight: "800",
  },
  text: {
    color: "#A7B0BE",
    marginTop: 4,
  },
  role: {
    marginTop: 6,
    color: "#D4AF37",
    fontWeight: "700",
  },
  backBtn: {
    marginTop: 10,
    alignSelf: "center",
  },
  backText: {
    color: "#A7B0BE",
    textDecorationLine: "underline",
  },
});
