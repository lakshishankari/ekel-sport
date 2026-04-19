import React from "react";
import { View, TouchableOpacity, Text, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAppTheme } from "../lib/themeStore";

// ── Tab definitions ──────────────────────────────────────────────
// Home, My Sports, Post(center FAB), Performance, Attendance
const TABS = [
  {
    icon:       "home-outline"       as const,
    activeIcon: "home"               as const,
    route:      "/studentHome",
    label:      "Home",
    isCreate:   false,
  },
  {
    icon:       "medal-outline"      as const,
    activeIcon: "medal"              as const,
    route:      "/mySports",
    label:      "My Sports",
    isCreate:   false,
  },
  {
    icon:       "add-circle"         as const,
    activeIcon: "add-circle"         as const,
    route:      "/studentCreatePost",
    label:      "Post",
    isCreate:   true,
  },
  {
    icon:       "trophy-outline"     as const,
    activeIcon: "trophy"             as const,
    route:      "/studentPerformance",
    label:      "Performance",
    isCreate:   false,
  },
  {
    icon:       "calendar-outline"   as const,
    activeIcon: "calendar"           as const,
    route:      "/studentAttendance",
    label:      "Attendance",
    isCreate:   false,
  },
];

type Props = { activeRoute?: string };

export default function StudentBottomNav({ activeRoute }: Props) {
  const { theme } = useAppTheme();

  return (
    <View
      style={{
        flexDirection:    "row",
        backgroundColor:  theme.bgCard,
        borderTopWidth:   1,
        borderTopColor:   theme.border,
        paddingTop:       8,
        paddingBottom:    Platform.OS === "ios" ? 24 : 10,
        // Subtle elevation / shadow for a premium feel
        shadowColor:      "#000",
        shadowOpacity:    0.08,
        shadowRadius:     8,
        shadowOffset:     { width: 0, height: -3 },
        elevation:        8,
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeRoute === tab.route;

        /* ── Centre FAB (Post) ─────────────────────────────────── */
        if (tab.isCreate) {
          return (
            <TouchableOpacity
              key={tab.route}
              onPress={() => router.replace(tab.route as any)}
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
              activeOpacity={0.8}
            >
              <View
                style={{
                  width:            52,
                  height:           52,
                  borderRadius:     26,
                  backgroundColor:  theme.accent,
                  alignItems:       "center",
                  justifyContent:   "center",
                  marginTop:        -26,
                  shadowColor:      theme.accent,
                  shadowOffset:     { width: 0, height: 4 },
                  shadowOpacity:    0.45,
                  shadowRadius:     10,
                  elevation:        10,
                }}
              >
                <Ionicons name="add" size={28} color="#fff" />
              </View>
              <Text
                style={{
                  color:      theme.textSub,
                  fontSize:   10,
                  marginTop:  5,
                  fontWeight: "600",
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        }

        /* ── Regular tab ───────────────────────────────────────── */
        return (
          <TouchableOpacity
            key={tab.route}
            onPress={() => router.replace(tab.route as any)}
            style={{
              flex:           1,
              alignItems:     "center",
              justifyContent: "center",
              paddingVertical: 2,
              position:       "relative",
            }}
            activeOpacity={0.7}
          >
            {/* Active indicator pill at the very top of the nav bar */}
            {isActive && (
              <View
                style={{
                  position:        "absolute",
                  top:             -8,
                  width:           28,
                  height:          3,
                  borderRadius:    2,
                  backgroundColor: theme.accent,
                }}
              />
            )}

            {/* Icon with a subtle active background */}
            <View
              style={{
                width:           36,
                height:          36,
                borderRadius:    10,
                alignItems:      "center",
                justifyContent:  "center",
                backgroundColor: isActive ? theme.accent + "1A" : "transparent",
              }}
            >
              <Ionicons
                name={isActive ? tab.activeIcon : tab.icon}
                size={22}
                color={isActive ? theme.accent : theme.textSub}
              />
            </View>

            <Text
              style={{
                color:      isActive ? theme.accent : theme.textSub,
                fontSize:   10,
                marginTop:  2,
                fontWeight: isActive ? "800" : "500",
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
