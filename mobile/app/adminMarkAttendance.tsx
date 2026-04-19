import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Pressable,
  ActivityIndicator, Alert, RefreshControl,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../lib/themeStore";
import { apiGet, apiPost } from "../lib/api";
import { loadAuth } from "../lib/authStore";

// ─── Types ────────────────────────────────────────────────────
type StudentEntry = {
  student_user_id: number;
  full_name: string;
  student_id: string;
  squad_level: string;
  status: "PRESENT" | "ABSENT" | "NOT_MARKED";
};

type StatusMap = Record<number, "PRESENT" | "ABSENT" | "NOT_MARKED">;

type SquadLevel = "NONE" | "POOL" | "SQUAD";
const LEVEL_CFG: Record<SquadLevel, { color: string; bg: string }> = {
  NONE:  { color: "#6B7280", bg: "rgba(107,114,128,0.15)" },
  POOL:  { color: "#60A5FA", bg: "rgba(96,165,250,0.15)"  },
  SQUAD: { color: "#D4AF37", bg: "rgba(212,175,55,0.18)"  },
};
function levelCfg(lvl: string) {
  return LEVEL_CFG[(lvl as SquadLevel)] ?? LEVEL_CFG.NONE;
}

function formatDate(d: string) {
  try {
    return new Date(d).toLocaleDateString("en-GB", {
      weekday: "short", day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return d; }
}

// ─── Main Component ──────────────────────────────────────────
export default function AdminMarkAttendance() {
  const { theme } = useAppTheme();
  const params = useLocalSearchParams<{
    sessionId: string;
    sport: string;
    location: string;
    sessionDate: string;
    sessionName?: string;
  }>();

  const sessionId   = Number(params.sessionId);
  const sport       = params.sport       || "Session";
  const location    = params.location    || "—";
  const sessionDate = params.sessionDate || "—";
  const sessionName = params.sessionName || "";

  const [students, setStudents]     = useState<StudentEntry[]>([]);
  const [statusMap, setStatusMap]   = useState<StatusMap>({});
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch enrolled students with their current status
  const fetchStudents = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await apiGet<StudentEntry[]>(
        `/api/admin/attendance/sessions/${sessionId}/enrolled`
      );
      setStudents(data);
      // Pre-populate status map from existing records
      const map: StatusMap = {};
      data.forEach((s) => {
        map[s.student_user_id] = s.status;
      });
      setStatusMap(map);
    } catch {
      Alert.alert("Error", "Failed to load students. Pull to refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [sessionId]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  // ── Toggle a single student's status
  function toggleStatus(studentId: number) {
    setStatusMap((prev) => {
      const cur = prev[studentId] ?? "NOT_MARKED";
      const next =
        cur === "NOT_MARKED" ? "PRESENT" :
        cur === "PRESENT"    ? "ABSENT"  :
        "PRESENT";
      return { ...prev, [studentId]: next };
    });
  }

  // ── Bulk mark all
  function markAll(status: "PRESENT" | "ABSENT") {
    setStatusMap((prev) => {
      const next = { ...prev };
      students.forEach((s) => { next[s.student_user_id] = status; });
      return next;
    });
  }

  // ── Save attendance
  async function handleSave() {
    const entries = students
      .map((s) => ({ studentUserId: s.student_user_id, status: statusMap[s.student_user_id] ?? "NOT_MARKED" }))
      .filter((e) => e.status !== "NOT_MARKED");

    if (entries.length === 0) {
      Alert.alert("Nothing to save", "Please mark at least one student as Present or Absent.");
      return;
    }

    setSaving(true);
    try {
      const { token } = await loadAuth();
      await apiPost(
        `/api/admin/attendance/sessions/${sessionId}/mark`,
        { entries },
        token!
      );
      Alert.alert("✅ Saved", `Attendance saved for ${entries.length} student(s).`, [
        { text: "Done", onPress: () => router.replace("/adminAttendanceList") },
        { text: "Keep Editing", style: "cancel" },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to save. Try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Stats
  const presentCount   = students.filter((s) => (statusMap[s.student_user_id] ?? s.status) === "PRESENT").length;
  const absentCount    = students.filter((s) => (statusMap[s.student_user_id] ?? s.status) === "ABSENT").length;
  const notMarkedCount = students.filter((s) => {
    const st = statusMap[s.student_user_id] ?? s.status;
    return st === "NOT_MARKED";
  }).length;

  return (
    <Screen>
      <AppHeader
        title="Mark Attendance"
        subtitle={`${sport} · ${formatDate(sessionDate)}`}
        showBack
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 14 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchStudents(true)}
            tintColor="#D4AF37"
            colors={["#D4AF37"]}
          />
        }
      >
        {/* ── Session info card ── */}
        <View style={{
          marginTop: 14, borderRadius: 16, borderWidth: 1,
          backgroundColor: theme.bgCard, borderColor: "rgba(212,175,55,0.3)",
          padding: 14, gap: 6,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="calendar-outline" size={15} color="#D4AF37" />
            <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "600" }}>
              {formatDate(sessionDate)}
              {sessionName ? `  ·  ${sessionName}` : ""}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="location-outline" size={15} color="#D4AF37" />
            <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "600" }}>{location}</Text>
          </View>
        </View>

        {/* ── Stats strip ── */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          {[
            { label: "Present",    count: presentCount,   color: "#10B981" },
            { label: "Absent",     count: absentCount,    color: "#EF4444" },
            { label: "Not Marked", count: notMarkedCount, color: "#6B7280" },
          ].map((s) => (
            <View key={s.label} style={{
              flex: 1, backgroundColor: s.color + "15", borderRadius: 12,
              borderWidth: 1, borderColor: s.color + "44", padding: 10, alignItems: "center",
            }}>
              <Text style={{ color: s.color, fontSize: 20, fontWeight: "900" }}>{s.count}</Text>
              <Text style={{ color: theme.textSub, fontSize: 10, fontWeight: "700", marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Bulk mark buttons ── */}
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          <TouchableOpacity
            style={{
              flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
              gap: 6, paddingVertical: 11, borderRadius: 12,
              backgroundColor: "#10B98118", borderWidth: 1, borderColor: "#10B98144",
            }}
            onPress={() => markAll("PRESENT")}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
            <Text style={{ color: "#10B981", fontWeight: "800", fontSize: 13 }}>All Present</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
              gap: 6, paddingVertical: 11, borderRadius: 12,
              backgroundColor: "#EF444418", borderWidth: 1, borderColor: "#EF444444",
            }}
            onPress={() => markAll("ABSENT")}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
            <Text style={{ color: "#EF4444", fontWeight: "800", fontSize: 13 }}>All Absent</Text>
          </TouchableOpacity>
        </View>

        {/* ── Student list heading ── */}
        <Text style={{
          color: theme.textSub, fontSize: 11, fontWeight: "900",
          letterSpacing: 1, marginTop: 18, marginBottom: 8,
        }}>
          ENROLLED STUDENTS ({students.length})
        </Text>

        {/* ── Loading / empty / list ── */}
        {loading ? (
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 10 }}>
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text style={{ color: theme.textSub, fontSize: 14, fontWeight: "600" }}>
              Loading students…
            </Text>
          </View>
        ) : students.length === 0 ? (
          <View style={{ alignItems: "center", paddingVertical: 40, gap: 10 }}>
            <Ionicons name="people-outline" size={48} color={theme.border} />
            <Text style={{ color: theme.text, fontSize: 15, fontWeight: "800" }}>No enrolled students</Text>
            <Text style={{ color: theme.textSub, fontSize: 13, textAlign: "center" }}>
              No approved students found for this sport.
            </Text>
          </View>
        ) : (
          students.map((student) => {
            const currentStatus = statusMap[student.student_user_id] ?? "NOT_MARKED";
            const lc = levelCfg(student.squad_level);
            const isPresent    = currentStatus === "PRESENT";
            const isAbsent     = currentStatus === "ABSENT";
            const isNotMarked  = currentStatus === "NOT_MARKED";
            const initials     = student.full_name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

            return (
              <View
                key={student.student_user_id}
                style={{
                  flexDirection: "row", alignItems: "center", gap: 12,
                  backgroundColor: theme.bgCard,
                  borderRadius: 14, padding: 12, marginBottom: 8,
                  borderWidth: 1,
                  borderColor: isPresent ? "#10B98144" : isAbsent ? "#EF444444" : theme.border,
                }}
              >
                {/* Avatar */}
                <View style={{
                  width: 40, height: 40, borderRadius: 12,
                  backgroundColor: isPresent ? "#10B98122" : isAbsent ? "#EF444422" : "rgba(212,175,55,0.15)",
                  borderWidth: 1,
                  borderColor: isPresent ? "#10B98144" : isAbsent ? "#EF444444" : "rgba(212,175,55,0.25)",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Text style={{
                    color: isPresent ? "#10B981" : isAbsent ? "#EF4444" : "#D4AF37",
                    fontSize: 15, fontWeight: "900",
                  }}>
                    {initials}
                  </Text>
                </View>

                {/* Info */}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 14, fontWeight: "800" }} numberOfLines={1}>
                    {student.full_name}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: "600" }}>
                      {student.student_id}
                    </Text>
                    <View style={{
                      paddingHorizontal: 6, paddingVertical: 1,
                      borderRadius: 6, backgroundColor: lc.bg, borderWidth: 1, borderColor: lc.color,
                    }}>
                      <Text style={{ color: lc.color, fontSize: 9, fontWeight: "800" }}>
                        {student.squad_level || "NONE"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Present / Absent toggles */}
                <View style={{ flexDirection: "row", gap: 6 }}>
                  <TouchableOpacity
                    onPress={() => setStatusMap((prev) => ({ ...prev, [student.student_user_id]: "PRESENT" }))}
                    style={{
                      width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center",
                      backgroundColor: isPresent ? "#10B981" : "#10B98115",
                      borderWidth: 1, borderColor: isPresent ? "#10B981" : "#10B98133",
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="checkmark" size={18} color={isPresent ? "white" : "#10B981"} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setStatusMap((prev) => ({ ...prev, [student.student_user_id]: "ABSENT" }))}
                    style={{
                      width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center",
                      backgroundColor: isAbsent ? "#EF4444" : "#EF444415",
                      borderWidth: 1, borderColor: isAbsent ? "#EF4444" : "#EF444433",
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={18} color={isAbsent ? "white" : "#EF4444"} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ── Sticky Save button ── */}
      {!loading && students.length > 0 && (
        <View style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          backgroundColor: theme.bgCard,
          borderTopWidth: 1, borderTopColor: theme.border,
          padding: 16, paddingBottom: 28,
        }}>
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [{
              height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center",
              backgroundColor: "#D4AF37", flexDirection: "row", gap: 10,
            }, (pressed || saving) && { opacity: 0.8 }]}
          >
            {saving ? (
              <ActivityIndicator color="#111827" />
            ) : (
              <>
                <Ionicons name="save-outline" size={20} color="#111827" />
                <Text style={{ color: "#111827", fontSize: 16, fontWeight: "900" }}>
                  Save Attendance ({students.filter(s => (statusMap[s.student_user_id] ?? s.status) !== "NOT_MARKED").length} marked)
                </Text>
              </>
            )}
          </Pressable>
        </View>
      )}
    </Screen>
  );
}
