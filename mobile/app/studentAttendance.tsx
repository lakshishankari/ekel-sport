import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";

interface SportAttendance {
  sport_id: number;
  sport_name: string;
  days_attended: number;
  total_sessions?: number;
}

export default function StudentAttendance() {
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<SportAttendance[]>([]);

  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "STUDENT") {
        router.replace("/login");
        return;
      }

      // Simulate loading
      setTimeout(() => {
        // Mock data - replace with actual API call when backend is ready
        setAttendanceData([
          { sport_id: 1, sport_name: "Basketball", days_attended: 12, total_sessions: 15 },
          { sport_id: 2, sport_name: "Football", days_attended: 8, total_sessions: 10 },
          { sport_id: 3, sport_name: "Cricket", days_attended: 5, total_sessions: 8 },
        ]);
        setLoading(false);
      }, 800);
    })();
  }, []);

  const getAttendanceColor = (percentage: number) => {
    if (percentage >= 80) return "#10B981"; // Green
    if (percentage >= 60) return "#F59E0B"; // Orange
    return "#EF4444"; // Red
  };

  const renderAttendanceCard = (sport: SportAttendance) => {
    const percentage = sport.total_sessions
      ? Math.round((sport.days_attended / sport.total_sessions) * 100)
      : 0;
    const color = getAttendanceColor(percentage);

    return (
      <View key={sport.sport_id} style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.sportIcon, { backgroundColor: `${color}20` }]}>
            <Ionicons name="trophy" size={24} color={color} />
          </View>
          <View style={styles.sportInfo}>
            <Text style={styles.sportName}>{sport.sport_name}</Text>
            <Text style={styles.sportSubtext}>Track your attendance</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{sport.days_attended}</Text>
            <Text style={styles.statLabel}>Days Attended</Text>
          </View>

          {sport.total_sessions ? (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{sport.total_sessions}</Text>
                <Text style={styles.statLabel}>Total Sessions</Text>
              </View>

              <View style={styles.statDivider} />
              <View style={styles.statBox}>
                <Text style={[styles.statValue, { color }]}>{percentage}%</Text>
                <Text style={styles.statLabel}>Attendance</Text>
              </View>
            </>
          ) : null}
        </View>

        {sport.total_sessions ? (
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${percentage}%`, backgroundColor: color }
                ]}
              />
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <Screen>
      <AppHeader title="My Attendance" subtitle="Track your sports attendance" />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#C9A227" />
            <Text style={styles.loadingText}>Loading attendance data...</Text>
          </View>
        ) : attendanceData.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#4B5563" />
            <Text style={styles.emptyTitle}>No Attendance Records</Text>
            <Text style={styles.emptyText}>
              Your attendance records will appear here once you start attending sports sessions.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Attendance Summary</Text>
              <Text style={styles.summaryText}>
                You have attended {attendanceData.reduce((sum, s) => sum + s.days_attended, 0)} days across {attendanceData.length} sports
              </Text>
            </View>

            {attendanceData.map(sport => renderAttendanceCard(sport))}
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 12,
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  loadingText: {
    color: "#A7B0BE",
    marginTop: 12,
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "900",
    marginTop: 16,
  },
  emptyText: {
    color: "#A7B0BE",
    textAlign: "center",
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
  },
  summaryCard: {
    backgroundColor: "rgba(201,162,39,0.1)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.3)",
  },
  summaryTitle: {
    color: "#C9A227",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 6,
  },
  summaryText: {
    color: "#D4D4D8",
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    backgroundColor: "#121826",
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#263041",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sportIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sportInfo: {
    marginLeft: 12,
    flex: 1,
  },
  sportName: {
    color: "white",
    fontSize: 18,
    fontWeight: "900",
  },
  sportSubtext: {
    color: "#A7B0BE",
    fontSize: 13,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
  },
  statLabel: {
    color: "#A7B0BE",
    fontSize: 12,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#263041",
  },
  progressBarContainer: {
    marginTop: 4,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#1F2937",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 999,
  },
});

