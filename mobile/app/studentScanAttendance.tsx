import React, { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../lib/themeStore";

export default function StudentScanAttendance() {
  const { theme } = useAppTheme();
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
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 24 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: theme.bgInput, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: theme.border }}>
            <Ionicons name="camera-outline" size={36} color={theme.textSub} />
          </View>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "800", textAlign: "center" }}>Camera Access Required</Text>
          <Text style={{ color: theme.textSub, fontSize: 15, textAlign: "center", lineHeight: 22 }}>
            Camera access is needed to scan QR codes at your sports sessions.
          </Text>
          <Pressable
            style={({ pressed }) => [{ marginTop: 8, backgroundColor: theme.btnPrimary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14, flexDirection: "row", gap: 8, alignItems: "center" }, pressed && { opacity: 0.85 }]}
            onPress={requestPermission}
          >
            <Ionicons name="camera-outline" size={18} color={theme.btnPrimaryText} />
            <Text style={{ color: theme.btnPrimaryText, fontSize: 16, fontWeight: "900" }}>Grant Permission</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    const { Alert } = require("react-native");
    Alert.alert(
      "Attendance Recorded ✅",
      `Successfully marked attendance for session: ${data.substring(0, 8)}...`,
      [{ text: "OK", onPress: () => { setScanned(false); router.back(); } }]
    );
  };

  return (
    <Screen>
      <AppHeader title="Scan QR Code" subtitle="Point camera at instructor's QR code" />

      <View style={{ flex: 1, borderRadius: 20, overflow: "hidden", marginBottom: 16 }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)", alignItems: "center", justifyContent: "center" }}>
            {/* Corner decorations */}
            <View style={{ width: 250, height: 250, position: "relative" }}>
              {/* Scan box */}
              <View style={{ position: "absolute", inset: 0, borderWidth: 2, borderColor: theme.accent, borderRadius: 18, backgroundColor: "transparent" }} />
              {/* Corners */}
              {[
                { top: -2, left: -2, borderTopWidth: 4, borderLeftWidth: 4 },
                { top: -2, right: -2, borderTopWidth: 4, borderRightWidth: 4 },
                { bottom: -2, left: -2, borderBottomWidth: 4, borderLeftWidth: 4 },
                { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 },
              ].map((s, i) => (
                <View key={i} style={[{ position: "absolute", width: 28, height: 28, borderColor: theme.accent, borderRadius: 4 }, s as any]} />
              ))}
            </View>
            <Text style={{ marginTop: 28, color: "white", fontSize: 15, fontWeight: "600", textAlign: "center" }}>
              Align QR code within the box
            </Text>
          </View>
        </CameraView>
      </View>

      <Pressable
        style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 14, backgroundColor: "#EF444418", borderWidth: 1, borderColor: "#EF444433" }, pressed && { opacity: 0.8 }]}
        onPress={() => router.back()}
      >
        <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
        <Text style={{ color: "#EF4444", fontSize: 16, fontWeight: "700" }}>Cancel</Text>
      </Pressable>
    </Screen>
  );
}
