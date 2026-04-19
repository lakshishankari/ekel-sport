import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Screen from "../components/Screen";
import { loadAuth } from "../lib/authStore";
import { apiGet } from "../lib/api";
import { useAppTheme, AppTheme } from "../lib/themeStore";

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = "ELIGIBLE" | "NOT_ELIGIBLE" | "BORDERLINE";

type Student = {
  id: string;
  name: string;
  studentId: string;
  sport: string;
  matchScore: number | null;
  fitnessScore: number | null;
  attendance: number | null;
  discipline: number | null;
  sessionsAttended: number;
  totalSessions: number;
  overallScore: number;
  threshold: number;
  status: Status;
  squadLevel: "NONE" | "POOL" | "SQUAD";
};

type Sport = { id: number; name: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusStyle(s: Status): { color: string; bg: string; label: string } {
  if (s === "ELIGIBLE")   return { color: "#10B981", bg: "rgba(16,185,129,0.12)",  label: "Eligible" };
  if (s === "BORDERLINE") return { color: "#F59E0B", bg: "rgba(245,158,11,0.12)", label: "Borderline" };
  return                         { color: "#EF4444", bg: "rgba(239,68,68,0.12)",  label: "Not Eligible" };
}

function squadLabel(level: Student["squadLevel"]) {
  if (level === "SQUAD") return { text: "SQUAD", color: "#C9A227" };
  if (level === "POOL")  return { text: "POOL",  color: "#6366F1" };
  return                        { text: "—",     color: "#6B7280" };
}

/** Format a nullable score: shows "—" when null (no data entered yet) */
function fmt(v: number | null): string {
  return v != null ? String(v) : "—";
}

// ─── Mini score pill ──────────────────────────────────────────────────────────
function ScorePill({ label, value, color, theme }: {
  label: string; value: number | null; color: string; theme: AppTheme;
}) {
  return (
    <View style={{ alignItems: "center", flex: 1 }}>
      <Text style={{ color: theme.textMuted, fontSize: 9, fontWeight: "700", marginBottom: 3 }}>{label}</Text>
      <View style={{ backgroundColor: color + "18", borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3 }}>
        <Text style={{ color, fontSize: 13, fontWeight: "900" }}>{fmt(value)}</Text>
      </View>
    </View>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdvisoryEligibility() {
  const { theme, isDark } = useAppTheme();
  const [sports,          setSports]          = useState<Sport[]>([]);
  const [activeSport,     setActiveSport]     = useState<Sport | null>(null);
  const [students,        setStudents]        = useState<Student[]>([]);
  const [search,          setSearch]          = useState("");
  const [selected,        setSelected]        = useState<Student | null>(null);
  const [loadingSports,   setLoadingSports]   = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [refreshing,      setRefreshing]      = useState(false);
  const [error,           setError]           = useState<string | null>(null);

  const styles = makeStyles(theme);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "ADVISORY") router.replace("/login");
    })();
  }, []);

  // ── Load sports list ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoadingSports(true);
        const data = await apiGet<Sport[]>("/api/advisory/sports");
        setSports(data);
        if (data.length > 0) setActiveSport(data[0]);
      } catch (e: any) {
        setError(e?.message ?? "Could not load sports");
      } finally {
        setLoadingSports(false);
      }
    })();
  }, []);

  // ── Load students for active sport ───────────────────────────────────────
  const loadStudents = useCallback(async (sport: Sport, isRefresh = false) => {
    try {
      if (!isRefresh) setLoadingStudents(true);
      setError(null);
      const data = await apiGet<Student[]>(`/api/advisory/eligibility?sportId=${sport.id}`);
      setStudents(data);
    } catch (e: any) {
      setError(e?.message ?? "Could not load students");
      setStudents([]);
    } finally {
      setLoadingStudents(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (activeSport) { setSearch(""); loadStudents(activeSport); }
  }, [activeSport]);

  const onRefresh = () => {
    if (!activeSport) return;
    setRefreshing(true);
    loadStudents(activeSport, true);
  };

  // ── Filtered list ─────────────────────────────────────────────────────────
  const sportStudents = useMemo(() => {
    if (!search.trim()) return students;
    const q = search.toLowerCase();
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.studentId.toLowerCase().includes(q)
    );
  }, [students, search]);

  const counts = useMemo(() => ({
    total:       students.length,
    eligible:    students.filter((s) => s.status === "ELIGIBLE").length,
    borderline:  students.filter((s) => s.status === "BORDERLINE").length,
    notEligible: students.filter((s) => s.status === "NOT_ELIGIBLE").length,
  }), [students]);

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <Screen style={{ paddingHorizontal: 0, paddingTop: 0 }}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/advisoryHome")} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Student Eligibility</Text>
          <Text style={styles.headerSub}>Colours eligibility by sport</Text>
        </View>
      </View>

      {/* ── Sport tabs (horizontal scroll — NO flex-wrap) ── */}
      {loadingSports ? (
        <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabRow}
        >
          {sports.map((sp) => (
            <Pressable
              key={sp.id}
              onPress={() => { setActiveSport(sp); setSearch(""); }}
              style={[styles.tab, activeSport?.id === sp.id && styles.tabActive]}
            >
              <Text
                style={[styles.tabText, activeSport?.id === sp.id && styles.tabTextActive]}
                numberOfLines={1}
              >
                {sp.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* ── Summary strip ── */}
      <View style={styles.summaryRow}>
        {[
          { label: "Total",        value: counts.total,       color: theme.text },
          { label: "Eligible",     value: counts.eligible,    color: "#10B981" },
          { label: "Borderline",   value: counts.borderline,  color: "#F59E0B" },
          { label: "Not Eligible", value: counts.notEligible, color: "#EF4444" },
        ].map((item) => (
          <View key={item.label} style={styles.summaryCard}>
            <Text style={[styles.summaryValue, { color: item.color }]}>{item.value}</Text>
            <Text style={styles.summaryLabel}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* ── Search ── */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={16} color={theme.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or ID"
          placeholderTextColor={theme.textMuted}
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} hitSlop={8}>
            <Ionicons name="close" size={16} color={theme.textMuted} />
          </Pressable>
        )}
      </View>

      {/* ── Student list ── */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.accent}
            colors={[theme.accent]}
          />
        }
      >
        {/* Loading */}
        {loadingStudents && !refreshing && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={theme.accent} />
            <Text style={styles.centerText}>Loading students…</Text>
          </View>
        )}

        {/* Error */}
        {!loadingStudents && error && (
          <View style={styles.centerBox}>
            <Ionicons name="wifi-outline" size={36} color="#EF4444" />
            <Text style={[styles.centerText, { color: "#EF4444", marginTop: 8 }]}>{error}</Text>
            <Pressable
              style={styles.retryBtn}
              onPress={() => activeSport && loadStudents(activeSport)}
            >
              <Text style={styles.retryText}>Retry</Text>
            </Pressable>
          </View>
        )}

        {/* Empty */}
        {!loadingStudents && !error && sportStudents.length === 0 && (
          <View style={styles.centerBox}>
            <Ionicons name="people-outline" size={40} color={theme.textMuted} />
            <Text style={styles.emptyText}>
              {search.trim()
                ? "No students match your search"
                : `No approved students in ${activeSport?.name ?? "this sport"} yet`}
            </Text>
          </View>
        )}

        {/* List items */}
        {!loadingStudents && !error &&
          sportStudents.map((student) => {
            const st  = statusStyle(student.status);
            const sql = squadLabel(student.squadLevel);
            return (
              <Pressable
                key={student.id}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.82 }]}
                onPress={() => setSelected(student)}
              >
                {/* Top row: name + status */}
                <View style={styles.cardTop}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {student.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName} numberOfLines={1}>{student.name}</Text>
                    <Text style={styles.cardId}>{student.studentId || "—"}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                      <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                    </View>
                    <Text style={[styles.squadTag, { color: sql.color }]}>{sql.text}</Text>
                  </View>
                </View>

                {/* Bottom row: 4 score pills + overall */}
                <View style={styles.cardScoresRow}>
                  <ScorePill label="Match" value={student.matchScore} color="#C9A227" theme={theme} />
                  <ScorePill label="Fitness" value={student.fitnessScore} color="#10B981" theme={theme} />
                  <ScorePill label="Discipline" value={student.discipline} color="#3B82F6" theme={theme} />
                  <ScorePill label="Attendance" value={student.attendance} color="#8B5CF6" theme={theme} />
                  <View style={{ alignItems: "center", flex: 1 }}>
                    <Text style={{ color: theme.textMuted, fontSize: 9, fontWeight: "700", marginBottom: 3 }}>Overall</Text>
                    <Text style={{ color: st.color, fontSize: 14, fontWeight: "900" }}>{student.overallScore}%</Text>
                  </View>
                </View>

                {/* Attendance sessions note */}
                {student.totalSessions > 0 && (
                  <Text style={styles.sessionNote}>
                    📅 {student.sessionsAttended}/{student.totalSessions} sessions attended
                  </Text>
                )}
              </Pressable>
            );
          })
        }

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* ── Detail Sheet ── */}
      <Modal
        visible={!!selected}
        transparent
        animationType="slide"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelected(null)} />
          {selected && (() => {
            const st  = statusStyle(selected.status);
            const sql = squadLabel(selected.squadLevel);
            return (
              <View style={styles.sheet}>
                <View style={styles.sheetHandle} />

                {/* Name row */}
                <View style={styles.sheetNameRow}>
                  <View style={styles.sheetAvatar}>
                    <Text style={styles.sheetAvatarText}>
                      {selected.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetName}>{selected.name}</Text>
                    <Text style={styles.sheetId}>{selected.studentId || "—"}</Text>
                    <Text style={[styles.sheetId, { color: sql.color, marginTop: 2 }]}>
                      {sql.text !== "—" ? `Squad Level: ${sql.text}` : "Not assigned to squad"}
                    </Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                    <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>

                {/* Hero score */}
                <View style={styles.heroCard}>
                  <Text style={styles.heroLabel}>Weighted Eligibility Score</Text>
                  <Text style={[styles.heroScore, { color: st.color }]}>{selected.overallScore}%</Text>
                  <Text style={styles.heroMeta}>
                    {activeSport?.name} · Threshold {selected.threshold}%
                  </Text>
                  {/* Score bar */}
                  <View style={styles.heroBg}>
                    <View
                      style={[
                        styles.heroFill,
                        { width: `${Math.min(selected.overallScore, 100)}%` as any, backgroundColor: st.color },
                      ]}
                    />
                    <View style={[styles.thresholdLine, { left: `${selected.threshold}%` as any }]} />
                  </View>
                  <Text style={styles.thresholdNote}>▲ Threshold at {selected.threshold}%</Text>
                </View>

                {/* Score Breakdown table */}
                <Text style={styles.breakdownTitle}>Score Breakdown</Text>
                <View style={styles.breakdownTable}>
                  {[
                    { label: "Match Performance", value: selected.matchScore,   weight: 40,  color: "#C9A227" },
                    { label: "Fitness Tests",      value: selected.fitnessScore, weight: 25,  color: "#10B981" },
                    { label: "Discipline",         value: selected.discipline,   weight: 15,  color: "#3B82F6" },
                    { label: "Attendance",         value: selected.attendance,   weight: 20,  color: "#8B5CF6" },
                  ].map((row, i, arr) => (
                    <View
                      key={row.label}
                      style={[styles.bRow, i < arr.length - 1 && styles.bRowBorder]}
                    >
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: row.color, marginRight: 8 }} />
                      <Text style={styles.bLabel}>{row.label}</Text>
                      <Text style={styles.bWeight}>{row.weight}%</Text>
                      <Text style={[styles.bScore, { color: row.value != null ? theme.text : theme.textMuted }]}>
                        {fmt(row.value)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Attendance sessions */}
                {selected.totalSessions > 0 && (
                  <View style={styles.sessionCard}>
                    <Ionicons name="calendar-outline" size={16} color="#8B5CF6" />
                    <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "600", flex: 1 }}>
                      Sessions attended: <Text style={{ color: theme.text, fontWeight: "800" }}>
                        {selected.sessionsAttended} / {selected.totalSessions}
                      </Text>
                    </Text>
                    <Text style={{ color: "#8B5CF6", fontSize: 14, fontWeight: "900" }}>
                      {selected.attendance != null ? `${selected.attendance}%` : "—"}
                    </Text>
                  </View>
                )}

                <Pressable style={styles.closeBtn} onPress={() => setSelected(null)}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </Pressable>
              </View>
            );
          })()}
        </View>
      </Modal>
    </Screen>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const makeStyles = (theme: AppTheme) => StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: { padding: 2 },
  headerTitle: { color: theme.text, fontSize: 20, fontWeight: "900" },
  headerSub:   { color: theme.textMuted, fontSize: 12, fontWeight: "600", marginTop: 2 },

  // Horizontal tab row — must keep flexDirection: "row" so items lay out side-by-side.
  // alignItems: "center" is removed from the container; each tab self-centres its text.
  tabRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: theme.bgInput,
    borderWidth: 1,
    borderColor: theme.border,
  },
  tabActive: {
    backgroundColor: theme.accent + "2E",
    borderColor: theme.accent,
  },
  tabText:       { color: theme.textSub, fontSize: 13, fontWeight: "700" },
  tabTextActive: { color: theme.accent,  fontSize: 13, fontWeight: "800" },

  summaryRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: theme.bgCard,
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.border,
  },
  summaryValue: { fontSize: 18, fontWeight: "900" },
  summaryLabel: { color: theme.textMuted, fontSize: 9, fontWeight: "700", marginTop: 3, textAlign: "center" },

  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: theme.bgCard,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: theme.border,
  },
  searchInput: { flex: 1, color: theme.text, fontSize: 14, fontWeight: "500" },

  list: { paddingHorizontal: 20 },
  centerBox: { alignItems: "center", paddingTop: 60, gap: 10, paddingHorizontal: 20 },
  centerText: { color: theme.textMuted, fontSize: 14, fontWeight: "600", textAlign: "center" },
  emptyText:  { color: theme.textSub, fontSize: 14, fontWeight: "600", textAlign: "center", marginTop: 8, lineHeight: 20 },
  retryBtn: {
    marginTop: 12,
    backgroundColor: theme.accent + "26",
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.accent + "4D",
  },
  retryText: { color: theme.accent, fontSize: 14, fontWeight: "800" },

  card: {
    backgroundColor: theme.bgCard,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 10,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardScoresRow: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, borderTopColor: theme.border, paddingTop: 10, gap: 4 },
  sessionNote: { color: theme.textMuted, fontSize: 10, fontWeight: "600", marginTop: 2 },

  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.accent + "1F",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: theme.accent + "40",
  },
  avatarText: { color: theme.accent, fontSize: 13, fontWeight: "800" },
  cardName:   { color: theme.text, fontSize: 14, fontWeight: "700" },
  cardId:     { color: theme.textMuted, fontSize: 11, fontWeight: "600", marginTop: 2 },

  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "700" },
  squadTag:   { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },

  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    backgroundColor: theme.bgCard,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 22,
    paddingBottom: 40,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: theme.border,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.border,
    alignSelf: "center",
    marginBottom: 18,
  },
  sheetNameRow:    { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 18 },
  sheetAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: theme.accent + "1F",
    borderWidth: 1.5,
    borderColor: theme.accent + "4D",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetAvatarText: { color: theme.accent, fontSize: 15, fontWeight: "900" },
  sheetName:       { color: theme.text, fontSize: 16, fontWeight: "800" },
  sheetId:         { color: theme.textMuted, fontSize: 12, fontWeight: "600", marginTop: 2 },

  heroCard: {
    backgroundColor: theme.bgInput,
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginBottom: 18,
    borderWidth: 1,
    borderColor: theme.border,
    gap: 4,
  },
  heroLabel: { color: theme.textMuted, fontSize: 11, fontWeight: "700" },
  heroScore: { fontSize: 48, fontWeight: "900", marginTop: 2 },
  heroMeta:  { color: theme.textMuted, fontSize: 12, fontWeight: "600", marginBottom: 10 },
  heroBg: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.border,
    overflow: "visible",
    position: "relative",
    marginTop: 4,
  },
  heroFill:      { height: 8, borderRadius: 4, position: "absolute", left: 0, top: 0 },
  thresholdLine: {
    position: "absolute",
    top: -5,
    width: 2,
    height: 18,
    backgroundColor: "rgba(239,68,68,0.7)",
    borderRadius: 1,
  },
  thresholdNote: { color: "rgba(239,68,68,0.55)", fontSize: 10, fontWeight: "700", marginTop: 8, alignSelf: "flex-start" },

  breakdownTitle: { color: theme.text, fontSize: 14, fontWeight: "800", marginBottom: 10 },
  breakdownTable: {
    backgroundColor: theme.bgInput,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.border,
    overflow: "hidden",
    marginBottom: 14,
  },
  bRow:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12 },
  bRowBorder: { borderBottomWidth: 1, borderBottomColor: theme.border },
  bLabel:  { flex: 1, color: theme.textSub, fontSize: 13, fontWeight: "600" },
  bWeight: { color: theme.textMuted, fontSize: 12, fontWeight: "700", width: 36, textAlign: "right" },
  bScore:  { fontSize: 14, fontWeight: "900", width: 36, textAlign: "right" },

  sessionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#8B5CF615",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#8B5CF630",
  },

  closeBtn: {
    backgroundColor: theme.btnPrimary,
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { color: theme.btnPrimaryText, fontSize: 15, fontWeight: "900" },
});
