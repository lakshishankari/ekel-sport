import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";

type AttendanceSession = {
    id: string;
    sport: string;
    date: string;
    location: string;
    attendees: number;
    total: number;
};

export default function AdminAttendanceList() {
    const [sessions] = useState<AttendanceSession[]>([
        {
            id: "1",
            sport: "Cricket",
            date: "2026-01-27",
            location: "Main Ground",
            attendees: 18,
            total: 22,
        },
        {
            id: "2",
            sport: "Basketball",
            date: "2026-01-26",
            location: "Indoor Court",
            attendees: 15,
            total: 15,
        },
    ]);

    const getAttendanceRate = (attendees: number, total: number) => {
        return Math.round((attendees / total) * 100);
    };

    return (
        <Screen>
            <ScrollView showsVerticalScrollIndicator={false}>
                <AppHeader
                    title="Attendance Sessions"
                    subtitle="View all sessions"
                    rightSlot={
                        <Pressable style={styles.addBtn}>
                            <Ionicons name="add-circle" size={28} color="#C9A227" />
                        </Pressable>
                    }
                />

                <View style={{ marginTop: 14 }}>
                    {sessions.map((session) => {
                        const rate = getAttendanceRate(session.attendees, session.total);
                        return (
                            <AppCard key={session.id} style={{ marginTop: 12 }}>
                                <View style={styles.sessionHeader}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.sport}>{session.sport}</Text>
                                        <View style={styles.dateRow}>
                                            <Ionicons name="calendar-outline" size={14} color="#A7B0BE" />
                                            <Text style={styles.date}>{session.date}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.rateBadge}>
                                        <Text style={styles.rateText}>{rate}%</Text>
                                    </View>
                                </View>

                                <View style={styles.details}>
                                    <View style={styles.detailItem}>
                                        <Ionicons name="location-outline" size={16} color="#A7B0BE" />
                                        <Text style={styles.detailText}>{session.location}</Text>
                                    </View>

                                    <View style={styles.detailItem}>
                                        <Ionicons name="people-outline" size={16} color="#A7B0BE" />
                                        <Text style={styles.detailText}>
                                            {session.attendees} / {session.total} students
                                        </Text>
                                    </View>
                                </View>

                                <Pressable style={styles.viewBtn}>
                                    <Text style={styles.viewBtnText}>View Attendees</Text>
                                    <Ionicons name="chevron-forward" size={16} color="#C9A227" />
                                </Pressable>
                            </AppCard>
                        );
                    })}

                    {sessions.length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="clipboard-outline" size={48} color="#A7B0BE" />
                            <Text style={styles.emptyText}>No sessions yet</Text>
                            <Text style={styles.emptyHint}>Create a session to get started</Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    addBtn: {
        padding: 4,
    },
    sessionHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 12,
    },
    sport: {
        color: "#F9FAFB",
        fontSize: 17,
        fontWeight: "800",
    },
    dateRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
    },
    date: {
        color: "#A7B0BE",
        fontSize: 13,
        fontWeight: "600",
    },
    rateBadge: {
        backgroundColor: "rgba(201,162,39,0.15)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
    },
    rateText: {
        color: "#C9A227",
        fontSize: 16,
        fontWeight: "900",
    },
    details: {
        gap: 8,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
    },
    detailItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    detailText: {
        color: "rgba(229,231,235,0.75)",
        fontSize: 14,
        fontWeight: "600",
    },
    viewBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        marginTop: 12,
        padding: 10,
    },
    viewBtnText: {
        color: "#C9A227",
        fontSize: 14,
        fontWeight: "700",
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 60,
    },
    emptyText: {
        color: "#F9FAFB",
        fontSize: 16,
        fontWeight: "700",
        marginTop: 12,
    },
    emptyHint: {
        color: "#A7B0BE",
        fontSize: 14,
        fontWeight: "600",
        marginTop: 6,
    },
});
