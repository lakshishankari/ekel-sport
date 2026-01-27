import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import AppCard from "../components/AppCard";

export default function AdminDisplayQR() {
    // TODO: Generate actual QR code with session ID
    const sessionId = "SESSION-" + Date.now().toString().slice(-6);
    const sport = "Cricket"; // TODO: Get from session data
    const location = "Main Ground";

    return (
        <Screen>
            <AppHeader title="QR Code" subtitle="Students scan this code" />

            <View style={styles.container}>
                <AppCard style={styles.qrCard}>
                    {/* TODO: Replace with actual QR code component */}
                    <View style={styles.qrPlaceholder}>
                        <Ionicons name="qr-code" size={200} color="#C9A227" />
                    </View>

                    <Text style={styles.sessionId}>Session: {sessionId}</Text>
                </AppCard>

                <AppCard style={{ marginTop: 16 }}>
                    <View style={styles.infoRow}>
                        <Ionicons name="basketball-outline" size={20} color="#C9A227" />
                        <Text style={styles.infoLabel}>Sport:</Text>
                        <Text style={styles.infoValue}>{sport}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="location-outline" size={20} color="#C9A227" />
                        <Text style={styles.infoLabel}>Location:</Text>
                        <Text style={styles.infoValue}>{location}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={20} color="#C9A227" />
                        <Text style={styles.infoLabel}>Time:</Text>
                        <Text style={styles.infoValue}>{new Date().toLocaleTimeString()}</Text>
                    </View>
                </AppCard>

                <View style={styles.hint}>
                    <Ionicons name="information-circle-outline" size={18} color="#A7B0BE" />
                    <Text style={styles.hintText}>Keep this screen open for students to scan</Text>
                </View>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    qrCard: {
        alignItems: "center",
        paddingVertical: 32,
        marginTop: 14,
    },
    qrPlaceholder: {
        width: 220,
        height: 220,
        backgroundColor: "white",
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    sessionId: {
        marginTop: 16,
        color: "#F9FAFB",
        fontSize: 14,
        fontWeight: "700",
    },
    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.05)",
    },
    infoLabel: {
        color: "rgba(229,231,235,0.70)",
        fontSize: 14,
        fontWeight: "600",
    },
    infoValue: {
        flex: 1,
        color: "#F9FAFB",
        fontSize: 14,
        fontWeight: "700",
        textAlign: "right",
    },
    hint: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginTop: 20,
        paddingHorizontal: 16,
    },
    hintText: {
        color: "#A7B0BE",
        fontSize: 13,
        fontWeight: "600",
    },
});
