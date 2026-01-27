import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Alert, ScrollView } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";

export default function AdminCreateSession() {
    const [sport, setSport] = useState("");
    const [location, setLocation] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreateSession = async () => {
        if (!sport.trim()) {
            Alert.alert("Error", "Please select a sport");
            return;
        }
        if (!location.trim()) {
            Alert.alert("Error", "Please enter location");
            return;
        }

        setLoading(true);

        // TODO: Create session via API
        setTimeout(() => {
            setLoading(false);
            Alert.alert("Success", "Attendance session created successfully", [
                {
                    text: "Show QR Code",
                    onPress: () => router.push("/adminDisplayQR"),
                },
                {
                    text: "Done",
                    onPress: () => router.back(),
                },
            ]);
        }, 1000);
    };

    return (
        <Screen>
            <ScrollView showsVerticalScrollIndicator={false}>
                <AppHeader title="Create Session" subtitle="New attendance session" />

                <AppCard style={{ marginTop: 14 }}>
                    <Text style={styles.label}>Sport</Text>
                    <TextInput
                        value={sport}
                        onChangeText={setSport}
                        style={styles.input}
                        placeholder="e.g., Cricket, Basketball"
                        placeholderTextColor="rgba(229,231,235,0.35)"
                    />

                    <Text style={styles.label}>Location</Text>
                    <TextInput
                        value={location}
                        onChangeText={setLocation}
                        style={styles.input}
                        placeholder="e.g., Main Ground, Sports Complex"
                        placeholderTextColor="rgba(229,231,235,0.35)"
                    />

                    <Text style={styles.label}>Date (Optional)</Text>
                    <TextInput
                        value={date}
                        onChangeText={setDate}
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="rgba(229,231,235,0.35)"
                    />

                    <Text style={styles.label}>Time (Optional)</Text>
                    <TextInput
                        value={time}
                        onChangeText={setTime}
                        style={styles.input}
                        placeholder="HH:MM"
                        placeholderTextColor="rgba(229,231,235,0.35)"
                    />

                    <Pressable
                        style={[styles.btn, loading && { opacity: 0.6 }]}
                        onPress={handleCreateSession}
                        disabled={loading}
                    >
                        <Ionicons name="qr-code-outline" size={20} color="#111827" />
                        <Text style={styles.btnText}>
                            {loading ? "Creating..." : "Create & Generate QR"}
                        </Text>
                    </Pressable>
                </AppCard>
            </ScrollView>
        </Screen>
    );
}

const styles = StyleSheet.create({
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
});
