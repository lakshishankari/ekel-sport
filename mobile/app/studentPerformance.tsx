import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import Screen from "../components/Screen";

type PerformanceCriteria = {
  name: string;
  score: number;
  max: number;
  icon: string;
  color: string;
};

export default function StudentPerformance() {
  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "STUDENT") router.replace("/login");
    })();
  }, []);

  // Mock performance data
  const performanceData: PerformanceCriteria[] = [
    { name: "Match Performance", score: 85, max: 100, icon: "basketball", color: "#C9A227" },
    { name: "Fitness Tests", score: 78, max: 100, icon: "fitness", color: "#10B981" },
    { name: "Discipline", score: 92, max: 100, icon: "ribbon", color: "#3B82F6" },
    { name: "Attendance", score: 88, max: 100, icon: "checkmark-circle", color: "#8B5CF6" },
  ];

  const overallScore = Math.round(
    performanceData.reduce((sum, item) => sum + item.score, 0) / performanceData.length
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10B981";
    if (score >= 60) return "#C9A227";
    return "#EF4444";
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#F9FAFB" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Performance Overview</Text>
          <Text style={styles.headerSubtitle}>
            Track your scores across all criteria
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        {/* Overall Score */}
        <View style={styles.overallCard}>
          <Text style={styles.overallLabel}>Overall Performance</Text>
          <Text style={[styles.overallScore, { color: getScoreColor(overallScore) }]}>
            {overallScore}
          </Text>
          <Text style={styles.overallMax}>out of 100</Text>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${overallScore}%`, backgroundColor: getScoreColor(overallScore) }]} />
          </View>
        </View>

        {/* Individual Criteria */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance Breakdown</Text>

          {performanceData.map((item, index) => (
            <View key={index} style={styles.criteriaCard}>
              <View style={styles.criteriaHeader}>
                <View style={[styles.iconContainer, { backgroundColor: `${item.color}20` }]}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.criteriaName}>{item.name}</Text>
                  <View style={styles.scoreRow}>
                    <Text style={[styles.criteriaScore, { color: item.color }]}>
                      {item.score}
                    </Text>
                    <Text style={styles.criteriaMax}>/ {item.max}</Text>
                  </View>
                </View>
                <View style={[styles.percentBadge, { backgroundColor: `${getScoreColor((item.score / item.max) * 100)}20` }]}>
                  <Text style={[styles.percentText, { color: getScoreColor((item.score / item.max) * 100) }]}>
                    {Math.round((item.score / item.max) * 100)}%
                  </Text>
                </View>
              </View>

              <View style={styles.miniProgressBar}>
                <View
                  style={[
                    styles.miniProgressFill,
                    {
                      width: `${(item.score / item.max) * 100}%`,
                      backgroundColor: item.color
                    }
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Eligibility Status */}
        <View style={styles.eligibilityCard}>
          <View style={styles.eligibilityHeader}>
            <Ionicons name="trophy" size={24} color="#C9A227" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.eligibilityTitle}>Colours Eligibility</Text>
              <Text style={styles.eligibilityDesc}>
                Based on your current performance
              </Text>
            </View>
          </View>
          <View style={styles.eligibilityStatus}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.eligibilityText}>On Track</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    color: "#F9FAFB",
    fontSize: 24,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "rgba(229,231,235,0.6)",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  overallCard: {
    marginTop: 20,
    backgroundColor: "rgba(18, 24, 38, 0.8)",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  overallLabel: {
    color: "rgba(229,231,235,0.7)",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  overallScore: {
    fontSize: 56,
    fontWeight: "900",
  },
  overallMax: {
    color: "#A7B0BE",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 4,
  },
  progressBar: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 4,
    marginTop: 16,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    color: "#F9FAFB",
    fontSize: 17,
    fontWeight: "900",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  criteriaCard: {
    backgroundColor: "rgba(18, 24, 38, 0.8)",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  criteriaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  criteriaName: {
    color: "#F9FAFB",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 4,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  criteriaScore: {
    fontSize: 20,
    fontWeight: "900",
  },
  criteriaMax: {
    color: "#A7B0BE",
    fontSize: 14,
    fontWeight: "600",
  },
  percentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  percentText: {
    fontSize: 14,
    fontWeight: "900",
  },
  miniProgressBar: {
    width: "100%",
    height: 6,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 3,
    marginTop: 12,
    overflow: "hidden",
  },
  miniProgressFill: {
    height: "100%",
    borderRadius: 3,
  },
  eligibilityCard: {
    marginTop: 12,
    backgroundColor: "rgba(201,162,39,0.1)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.3)",
  },
  eligibilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  eligibilityTitle: {
    color: "#F9FAFB",
    fontSize: 16,
    fontWeight: "800",
  },
  eligibilityDesc: {
    color: "rgba(229,231,235,0.7)",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  eligibilityStatus: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  eligibilityText: {
    color: "#10B981",
    fontSize: 15,
    fontWeight: "800",
  },
});
