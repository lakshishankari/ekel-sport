import React, { useEffect } from "react";
import { View, Text, ScrollView, Pressable, StatusBar } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import { useAppTheme } from "../lib/themeStore";

type PerformanceCriteria = {
  name: string;
  score: number;
  max: number;
  icon: string;
  color: string;
};

export default function StudentPerformance() {
  const { theme, isDark } = useAppTheme();

  useEffect(() => {
    (async () => {
      const { token, role } = await loadAuth();
      if (!token || role !== "STUDENT") router.replace("/login");
    })();
  }, []);

  const performanceData: PerformanceCriteria[] = [
    { name: "Match Performance", score: 85, max: 100, icon: "basketball",        color: "#C9A227" },
    { name: "Fitness Tests",     score: 78, max: 100, icon: "fitness",           color: "#10B981" },
    { name: "Discipline",        score: 92, max: 100, icon: "ribbon",            color: "#3B82F6" },
    { name: "Attendance",        score: 88, max: 100, icon: "checkmark-circle",  color: "#8B5CF6" },
  ];

  const overallScore = Math.round(
    performanceData.reduce((sum, item) => sum + item.score, 0) / performanceData.length
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#10B981";
    if (score >= 60) return "#C9A227";
    return "#EF4444";
  };

  const scoreColor = getScoreColor(overallScore);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={theme.bg}
      />

      {/* ── Header ── */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: 52, paddingBottom: 16, gap: 12 }}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [{
            width: 40, height: 40, borderRadius: 12,
            alignItems: "center", justifyContent: "center",
            backgroundColor: theme.bgInput,
            borderWidth: 1, borderColor: theme.border,
          }, pressed && { opacity: 0.7 }]}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={22} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.text, fontSize: 24, fontWeight: "900" }}>
            Performance Overview
          </Text>
          <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "600", marginTop: 3 }}>
            Track your scores across all criteria
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
      >

        {/* ── Overall Score Card ── */}
        <View style={{
          backgroundColor: theme.bgCard,
          borderRadius: 20,
          padding: 28,
          alignItems: "center",
          borderWidth: 1,
          borderColor: theme.border,
          marginBottom: 20,
          shadowColor: "#000",
          shadowOpacity: 0.08,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 4 },
          elevation: 3,
        }}>
          {/* Score ring simulation */}
          <View style={{
            width: 96, height: 96, borderRadius: 48,
            backgroundColor: scoreColor + "18",
            borderWidth: 3, borderColor: scoreColor,
            alignItems: "center", justifyContent: "center",
            marginBottom: 14,
          }}>
            <Text style={{ fontSize: 32, fontWeight: "900", color: scoreColor }}>{overallScore}</Text>
          </View>

          <Text style={{ color: theme.textSub, fontSize: 13, fontWeight: "700", marginBottom: 4 }}>
            Overall Performance
          </Text>
          <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 18 }}>out of 100</Text>

          {/* Progress bar */}
          <View style={{ width: "100%", height: 8, backgroundColor: theme.border, borderRadius: 4, overflow: "hidden" }}>
            <View style={{ width: `${overallScore}%` as any, height: "100%", borderRadius: 4, backgroundColor: scoreColor }} />
          </View>

          {/* Score label */}
          <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 6 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: scoreColor }} />
            <Text style={{ color: scoreColor, fontSize: 13, fontWeight: "800" }}>
              {overallScore >= 80 ? "Excellent" : overallScore >= 60 ? "Good" : "Needs Improvement"}
            </Text>
          </View>
        </View>

        {/* ── Section Title ── */}
        <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900", marginBottom: 12 }}>
          Performance Breakdown
        </Text>

        {/* ── Criteria Cards ── */}
        {performanceData.map((item, index) => {
          const pct = Math.round((item.score / item.max) * 100);
          const badgeColor = getScoreColor(pct);
          return (
            <View
              key={index}
              style={{
                backgroundColor: theme.bgCard,
                borderRadius: 16,
                padding: 16,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.border,
                shadowColor: "#000",
                shadowOpacity: 0.05,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              {/* Row: icon + name/score + badge */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                {/* Icon */}
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: item.color + "22", alignItems: "center", justifyContent: "center" }}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>

                {/* Name + score */}
                <View style={{ flex: 1 }}>
                  <Text style={{ color: theme.text, fontSize: 15, fontWeight: "800", marginBottom: 4 }}>
                    {item.name}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4 }}>
                    <Text style={{ fontSize: 22, fontWeight: "900", color: item.color }}>
                      {item.score}
                    </Text>
                    <Text style={{ color: theme.textMuted, fontSize: 13, fontWeight: "600" }}>
                      / {item.max}
                    </Text>
                  </View>
                </View>

                {/* Badge */}
                <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: badgeColor + "22" }}>
                  <Text style={{ fontSize: 14, fontWeight: "900", color: badgeColor }}>{pct}%</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={{ width: "100%", height: 6, backgroundColor: theme.border, borderRadius: 3, marginTop: 14, overflow: "hidden" }}>
                <View style={{ width: `${pct}%` as any, height: "100%", borderRadius: 3, backgroundColor: item.color }} />
              </View>
            </View>
          );
        })}

        {/* ── Eligibility Card ── */}
        <View style={{
          backgroundColor: theme.accent + (isDark ? "18" : "14"),
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: theme.accent + "44",
          marginTop: 4,
        }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: theme.accent + "22", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="trophy" size={22} color={theme.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: theme.text, fontSize: 16, fontWeight: "800" }}>Colours Eligibility</Text>
              <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "600", marginTop: 2 }}>
                Based on your current performance
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border }}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={{ color: "#10B981", fontSize: 15, fontWeight: "800" }}>On Track</Text>
            <Text style={{ color: theme.textMuted, fontSize: 12, marginLeft: 4 }}>
              · You meet the required threshold
            </Text>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}
