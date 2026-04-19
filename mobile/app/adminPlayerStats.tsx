import React from "react";
import {
  View, Text, TouchableOpacity, ScrollView,
  StatusBar, Dimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAppTheme } from "../lib/themeStore";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";

const { width } = Dimensions.get("window");

// ─── Sub-category cards ───────────────────────────────────────────
const STAT_CATEGORIES = [
  {
    key:      "match",
    title:    "Match Performance",
    subtitle: "Record scores & results from games and tournaments",
    icon:     "trophy" as const,
    route:    "/adminMatchPerformance",
    accent:   "#D4AF37",
    bg:       "rgba(212,175,55,0.10)",
    border:   "rgba(212,175,55,0.25)",
    tag:      "MATCH",
    tagColor: "#D4AF37",
  },
  {
    key:      "fitness",
    title:    "Fitness Tests",
    subtitle: "Log beep tests, sprint times, push-ups and endurance scores",
    icon:     "barbell" as const,
    route:    "/adminFitnessPerformance",
    accent:   "#10B981",
    bg:       "rgba(16,185,129,0.10)",
    border:   "rgba(16,185,129,0.25)",
    tag:      "FITNESS",
    tagColor: "#10B981",
  },
  {
    key:      "discipline",
    title:    "Discipline",
    subtitle: "Track conduct, warnings, and behavioural scores",
    icon:     "shield-checkmark" as const,
    route:    "/adminDisciplinePerformance",
    accent:   "#6366F1",
    bg:       "rgba(99,102,241,0.10)",
    border:   "rgba(99,102,241,0.25)",
    tag:      "DISCIPLINE",
    tagColor: "#6366F1",
  },
];

// ─── Component ───────────────────────────────────────────────────
export default function AdminPlayerStats() {
  const { theme, isDark } = useAppTheme();

  return (
    <Screen>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <AppHeader
        title="Player Stats"
        subtitle="Select a category to record student scores"
        showBack
                backRoute="/adminHome"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, paddingBottom: 40 }}
      >
        {/* ── Intro banner ── */}
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 12,
          padding: 14, borderRadius: 16, marginBottom: 20,
          backgroundColor: "rgba(212,175,55,0.08)",
          borderWidth: 1, borderColor: "rgba(212,175,55,0.2)",
        }}>
          <View style={{
            width: 42, height: 42, borderRadius: 13,
            backgroundColor: "rgba(212,175,55,0.15)",
            alignItems: "center", justifyContent: "center",
          }}>
            <Ionicons name="stats-chart" size={22} color="#D4AF37" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: theme.text, fontSize: 14, fontWeight: "900" }}>
              Performance Tracking
            </Text>
            <Text style={{ color: theme.textSub, fontSize: 12, fontWeight: "600", marginTop: 2, lineHeight: 17 }}>
              All scores are recorded on a 0–100 scale and feed into the squad eligibility formula.
            </Text>
          </View>
        </View>

        {/* ── Category cards ── */}
        {STAT_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.key}
            activeOpacity={0.82}
            onPress={() => router.push(cat.route as any)}
            style={{
              marginBottom: 14,
              borderRadius: 22,
              borderWidth: 1,
              backgroundColor: theme.bgCard,
              borderColor: theme.border,
              overflow: "hidden",
            }}
          >
            {/* Colour accent strip at top */}
            <View style={{ height: 4, backgroundColor: cat.accent, width: "100%" }} />

            <View style={{ padding: 18 }}>
              {/* Header row */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 12 }}>
                {/* Icon bubble */}
                <View style={{
                  width: 54, height: 54, borderRadius: 16,
                  backgroundColor: cat.bg,
                  borderWidth: 1, borderColor: cat.border,
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Ionicons name={cat.icon} size={26} color={cat.accent} />
                </View>

                <View style={{ flex: 1 }}>
                  {/* Tag pill */}
                  <View style={{
                    alignSelf: "flex-start",
                    paddingHorizontal: 8, paddingVertical: 2,
                    borderRadius: 6, marginBottom: 5,
                    backgroundColor: cat.bg,
                    borderWidth: 1, borderColor: cat.border,
                  }}>
                    <Text style={{ color: cat.tagColor, fontSize: 9, fontWeight: "900", letterSpacing: 1 }}>
                      {cat.tag}
                    </Text>
                  </View>

                  <Text style={{ color: theme.text, fontSize: 17, fontWeight: "900", lineHeight: 22 }}>
                    {cat.title}
                  </Text>
                </View>

                {/* Arrow */}
                <View style={{
                  width: 34, height: 34, borderRadius: 10,
                  backgroundColor: cat.bg,
                  borderWidth: 1, borderColor: cat.border,
                  alignItems: "center", justifyContent: "center",
                }}>
                  <Ionicons name="arrow-forward" size={18} color={cat.accent} />
                </View>
              </View>

              {/* Subtitle */}
              <Text style={{
                color: theme.textSub, fontSize: 13,
                fontWeight: "600", lineHeight: 19,
              }}>
                {cat.subtitle}
              </Text>

              {/* Bottom info row */}
              <View style={{
                flexDirection: "row", alignItems: "center", gap: 16,
                marginTop: 14, paddingTop: 12,
                borderTopWidth: 1, borderTopColor: theme.border,
              }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Ionicons name="people-outline" size={13} color={theme.textMuted} />
                  <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: "600" }}>
                    All approved students
                  </Text>
                </View>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                  <Ionicons name="speedometer-outline" size={13} color={theme.textMuted} />
                  <Text style={{ color: theme.textMuted, fontSize: 12, fontWeight: "600" }}>
                    Score: 0 – 100
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* ── Tip ── */}
        <View style={{
          flexDirection: "row", alignItems: "flex-start", gap: 10,
          padding: 14, borderRadius: 14,
          backgroundColor: "rgba(99,102,241,0.06)",
          borderWidth: 1, borderColor: "rgba(99,102,241,0.18)",
        }}>
          <Ionicons name="bulb-outline" size={18} color="#6366F1" />
          <Text style={{ flex: 1, color: theme.textSub, fontSize: 12, fontWeight: "600", lineHeight: 18 }}>
            <Text style={{ color: theme.text, fontWeight: "800" }}>Tip: </Text>
            Scores from all three categories are combined with attendance to calculate each student's overall eligibility for the squad.
          </Text>
        </View>
      </ScrollView>
    </Screen>
  );
}
