import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";

type Announcement = {
    id: string;
    title: string;
    message: string;
    sport: string;
    createdAt: string;
};

export default function AdminAnnouncements() {
    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [sport, setSport] = useState("");
    const [loading, setLoading] = useState(false);

    // Mock data
    const [announcements, setAnnouncements] = useState<Announcement[]>([
        {
            id: "1",
            title: "Practice Session Tomorrow",
            message: "All cricket team members please attend",
            sport: "Cricket",
            createdAt: "2026-01-27",
        },
    ]);

    const handleCreate = async () => {
        if (!title.trim() || !message.trim()) {
            Alert.alert("Error", "Please fill in all fields");
            return;
        }

        setLoading(true);

        // TODO: Create announcement via API
        setTimeout(() => {
            const newAnnouncement: Announcement = {
                id: Date.now().toString(),
                title: title.trim(),
                message: message.trim(),
                sport: sport.trim() || "All Sports",
                createdAt: new Date().toISOString().split("T")[0],
            };

            setAnnouncements([newAnnouncement, ...announcements]);
            setTitle("");
            setMessage("");
            setSport("");
            setShowForm(false);
            setLoading(false);
            Alert.alert("Success", "Announcement created");
        }, 800);
    };

    return (
        <Screen>
            <ScrollView showsVerticalScrollIndicator={false}>
                <AppHeader
                    title="Announcements"
                    subtitle="Manage notifications"
                    rightSlot={
                        <Pressable
                            style={styles.addBtn}
                            onPress={() => setShowForm(!showForm)}
                        >
                            <Ionicons
                                name={showForm ? "close" : "add-circle"}
                                size={24}
                                color="#C9A227"
                            />
                        </Pressable>
                    }
                />

                {showForm && (
                    <AppCard style={{ marginTop: 14 }}>
                        <Text style={styles.formTitle}>New Announcement</Text>

                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            value={title}
                            onChangeText={setTitle}
                            style={styles.input}
                            placeholder="e.g., Practice Cancelled"
                            placeholderTextColor="rgba(229,231,235,0.35)"
                        />

                        <Text style={styles.label}>Message</Text>
                        <TextInput
                            value={message}
                            onChangeText={setMessage}
                            style={[styles.input, styles.textarea]}
                            placeholder="Enter announcement details..."
                            placeholderTextColor="rgba(229,231,235,0.35)"
                            multiline
                            numberOfLines={4}
                        />

                        <Text style={styles.label}>Sport (Optional)</Text>
                        <TextInput
                            value={sport}
                            onChangeText={setSport}
                            style={styles.input}
                            placeholder="Leave blank for all sports"
                            placeholderTextColor="rgba(229,231,235,0.35)"
                        />

                        <Pressable
                            style={[styles.btn, loading && { opacity: 0.6 }]}
                            onPress={handleCreate}
                            disabled={loading}
                        >
                            <Ionicons name="send" size={18} color="#111827" />
                            <Text style={styles.btnText}>
                                {loading ? "Sending..." : "Send Announcement"}
                            </Text>
                        </Pressable>
                    </AppCard>
                )}

                <View style={{ marginTop: 20 }}>
                    <Text style={styles.sectionTitle}>Recent Announcements</Text>
                    {announcements.map((item) => (
                        <AppCard key={item.id} style={{ marginTop: 12 }}>
                            <View style={styles.announcementHeader}>
                                <Text style={styles.announcementTitle}>{item.title}</Text>
                                <View style={styles.sportBadge}>
                                    <Text style={styles.sportBadgeText}>{item.sport}</Text>
                                </View>
                            </View>
                            <Text style={styles.announcementMessage}>{item.message}</Text>
                            <Text style={styles.announcementDate}>{item.createdAt}</Text>
                        </AppCard>
                    ))}
                </View>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
    addBtn: {
        padding: 8,
    },
    formTitle: {
        color: "#F9FAFB",
        fontSize: 18,
        fontWeight: "900",
        marginBottom: 8,
    },
    label: {
        marginTop: 12,
        color: "rgba(229,231,235,0.70)",
        fontSize: 13,
        fontWeight: "800",
    },
    input: {
        marginTop: 6,
        height: 48,
        borderRadius: 14,
        paddingHorizontal: 12,
        color: "#F9FAFB",
        fontWeight: "600",
        backgroundColor: "rgba(255,255,255,0.04)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
    },
    textarea: {
        height: 100,
        paddingTop: 12,
        textAlignVertical: "top",
    },
    btn: {
        marginTop: 20,
        height: 52,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#C9A227",
        flexDirection: "row",
        gap: 8,
    },
    btnText: {
        color: "#111827",
        fontSize: 16,
        fontWeight: "900",
    },
    sectionTitle: {
        color: "#F9FAFB",
        fontSize: 16,
        fontWeight: "800",
        marginBottom: 4,
    },
    announcementHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
    },
    announcementTitle: {
        flex: 1,
        color: "#F9FAFB",
        fontSize: 16,
        fontWeight: "800",
    },
    sportBadge: {
        backgroundColor: "rgba(201,162,39,0.15)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    sportBadgeText: {
        color: "#C9A227",
        fontSize: 12,
        fontWeight: "700",
    },
    announcementMessage: {
        color: "rgba(229,231,235,0.75)",
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 8,
    },
    announcementDate: {
        color: "#A7B0BE",
        fontSize: 12,
        fontWeight: "600",
    },
});
