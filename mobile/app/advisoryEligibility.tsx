import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";

type Student = {
    id: string;
    name: string;
    studentId: string;
    sport: string;
    score: number;
    eligible: boolean;
};

export default function AdvisoryEligibility() {
    const [searchQuery, setSearchQuery] = useState("");
    const [filterSport, setFilterSport] = useState("All");

    // Mock data
    const students: Student[] = [
        {
            id: "1",
            name: "Diwanja Kumar",
            studentId: "IM/2022/051",
            sport: "Cricket",
            score: 85,
            eligible: true,
        },
        {
            id: "2",
            name: "John Smith",
            studentId: "CS/2022/123",
            sport: "Basketball",
            score: 62,
            eligible: true,
        },
        {
            id: "3",
            name: "Jane Doe",
            studentId: "PY/2023/045",
            sport: "Cricket",
            score: 48,
            eligible: false,
        },
    ];

    const filteredStudents = students.filter((s) => {
        const matchesSearch =
            s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.studentId.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesSport = filterSport === "All" || s.sport === filterSport;
        return matchesSearch && matchesSport;
    });

    return (
        <Screen>
            <ScrollView showsVerticalScrollIndicator={false}>
                <AppHeader
                    title="Student Eligibility"
                    subtitle="Colours eligibility status"
                />

                {/* Filters */}
                <AppCard style={{ marginTop: 14 }}>
                    <View style={styles.searchContainer}>
                        <Ionicons name="search" size={20} color="#A7B0BE" />
                        <TextInput
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            style={styles.searchInput}
                            placeholder="Search by name or ID..."
                            placeholderTextColor="rgba(229,231,235,0.35)"
                        />
                    </View>

                    <View style={styles.filterRow}>
                        <Text style={styles.filterLabel}>Sport:</Text>
                        <View style={styles.filterBtns}>
                            {["All", "Cricket", "Basketball"].map((sport) => (
                                <Pressable
                                    key={sport}
                                    style={[
                                        styles.filterBtn,
                                        filterSport === sport && styles.filterBtnActive,
                                    ]}
                                    onPress={() => setFilterSport(sport)}
                                >
                                    <Text
                                        style={[
                                            styles.filterBtnText,
                                            filterSport === sport && styles.filterBtnTextActive,
                                        ]}
                                    >
                                        {sport}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </AppCard>

                {/* Stats */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{students.filter(s => s.eligible).length}</Text>
                        <Text style={styles.statLabel}>Eligible</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{students.filter(s => !s.eligible).length}</Text>
                        <Text style={styles.statLabel}>Not Eligible</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statValue}>{students.length}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </View>
                </View>

                {/* Students List */}
                <View style={{ marginTop: 8 }}>
                    {filteredStudents.map((student) => (
                        <AppCard key={student.id} style={{ marginTop: 12 }}>
                            <View style={styles.studentHeader}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.studentName}>{student.name}</Text>
                                    <Text style={styles.studentId}>{student.studentId}</Text>
                                </View>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        student.eligible ? styles.statusEligible : styles.statusNotEligible,
                                    ]}
                                >
                                    <Ionicons
                                        name={student.eligible ? "checkmark-circle" : "close-circle"}
                                        size={16}
                                        color={student.eligible ? "#10B981" : "#EF4444"}
                                    />
                                    <Text
                                        style={[
                                            styles.statusText,
                                            student.eligible ? styles.statusTextEligible : styles.statusTextNotEligible,
                                        ]}
                                    >
                                        {student.eligible ? "Eligible" : "Not Eligible"}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.studentInfo}>
                                <View style={styles.infoItem}>
                                    <Ionicons name="basketball-outline" size={16} color="#A7B0BE" />
                                    <Text style={styles.infoText}>{student.sport}</Text>
                                </View>
                                <View style={styles.infoItem}>
                                    <Ionicons name="trophy-outline" size={16} color="#A7B0BE" />
                                    <Text style={styles.infoText}>Score: {student.score}</Text>
                                </View>
                            </View>
                        </AppCard>
                    ))}

                    {filteredStudents.length === 0 && (
                        <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={48} color="#A7B0BE" />
                            <Text style={styles.emptyText}>No students found</Text>
                        </View>
                    )}
                </View>

                {/* Export Button */}
                <Pressable style={styles.exportBtn}>
                    <Ionicons name="download-outline" size={20} color="#C9A227" />
                    <Text style={styles.exportText}>Export Report</Text>
                </Pressable>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 48,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
    },
    searchInput: {
        flex: 1,
        color: "#F9FAFB",
        fontSize: 15,
        fontWeight: "600",
    },
    filterRow: {
        marginTop: 14,
    },
    filterLabel: {
        color: "rgba(229,231,235,0.70)",
        fontSize: 13,
        fontWeight: "800",
        marginBottom: 8,
    },
    filterBtns: {
        flexDirection: "row",
        gap: 8,
    },
    filterBtn: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
    },
    filterBtnActive: {
        backgroundColor: "rgba(201,162,39,0.15)",
        borderColor: "#C9A227",
    },
    filterBtnText: {
        color: "#A7B0BE",
        fontSize: 13,
        fontWeight: "700",
    },
    filterBtnTextActive: {
        color: "#C9A227",
    },
    statsRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 14,
        padding: 16,
        alignItems: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    statValue: {
        color: "#C9A227",
        fontSize: 24,
        fontWeight: "900",
    },
    statLabel: {
        color: "#A7B0BE",
        fontSize: 11,
        fontWeight: "700",
        marginTop: 4,
    },
    studentHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        marginBottom: 12,
    },
    studentName: {
        color: "#F9FAFB",
        fontSize: 16,
        fontWeight: "800",
    },
    studentId: {
        color: "#A7B0BE",
        fontSize: 13,
        fontWeight: "600",
        marginTop: 2,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusEligible: {
        backgroundColor: "rgba(16,185,129,0.1)",
    },
    statusNotEligible: {
        backgroundColor: "rgba(239,68,68,0.1)",
    },
    statusText: {
        fontSize: 12,
        fontWeight: "700",
    },
    statusTextEligible: {
        color: "#10B981",
    },
    statusTextNotEligible: {
        color: "#EF4444",
    },
    studentInfo: {
        flexDirection: "row",
        gap: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.05)",
    },
    infoItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    infoText: {
        color: "rgba(229,231,235,0.75)",
        fontSize: 13,
        fontWeight: "600",
    },
    emptyState: {
        alignItems: "center",
        paddingVertical: 48,
    },
    emptyText: {
        color: "#A7B0BE",
        fontSize: 15,
        fontWeight: "600",
        marginTop: 12,
    },
    exportBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        marginTop: 20,
        marginBottom: 20,
        padding: 16,
        borderRadius: 14,
        backgroundColor: "rgba(201,162,39,0.1)",
        borderWidth: 1,
        borderColor: "rgba(201,162,39,0.3)",
    },
    exportText: {
        color: "#C9A227",
        fontSize: 16,
        fontWeight: "800",
    },
});
