import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, Pressable } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";

export default function StudentScanAttendance() {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    if (!permission) {
        return (
            <Screen>
                <AppHeader title="Scan Attendance" subtitle="Loading camera..." />
            </Screen>
        );
    }

    if (!permission.granted) {
        return (
            <Screen>
                <AppHeader title="Scan Attendance" subtitle="Camera permission required" />
                <View style={styles.permissionContainer}>
                    <Ionicons name="camera-outline" size={64} color="#A7B0BE" />
                    <Text style={styles.permissionText}>Camera access is needed to scan QR codes</Text>
                    <Pressable style={styles.permissionBtn} onPress={requestPermission}>
                        <Text style={styles.permissionBtnText}>Grant Permission</Text>
                    </Pressable>
                </View>
            </Screen>
        );
    }

    const handleBarCodeScanned = ({ data }: { data: string }) => {
        if (scanned) return;
        setScanned(true);

        // TODO: Send attendance data to backend
        // For now, simulate success
        Alert.alert(
            "Attendance Recorded",
            `Successfully marked attendance for session: ${data.substring(0, 8)}...`,
            [
                {
                    text: "OK",
                    onPress: () => {
                        setScanned(false);
                        router.back();
                    },
                },
            ]
        );
    };

    return (
        <Screen>
            <AppHeader title="Scan QR Code" subtitle="Point camera at instructor's QR code" />

            <View style={styles.cameraContainer}>
                <CameraView
                    style={styles.camera}
                    facing="back"
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                >
                    <View style={styles.overlay}>
                        <View style={styles.scanBox} />
                        <Text style={styles.instruction}>Align QR code within the box</Text>
                    </View>
                </CameraView>
            </View>

            <View style={styles.footer}>
                <Pressable style={styles.cancelBtn} onPress={() => router.back()}>
                    <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
                    <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
            </View>
        </Screen>
    );
}

const styles = StyleSheet.create({
    permissionContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        paddingHorizontal: 24,
    },
    permissionText: {
        color: "#A7B0BE",
        fontSize: 16,
        textAlign: "center",
    },
    permissionBtn: {
        marginTop: 12,
        backgroundColor: "#C9A227",
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    permissionBtnText: {
        color: "#111827",
        fontSize: 16,
        fontWeight: "900",
    },
    cameraContainer: {
        flex: 1,
        borderRadius: 18,
        overflow: "hidden",
        marginBottom: 16,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        alignItems: "center",
        justifyContent: "center",
    },
    scanBox: {
        width: 250,
        height: 250,
        borderWidth: 3,
        borderColor: "#C9A227",
        borderRadius: 18,
        backgroundColor: "transparent",
    },
    instruction: {
        marginTop: 24,
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    footer: {
        paddingVertical: 8,
    },
    cancelBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 14,
        borderRadius: 12,
        backgroundColor: "rgba(239,68,68,0.1)",
        borderWidth: 1,
        borderColor: "rgba(239,68,68,0.3)",
    },
    cancelText: {
        color: "#EF4444",
        fontSize: 16,
        fontWeight: "700",
    },
});
