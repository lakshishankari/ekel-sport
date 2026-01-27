import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { loadAuth } from "../lib/authStore";
import Screen from "../components/Screen";

type ReportCard = {
    title: string;
    value: string;
    change: string;
    trend: "up" | "down" | "neutral";
    icon: string;
    color: string;
};

export default function Reports() {
    const [userRole, setUserRole] = useState("");

    useEffect(() => {
        (async () => {
            const { token, role } = await loadAuth();
            if (!token) {
                router.replace("/login");
                return;
            }
            setUserRole(role || "");
        })();
    }, []);

    // Mock analytics data
    const reports: ReportCard[] = [
        {
            title: "Total Students",
            value: "156",
            change: "+12 this month",
            trend: "up",
            icon: "people",
            color: "#C9A227",
        },
        {
            title: "Active Sports",
            value: "8",
            change: "Unchanged",
            trend: "neutral",
            icon: "basketball",
            color: "#10B981",
        },
        {
            title: "Avg Attendance",
            value: "87%",
            change: "+5% from last month",
            trend: "up",
            icon: "checkmark-circle",
            color: "#3B82F6",
        },
        {
            title: "Eligible for Colors",
            value: "42",
            change: "27% of total",
            trend: "up",
            icon: "trophy",
            color: "#8B5CF6",
        },
    ];

    const performanceSummary = [
        { sport: "Cricket", students: 45, avgScore: 78 },
        { sport: "Basketball", students: 38, avgScore: 82 },
        { sport: "Football", students: 41, avgScore: 75 },
        { sport: "Badminton", students: 32, avgScore: 80 },
    ];

    const getTrendIcon = (trend: string) => {
        if (trend === "up") return "trending-up";
        if (trend === "down") return "trending-down";
        return "remove";
    };

    const getTrendColor = (trend: string) => {
        if (trend === "up") return "#10B981";
        if (trend === "down") return "#EF4444";
        return "#A7B0BE";
    };

    return (
        <Screen>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={24} color="#F9FAFB" />
                </Pressable>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>Reports & Analytics</Text>
                    <Text style={styles.headerSubtitle}>
                        Performance insights and statistics
                    </Text>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                {/* Key Metrics */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Key Metrics</Text>
                    <View style={styles.grid}>
                        {reports.map((report, index) => (
                            <View key={index} style={styles.reportCard}>
                                <View style={[styles.iconBox, { backgroundColor: `${report.color}20` }]}>
                                    <Ionicons name={report.icon as any} size={24} color={report.color} />
                                </View>
                                <Text style={styles.reportTitle}>{report.title}</Text>
                                <Text style={styles.reportValue}>{report.value}</Text>
                                <View style={styles.changeRow}>
                                    <Ionicons
                                        name={getTrendIcon(report.trend) as any}
                                        size={14}
                                        color={getTrendColor(report.trend)}
                                    />
                                    <Text style={[styles.changeText, { color: getTrendColor(report.trend) }]}>
                                        {report.change}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Performance by Sport */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Performance by Sport</Text>
                    {performanceSummary.map((item, index) => (
                        <View key={index} style={styles.sportCard}>
                            <View style={styles.sportHeader}>
                                <Text style={styles.sportName}>{item.sport}</Text>
                                <View style={styles.sportStats}>
                                    <View style={styles.statItem}>
                                        <Ionicons name="people-outline" size={14} color="#A7B0BE" />
                                        <Text style={styles.statText}>{item.students}</Text>
                                    </View>
                                    <View style={[styles.scoreBadge, { backgroundColor: `${item.avgScore >= 80 ? "#10B981" : "#C9A227"}20` }]}>
                                        <Text style={[styles.scoreText, { color: item.avgScore >= 80 ? "#10B981" : "#C9A227" }]}>
                                            {item.avgScore}%
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            width: `${item.avgScore}%`,
                                            backgroundColor: item.avgScore >= 80 ? "#10B981" : "#C9A227",
                                        },
                                    ]}
                                />
                            </View>
                        </View>
                    ))}
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Export & Share</Text>
                    <Pressable style={styles.actionCard}>
                        <Ionicons name="download-outline" size={20} color="#C9A227" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.actionTitle}>Export Full Report</Text>
                            <Text style={styles.actionDesc}>Download as PDF or Excel</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#A7B0BE" />
                    </Pressable>

                    <Pressable style={styles.actionCard}>
                        <Ionicons name="share-outline" size={20} color="#3B82F6" />
                        <View style={{ flex: 1 }}>
                            <Text style={styles.actionTitle}>Share Dashboard</Text>
                            <Text style={styles.actionDesc}>Send analytics to stakeholders</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#A7B0BE" />
                    </Pressable>
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
    grid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
    },
    reportCard: {
        width: "48%",
        backgroundColor: "rgba(18, 24, 38, 0.8)",
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    reportTitle: {
        color: "rgba(229,231,235,0.7)",
        fontSize: 12,
        fontWeight: "700",
        marginBottom: 6,
    },
    reportValue: {
        color: "#F9FAFB",
        fontSize: 24,
        fontWeight: "900",
        marginBottom: 6,
    },
    changeRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    changeText: {
        fontSize: 11,
        fontWeight: "600",
    },
    sportCard: {
        backgroundColor: "rgba(18, 24, 38, 0.8)",
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    sportHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },
    sportName: {
        color: "#F9FAFB",
        fontSize: 15,
        fontWeight: "800",
    },
    sportStats: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    statText: {
        color: "#A7B0BE",
        fontSize: 13,
        fontWeight: "600",
    },
    scoreBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
    },
    scoreText: {
        fontSize: 13,
        fontWeight: "900",
    },
    progressBar: {
        width: "100%",
        height: 6,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 3,
        overflow: "hidden",
    },
    progressFill: {
        height: "100%",
        borderRadius: 3,
    },
    actionCard: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: "rgba(18, 24, 38, 0.8)",
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    actionTitle: {
        color: "#F9FAFB",
        fontSize: 15,
        fontWeight: "800",
        marginBottom: 2,
    },
    actionDesc: {
        color: "#A7B0BE",
        fontSize: 12,
        fontWeight: "600",
    },
});
