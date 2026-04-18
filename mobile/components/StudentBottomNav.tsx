import React from "react";
import { View, TouchableOpacity, Text, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useAppTheme } from "../lib/themeStore";

const TABS = [
  {
    icon: "medal-outline" as const,
    activeIcon: "medal" as const,
    route: "/mySports",
    label: "My Sports",
  },
  {
    icon: "basketball-outline" as const,
    activeIcon: "basketball" as const,
    route: "/studentSports",
    label: "Enroll",
  },
  {
    icon: "add-circle" as const,
    activeIcon: "add-circle" as const,
    route: "/studentCreatePost",
    label: "Post",
    isCreate: true,
  },
  {
    icon: "trophy-outline" as const,
    activeIcon: "trophy" as const,
    route: "/studentPerformance",
    label: "Performance",
  },
  {
    icon: "calendar-outline" as const,
    activeIcon: "calendar" as const,
    route: "/studentAttendance",
    label: "Attendance",
  },
];

type Props = { activeRoute?: string };

export default function StudentBottomNav({ activeRoute }: Props) {
  const { theme } = useAppTheme();

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: theme.bgCard,
        borderTopWidth: 1,
        borderTopColor: theme.border,
        paddingTop: 8,
        paddingBottom: Platform.OS === "ios" ? 20 : 10,
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeRoute === tab.route;

        if (tab.isCreate) {
          return (
            <TouchableOpacity
              key={tab.route}
              onPress={() => router.push(tab.route as any)}
              style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
              activeOpacity={0.8}
            >
              <View
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 25,
                  backgroundColor: theme.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: -24,
                  shadowColor: theme.accent,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.45,
                  shadowRadius: 8,
                  elevation: 8,
                }}
              >
                <Ionicons name="add" size={30} color="white" />
              </View>
              <Text
                style={{
                  color: theme.textSub,
                  fontSize: 10,
                  marginTop: 4,
                  fontWeight: "600",
                }}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={tab.route}
            onPress={() => router.push(tab.route as any)}
            style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 2 }}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={24}
              color={isActive ? theme.accent : theme.textSub}
            />
            <Text
              style={{
                color: isActive ? theme.accent : theme.textSub,
                fontSize: 10,
                marginTop: 3,
                fontWeight: isActive ? "800" : "500",
              }}
            >
              {tab.label}
            </Text>
            {isActive && (
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: "50%",
                  marginLeft: -16,
                  width: 32,
                  height: 2,
                  borderRadius: 1,
                  backgroundColor: theme.accent,
                }}
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
