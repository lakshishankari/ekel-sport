import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import { apiGet, apiPost } from "../lib/api";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";

// ─── Types ───────────────────────────────────────────────────────────────────
type Sport = { id: number; name: string };

type SquadLevel = "NONE" | "POOL" | "SQUAD";

type StudentStat = {
  student_user_id: number;
  full_name: string;
  student_id: string;
  squad_level: SquadLevel;
  attendance_count: number;
  performance_count: number;
  avg_score: number | null;
  match_entries: number;
  fitness_entries: number;
  discipline_entries: number;
  in_team: number; // 0 or 1
};

// ─── Level config ─────────────────────────────────────────────────────────────
const LEVELS: { key: SquadLevel; label: string; color: string; bg: string }[] = [
  { key: "NONE",  label: "None",  color: "#6B7280", bg: "rgba(107,114,128,0.15)" },
  { key: "POOL",  label: "Pool",  color: "#60A5FA", bg: "rgba(96,165,250,0.15)"  },
  { key: "SQUAD", label: "Squad", color: "#D4AF37", bg: "rgba(212,175,55,0.18)"  },
];

function levelConfig(key: SquadLevel) {
  return LEVELS.find((l) => l.key === key) ?? LEVELS[0];
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function AdminSquadPool() {
  // Auth guard
  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "ADMIN") router.replace("/login");
    })();
  }, []);

  const [sports, setSports] = useState<Sport[]>([]);
  const [sportId, setSportId] = useState<number | null>(null);
  const [students, setStudents] = useState<StudentStat[]>([]);

  const [loadingSports, setLoadingSports] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Per-student saving state: studentUserId → "level" | "team" | null
  const [saving, setSaving] = useState<Record<number, "level" | "team" | null>>({});

  // ── Load sports on mount ──────────────────────────────────────────────────
  useEffect(() => {
    fetchSports();
  }, []);

  async function fetchSports() {
    try {
      setLoadingSports(true);
      const data = await apiGet<Sport[]>("/api/admin/squad-pool/sports");
      setSports(data);
      if (data.length > 0) {
        setSportId(data[0].id);
      }
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load sports");
    } finally {
      setLoadingSports(false);
    }
  }

  // ── Load students when sport changes ─────────────────────────────────────
  useEffect(() => {
    if (sportId !== null) {
      fetchStudents(sportId);
    }
  }, [sportId]);

  async function fetchStudents(sid: number, pullRefresh = false) {
    try {
      if (pullRefresh) setRefreshing(true);
      else setLoadingStudents(true);

      const data = await apiGet<StudentStat[]>(`/api/admin/squad-pool/${sid}`);
      setStudents(data);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to load students");
    } finally {
      setLoadingStudents(false);
      setRefreshing(false);
    }
  }

  const onRefresh = useCallback(() => {
    if (sportId !== null) fetchStudents(sportId, true);
  }, [sportId]);

  // ── Update squad level ────────────────────────────────────────────────────
  async function setLevel(student: StudentStat, level: SquadLevel) {
    if (saving[student.student_user_id]) return;

    // Optimistic update
    setStudents((prev) =>
      prev.map((s) =>
        s.student_user_id === student.student_user_id ? { ...s, squad_level: level } : s
      )
    );
    setSaving((p) => ({ ...p, [student.student_user_id]: "level" }));

    try {
      await apiPost(
        `/api/admin/squad-pool/${sportId}/${student.student_user_id}/level`,
        { level }
      );
    } catch (e: any) {
      // Revert on failure
      setStudents((prev) =>
        prev.map((s) =>
          s.student_user_id === student.student_user_id
            ? { ...s, squad_level: student.squad_level }
            : s
        )
      );
      Alert.alert("Failed", e.message || "Could not update level");
    } finally {
      setSaving((p) => ({ ...p, [student.student_user_id]: null }));
    }
  }

  // ── Toggle team ────────────────────────────────────────────────────────────
  async function toggleTeam(student: StudentStat) {
    if (saving[student.student_user_id]) return;

    const nextInTeam = student.in_team === 0 ? 1 : 0;

    // Optimistic update
    setStudents((prev) =>
      prev.map((s) =>
        s.student_user_id === student.student_user_id ? { ...s, in_team: nextInTeam } : s
      )
    );
    setSaving((p) => ({ ...p, [student.student_user_id]: "team" }));

    try {
      await apiPost(
        `/api/admin/squad-pool/${sportId}/${student.student_user_id}/team`,
        { inTeam: nextInTeam === 1 }
      );
    } catch (e: any) {
      // Revert
      setStudents((prev) =>
        prev.map((s) =>
          s.student_user_id === student.student_user_id
            ? { ...s, in_team: student.in_team }
            : s
        )
      );
      Alert.alert("Failed", e.message || "Could not update team");
    } finally {
      setSaving((p) => ({ ...p, [student.student_user_id]: null }));
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <Screen>
      <AppHeader
        title="Squad & Pool"
        subtitle="Select sport → assign levels & team"
        showBack
      />

      {/* Sport picker */}
      {loadingSports ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#D4AF37" size="large" />
        </View>
      ) : sports.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="football-outline" size={44} color="#374151" />
          <Text style={styles.emptyTitle}>No Sports Available</Text>
          <Text style={styles.emptySub}>
            Approve student enrollments first before managing Squad & Pool.
          </Text>
        </View>
      ) : (
        <>
          {/* ── Sport chips ── */}
          <View style={styles.chipSection}>
            <Text style={styles.sectionLabel}>SELECT SPORT</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.sportChips}
            >
              {sports.map((s) => {
                const active = s.id === sportId;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.sportChip, active && styles.sportChipActive]}
                    onPress={() => setSportId(s.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.sportChipText, active && styles.sportChipTextActive]}>
                      {s.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Legend ── */}
          <View style={styles.legend}>
            {LEVELS.map((l) => (
              <View key={l.key} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: l.color }]} />
                <Text style={styles.legendText}>{l.label}</Text>
              </View>
            ))}
            <View style={styles.legendItem}>
              <Ionicons name="shield-checkmark" size={12} color="#34D399" />
              <Text style={styles.legendText}>Team</Text>
            </View>
          </View>

          {/* ── Student list ── */}
          {loadingStudents ? (
            <View style={styles.centered}>
              <ActivityIndicator color="#D4AF37" size="large" />
              <Text style={styles.loadingText}>Loading students…</Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  tintColor="#D4AF37"
                  colors={["#D4AF37"]}
                />
              }
            >
              {students.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={44} color="#374151" />
                  <Text style={styles.emptyTitle}>No Students Found</Text>
                  <Text style={styles.emptySub}>
                    No approved students for this sport yet.
                  </Text>
                </View>
              ) : (
                students.map((student) => {
                  const lc = levelConfig(student.squad_level ?? "NONE");
                  const isSaving = saving[student.student_user_id];
                  const inTeam = student.in_team === 1;

                  return (
                    <View key={student.student_user_id} style={styles.card}>
                      {/* ── Card header ── */}
                      <View style={styles.cardHeader}>
                        <View style={styles.avatarCircle}>
                          <Text style={styles.avatarText}>
                            {student.full_name?.charAt(0)?.toUpperCase() ?? "?"}
                          </Text>
                        </View>

                        <View style={{ flex: 1 }}>
                          <View style={styles.nameRow}>
                            <Text style={styles.studentName} numberOfLines={1}>
                              {student.full_name}
                            </Text>
                            {inTeam && (
                              <View style={styles.teamBadge}>
                                <Ionicons name="shield-checkmark" size={10} color="#34D399" />
                                <Text style={styles.teamBadgeText}>TEAM</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.studentId}>{student.student_id}</Text>
                        </View>

                        {/* Current level badge */}
                        <View style={[styles.levelBadge, { backgroundColor: lc.bg, borderColor: lc.color }]}>
                          <Text style={[styles.levelBadgeText, { color: lc.color }]}>
                            {lc.label}
                          </Text>
                        </View>
                      </View>

                      {/* ── Performance stats ── */}
                      <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                          <Ionicons name="calendar-outline" size={13} color="#60A5FA" />
                          <Text style={styles.statValue}>{student.attendance_count ?? 0}</Text>
                          <Text style={styles.statLabel}>Sessions</Text>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statItem}>
                          <Ionicons name="star-outline" size={13} color="#F59E0B" />
                          <Text style={styles.statValue}>
                            {student.avg_score != null ? student.avg_score : "—"}
                          </Text>
                          <Text style={styles.statLabel}>Avg Score</Text>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statItem}>
                          <Ionicons name="trophy-outline" size={13} color="#D4AF37" />
                          <Text style={styles.statValue}>{student.match_entries ?? 0}</Text>
                          <Text style={styles.statLabel}>Matches</Text>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statItem}>
                          <Ionicons name="barbell-outline" size={13} color="#A78BFA" />
                          <Text style={styles.statValue}>{student.fitness_entries ?? 0}</Text>
                          <Text style={styles.statLabel}>Fitness</Text>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statItem}>
                          <Ionicons name="shield-outline" size={13} color="#34D399" />
                          <Text style={styles.statValue}>{student.discipline_entries ?? 0}</Text>
                          <Text style={styles.statLabel}>Discipline</Text>
                        </View>
                      </View>

                      {/* ── Level selectors ── */}
                      <View style={styles.actionsSection}>
                        <Text style={styles.actionLabel}>ASSIGN LEVEL</Text>
                        <View style={styles.levelBtns}>
                          {LEVELS.map((l) => {
                            const active = (student.squad_level ?? "NONE") === l.key;
                            return (
                              <TouchableOpacity
                                key={l.key}
                                style={[
                                  styles.levelBtn,
                                  active && {
                                    backgroundColor: l.bg,
                                    borderColor: l.color,
                                  },
                                ]}
                                onPress={() => setLevel(student, l.key)}
                                disabled={!!isSaving}
                                activeOpacity={0.75}
                              >
                                {isSaving === "level" && active ? (
                                  <ActivityIndicator size={12} color={l.color} />
                                ) : (
                                  <Text
                                    style={[
                                      styles.levelBtnText,
                                      active && { color: l.color },
                                    ]}
                                  >
                                    {l.label}
                                  </Text>
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      {/* ── Team toggle ── */}
                      <TouchableOpacity
                        style={[styles.teamBtn, inTeam && styles.teamBtnActive]}
                        onPress={() => toggleTeam(student)}
                        disabled={!!isSaving}
                        activeOpacity={0.8}
                      >
                        {isSaving === "team" ? (
                          <ActivityIndicator size={14} color={inTeam ? "#111827" : "#34D399"} />
                        ) : (
                          <>
                            <Ionicons
                              name={inTeam ? "shield-checkmark" : "shield-outline"}
                              size={15}
                              color={inTeam ? "#111827" : "#34D399"}
                            />
                            <Text style={[styles.teamBtnText, inTeam && styles.teamBtnTextActive]}>
                              {inTeam ? "In Team — Tap to Remove" : "Add to Team"}
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}

              <View style={{ height: 30 }} />
            </ScrollView>
          )}
        </>
      )}
    </Screen>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 60,
  },
  loadingText: {
    color: "#6B7280",
    fontWeight: "700",
    fontSize: 13,
  },

  // Sport picker
  chipSection: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 4,
  },
  sectionLabel: {
    color: "#4B5563",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  sportChips: {
    gap: 8,
    paddingBottom: 4,
  },
  sportChip: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },
  sportChipActive: {
    backgroundColor: "rgba(212,175,55,0.18)",
    borderColor: "#D4AF37",
  },
  sportChipText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "800",
  },
  sportChipTextActive: {
    color: "#D4AF37",
  },

  // Legend
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    color: "#6B7280",
    fontSize: 11,
    fontWeight: "700",
  },

  // Student list
  listContent: {
    padding: 14,
    gap: 14,
  },

  // Card
  card: {
    backgroundColor: "#0F1724",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#D4AF37",
    fontSize: 18,
    fontWeight: "900",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  studentName: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "900",
    flexShrink: 1,
  },
  studentId: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  teamBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(52,211,153,0.12)",
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.3)",
  },
  teamBadgeText: {
    color: "#34D399",
    fontSize: 9,
    fontWeight: "900",
    letterSpacing: 0.8,
  },

  // current level badge (top right of card)
  levelBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 12,
    alignItems: "center",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: 3,
    flex: 1,
  },
  statValue: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "900",
  },
  statLabel: {
    color: "#4B5563",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  // Level action buttons
  actionsSection: {
    gap: 8,
  },
  actionLabel: {
    color: "#4B5563",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  levelBtns: {
    flexDirection: "row",
    gap: 8,
  },
  levelBtn: {
    flex: 1,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  levelBtnText: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "800",
  },

  // Team button
  teamBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.3)",
    backgroundColor: "rgba(52,211,153,0.05)",
  },
  teamBtnActive: {
    backgroundColor: "#34D399",
    borderColor: "#34D399",
  },
  teamBtnText: {
    color: "#34D399",
    fontSize: 13,
    fontWeight: "900",
  },
  teamBtnTextActive: {
    color: "#111827",
  },

  // Empty states
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 70,
    paddingHorizontal: 30,
    gap: 12,
  },
  emptyTitle: {
    color: "#D1D5DB",
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },
  emptySub: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
});
