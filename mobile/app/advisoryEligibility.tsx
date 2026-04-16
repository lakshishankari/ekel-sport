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

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = "ELIGIBLE" | "NOT_ELIGIBLE" | "BORDERLINE";

type Student = {
  id: string;
  name: string;
  studentId: string;
  department: string;
  sport: string;
  matchScore: number;
  fitnessScore: number;
  attendance: number;
  discipline: number;
  overallScore: number;
  threshold: number;
  status: Status;
  squadLevel: "NONE" | "POOL" | "SQUAD";
};

type Sport = { id: number; name: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function statusStyle(s: Status): { color: string; bg: string; label: string } {
  if (s === "ELIGIBLE")   return { color: "#10B981", bg: "rgba(16,185,129,0.1)",  label: "Eligible" };
  if (s === "BORDERLINE") return { color: "#F59E0B", bg: "rgba(245,158,11,0.1)", label: "Borderline" };
  return                         { color: "#EF4444", bg: "rgba(239,68,68,0.1)",  label: "Not Eligible" };
}

function squadLabel(level: Student["squadLevel"]) {
  if (level === "SQUAD") return { text: "SQUAD", color: "#C9A227" };
  if (level === "POOL")  return { text: "POOL",  color: "#6366F1" };
  return                        { text: "—",     color: "#6B7280" };
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function AdvisoryEligibility() {
  const [sports,       setSports]       = useState<Sport[]>([]);
  const [activeSport,  setActiveSport]  = useState<Sport | null>(null);
  const [students,     setStudents]     = useState<Student[]>([]);
  const [search,       setSearch]       = useState("");
  const [selected,     setSelected]     = useState<Student | null>(null);
  const [loadingSports, setLoadingSports] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);

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
    if (activeSport) {
      setSearch("");
      loadStudents(activeSport);
    }
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
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q)
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
    <Screen>

      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#F9FAFB" />
        </Pressable>
        <View>
          <Text style={styles.headerTitle}>Student Eligibility</Text>
          <Text style={styles.headerSub}>Colors eligibility by sport</Text>
        </View>
      </View>

      {/* ── Sport tabs (dynamic) ── */}
      {loadingSports ? (
        <View style={{ paddingHorizontal: 20, paddingBottom: 10 }}>
          <ActivityIndicator color="#C9A227" />
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
              <Text style={[styles.tabText, activeSport?.id === sp.id && styles.tabTextActive]}>
                {sp.name}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* ── Summary strip ── */}
      <View style={styles.summaryRow}>
        {[
          { label: "Total",        value: counts.total,       color: "#F9FAFB" },
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
        <Ionicons name="search-outline" size={16} color="#6B7280" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name or ID"
          placeholderTextColor="#4B5563"
          style={styles.searchInput}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} hitSlop={8}>
            <Ionicons name="close" size={16} color="#6B7280" />
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
            tintColor="#C9A227"
            colors={["#C9A227"]}
          />
        }
      >
        {/* Loading */}
        {loadingStudents && !refreshing && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#C9A227" />
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
            <Ionicons name="people-outline" size={40} color="#374151" />
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
                {/* Left: name + ID + dept */}
                <View style={styles.cardLeft}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>
                      {student.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{student.name}</Text>
                    <Text style={styles.cardId}>{student.studentId || "—"}</Text>
                    {student.department && student.department !== "—" && (
                      <Text style={styles.cardDept}>{student.department}</Text>
                    )}
                  </View>
                </View>

                {/* Right: status + squad + score */}
                <View style={styles.cardRight}>
                  <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                    <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                  </View>
                  <Text style={[styles.squadTag, { color: sql.color }]}>{sql.text}</Text>
                  <Text style={styles.scoreText}>{student.overallScore}%</Text>
                </View>
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
                    {selected.department && selected.department !== "—" && (
                      <Text style={styles.sheetDept}>{selected.department}</Text>
                    )}
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
                    {activeSport?.name} · Threshold {selected.threshold}% ·{" "}
                    <Text style={{ color: sql.color }}>{sql.text}</Text>
                  </Text>
                  {/* Score bar */}
                  <View style={styles.heroBg}>
                    <View
                      style={[
                        styles.heroFill,
                        { width: `${selected.overallScore}%` as any, backgroundColor: st.color },
                      ]}
                    />
                    <View style={[styles.thresholdLine, { left: `${selected.threshold}%` as any }]} />
                  </View>
                  <Text style={styles.thresholdNote}>▲ Threshold at {selected.threshold}%</Text>
                </View>

                {/* Breakdown table */}
                <Text style={styles.breakdownTitle}>Score Breakdown</Text>
                <View style={styles.breakdownTable}>
                  {[
                    { label: "Match Performance", value: selected.matchScore,   weight: 40 },
                    { label: "Fitness Tests",      value: selected.fitnessScore, weight: 25 },
                    { label: "Attendance",         value: selected.attendance,   weight: 20 },
                    { label: "Discipline",         value: selected.discipline,   weight: 15 },
                  ].map((row, i, arr) => (
                    <View
                      key={row.label}
                      style={[styles.bRow, i < arr.length - 1 && styles.bRowBorder]}
                    >
                      <Text style={styles.bLabel}>{row.label}</Text>
                      <Text style={styles.bWeight}>{row.weight}%</Text>
                      <Text style={styles.bScore}>{row.value}</Text>
                    </View>
                  ))}
                </View>

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
const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backBtn: { padding: 2 },
  headerTitle: { color: "#F9FAFB", fontSize: 20, fontWeight: "900" },
  headerSub:   { color: "rgba(229,231,235,0.45)", fontSize: 12, fontWeight: "600", marginTop: 2 },

  // Sport tabs (horizontal scroll)
  tabRow: {
    paddingHorizontal: 20,
    gap: 8,
    paddingBottom: 16,
    flexDirection: "row",
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  tabActive: {
    backgroundColor: "rgba(201,162,39,0.18)",
    borderColor: "#C9A227",
  },
  tabText:       { color: "#D1D5DB", fontSize: 13, fontWeight: "700" },
  tabTextActive: { color: "#C9A227", fontSize: 13, fontWeight: "800" },

  // Summary
  summaryRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "rgba(18,24,38,0.85)",
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  summaryValue: { fontSize: 18, fontWeight: "900" },
  summaryLabel: { color: "rgba(229,231,235,0.4)", fontSize: 9, fontWeight: "700", marginTop: 3, textAlign: "center" },

  // Search
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 14,
    backgroundColor: "rgba(18,24,38,0.85)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  searchInput: { flex: 1, color: "#F9FAFB", fontSize: 14, fontWeight: "500" },

  // List
  list: { paddingHorizontal: 20 },
  centerBox: {
    alignItems: "center",
    paddingTop: 60,
    gap: 10,
    paddingHorizontal: 20,
  },
  centerText: {
    color: "rgba(229,231,235,0.4)",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyText: {
    color: "#4B5563",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  retryBtn: {
    marginTop: 12,
    backgroundColor: "rgba(201,162,39,0.15)",
    borderRadius: 10,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.3)",
  },
  retryText: { color: "#C9A227", fontSize: 14, fontWeight: "800" },

  // Card
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(18,24,38,0.85)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 12,
  },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(201,162,39,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.25)",
  },
  avatarText: { color: "#C9A227", fontSize: 13, fontWeight: "800" },
  cardName:   { color: "#F9FAFB", fontSize: 14, fontWeight: "700" },
  cardId:     { color: "#6B7280", fontSize: 11, fontWeight: "600", marginTop: 2 },
  cardDept:   { color: "rgba(229,231,235,0.35)", fontSize: 10, fontWeight: "600", marginTop: 1 },

  cardRight: { alignItems: "flex-end", gap: 6 },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  squadTag:   { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  scoreText:  { color: "#F9FAFB", fontSize: 15, fontWeight: "900" },

  // Modal
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    backgroundColor: "#0F1623",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 22,
    paddingBottom: 40,
    paddingTop: 14,
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignSelf: "center",
    marginBottom: 18,
  },
  sheetNameRow: { flexDirection: "row", alignItems: "flex-start", gap: 14, marginBottom: 18 },
  sheetAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(201,162,39,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(201,162,39,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetAvatarText: { color: "#C9A227", fontSize: 15, fontWeight: "900" },
  sheetName: { color: "#F9FAFB", fontSize: 16, fontWeight: "800" },
  sheetId:   { color: "#6B7280", fontSize: 12, fontWeight: "600", marginTop: 2 },
  sheetDept: { color: "rgba(229,231,235,0.35)", fontSize: 11, fontWeight: "600", marginTop: 2 },

  // Hero score
  heroCard: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 4,
  },
  heroLabel: { color: "rgba(229,231,235,0.45)", fontSize: 11, fontWeight: "700" },
  heroScore: { fontSize: 48, fontWeight: "900", marginTop: 2 },
  heroMeta:  { color: "rgba(229,231,235,0.45)", fontSize: 12, fontWeight: "600", marginBottom: 10 },
  heroBg: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.07)",
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

  // Breakdown
  breakdownTitle: { color: "#F9FAFB", fontSize: 14, fontWeight: "800", marginBottom: 10 },
  breakdownTable: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    marginBottom: 18,
  },
  bRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  bRowBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  bLabel:  { flex: 1, color: "#D1D5DB", fontSize: 13, fontWeight: "600" },
  bWeight: { color: "#6B7280", fontSize: 12, fontWeight: "700", width: 36, textAlign: "right" },
  bScore:  { color: "#F9FAFB", fontSize: 14, fontWeight: "900", width: 36, textAlign: "right" },

  // Close
  closeBtn: {
    backgroundColor: "#C9A227",
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtnText: { color: "#0B0F14", fontSize: 15, fontWeight: "900" },
});
