import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native";
import { router } from "expo-router";

type Student = {
  id: number;
  name: string;
  studentId: string;
  level: "NONE" | "POOL" | "SQUAD";
};

const MOCK_STUDENTS: Student[] = [
  { id: 1, name: "K. Perera", studentId: "IM22001", level: "NONE" },
  { id: 2, name: "S. Fernando", studentId: "IM22015", level: "POOL" },
  { id: 3, name: "N. Silva", studentId: "IM22022", level: "SQUAD" },
];

export default function AdminSquadPool() {
  const [students, setStudents] = useState<Student[]>(MOCK_STUDENTS);

  function updateLevel(id: number, level: "POOL" | "SQUAD") {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, level } : s)));
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Squad & Pool</Text>
      <Text style={styles.sub}>
        Select students into Pool or Squad based on performance and attendance
      </Text>

      <FlatList
        data={students}
        keyExtractor={(i) => String(i.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.sid}>{item.studentId}</Text>
            <Text style={styles.level}>Current: {item.level}</Text>

            <View style={styles.row}>
              <TouchableOpacity style={styles.btn} onPress={() => updateLevel(item.id, "POOL")}>
                <Text style={styles.btnText}>Add to Pool</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.btn} onPress={() => updateLevel(item.id, "SQUAD")}>
                <Text style={styles.btnText}>Add to Squad</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B0F14", padding: 20 },
  title: { color: "white", fontSize: 26, fontWeight: "900", textAlign: "center" },
  sub: { color: "#A7B0BE", textAlign: "center", marginBottom: 16 },

  card: {
    backgroundColor: "#121826",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#263041",
  },
  name: { color: "white", fontSize: 16, fontWeight: "900" },
  sid: { color: "#A7B0BE", marginTop: 2 },
  level: { color: "#D4AF37", marginTop: 6, fontWeight: "700" },

  row: { flexDirection: "row", marginTop: 10 },
  btn: {
    flex: 1,
    backgroundColor: "#1F2937",
    padding: 10,
    borderRadius: 10,
    marginHorizontal: 4,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "800", fontSize: 12 },

  backBtn: { alignSelf: "center", marginTop: 14 },
  backText: { color: "#A7B0BE", textDecorationLine: "underline" },
});
