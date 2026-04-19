import React, { useState } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Screen from "../components/Screen";
import AppHeader from "../components/AppHeader";
import { useAppTheme } from "../lib/themeStore";
import { apiPost } from "../lib/api";

// Must match the prefix used in adminDisplayQR.tsx
const QR_PREFIX = "EKEL-ATT:SESSION:";

type ScanState = "idle" | "processing" | "success" | "error";

export default function StudentScanAttendance() {
  const { theme } = useAppTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [resultMsg, setResultMsg]   = useState("");
  const [resultDetail, setResultDetail] = useState("");

  // ── Permission not yet determined
  if (!permission) {
    return (
      <Screen>
        <AppHeader title="Scan Attendance" subtitle="Loading camera…" showBack />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#D4AF37" />
        </View>
      </Screen>
    );
  }

  // ── Permission denied
  if (!permission.granted) {
    return (
      <Screen>
        <AppHeader title="Scan Attendance" subtitle="Camera permission required" showBack />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16, paddingHorizontal: 24 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: theme.bgInput, alignItems: "center", justifyContent: "center",
            borderWidth: 1, borderColor: theme.border,
          }}>
            <Ionicons name="camera-outline" size={36} color={theme.textSub} />
          </View>
          <Text style={{ color: theme.text, fontSize: 18, fontWeight: "800", textAlign: "center" }}>
            Camera Access Required
          </Text>
          <Text style={{ color: theme.textSub, fontSize: 15, textAlign: "center", lineHeight: 22 }}>
            Camera access is needed to scan QR codes at your sports sessions.
          </Text>
          <Pressable
            style={({ pressed }) => [{
              marginTop: 8, backgroundColor: "#D4AF37",
              paddingHorizontal: 28, paddingVertical: 14,
              borderRadius: 14, flexDirection: "row", gap: 8, alignItems: "center",
            }, pressed && { opacity: 0.85 }]}
            onPress={requestPermission}
          >
            <Ionicons name="camera-outline" size={18} color="#111827" />
            <Text style={{ color: "#111827", fontSize: 16, fontWeight: "900" }}>Grant Permission</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  // ── Handle QR scan
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanState !== "idle") return; // already processing or done

    // Validate it's our QR format
    if (!data.startsWith(QR_PREFIX)) {
      setScanState("error");
      setResultMsg("Invalid QR Code");
      setResultDetail("This doesn't look like an EKEL-Sport attendance QR. Please scan the correct code.");
      return;
    }

    const sessionId = Number(data.replace(QR_PREFIX, ""));
    if (!sessionId) {
      setScanState("error");
      setResultMsg("Unreadable QR Code");
      setResultDetail("Could not extract session info. Try scanning again.");
      return;
    }

    setScanState("processing");

    try {
      const resp = await apiPost<{ ok: boolean; message: string; sport: string; date: string; location: string }>(
        "/api/student/attendance/mark",
        { sessionId }
      );
      setScanState("success");
      setResultMsg(`✅ Attendance Marked!`);
      setResultDetail(`${resp.sport} · ${resp.location}\n${resp.date}`);
    } catch (e: any) {
      setScanState("error");
      setResultMsg("Could Not Mark Attendance");
      setResultDetail(e?.message || "An error occurred. Please try again.");
    }
  };

  // ── Result overlay (success / error)
  if (scanState === "success" || scanState === "error") {
    const isSuccess = scanState === "success";
    const accentColor = isSuccess ? "#10B981" : "#EF4444";

    return (
      <Screen>
        <AppHeader title="Scan Attendance" subtitle={isSuccess ? "Recorded!" : "Something went wrong"} showBack />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 28, gap: 20 }}>
          {/* Icon */}
          <View style={{
            width: 90, height: 90, borderRadius: 45,
            backgroundColor: accentColor + "18",
            borderWidth: 2, borderColor: accentColor + "44",
            alignItems: "center", justifyContent: "center",
          }}>
            <Ionicons
              name={isSuccess ? "checkmark-circle" : "close-circle"}
              size={52} color={accentColor}
            />
          </View>

          {/* Message */}
          <Text style={{ color: theme.text, fontSize: 22, fontWeight: "900", textAlign: "center" }}>
            {resultMsg}
          </Text>
          <Text style={{ color: theme.textSub, fontSize: 15, fontWeight: "600", textAlign: "center", lineHeight: 22 }}>
            {resultDetail}
          </Text>

          {/* Actions */}
          <View style={{ width: "100%", gap: 10, marginTop: 10 }}>
            {!isSuccess && (
              <Pressable
                style={({ pressed }) => [{
                  height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center",
                  backgroundColor: "#D4AF37", flexDirection: "row", gap: 8,
                }, pressed && { opacity: 0.85 }]}
                onPress={() => setScanState("idle")}
              >
                <Ionicons name="qr-code-outline" size={20} color="#111827" />
                <Text style={{ color: "#111827", fontSize: 16, fontWeight: "900" }}>Scan Again</Text>
              </Pressable>
            )}
            <Pressable
              style={({ pressed }) => [{
                height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center",
                backgroundColor: theme.bgInput, borderWidth: 1, borderColor: theme.border,
                flexDirection: "row", gap: 8,
              }, pressed && { opacity: 0.8 }]}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back-outline" size={18} color={theme.textSub} />
              <Text style={{ color: theme.textSub, fontSize: 16, fontWeight: "800" }}>Go Back</Text>
            </Pressable>
          </View>
        </View>
      </Screen>
    );
  }

  // ── Camera view
  return (
    <Screen>
      <AppHeader title="Scan QR Code" subtitle="Point camera at instructor's QR code" showBack />

      {scanState === "processing" ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
          <ActivityIndicator size="large" color="#D4AF37" />
          <Text style={{ color: theme.textSub, fontSize: 15, fontWeight: "600" }}>
            Marking attendance…
          </Text>
        </View>
      ) : (
        <>
          <View style={{ flex: 1, borderRadius: 20, overflow: "hidden", marginBottom: 16, marginHorizontal: 0 }}>
            <CameraView
              style={{ flex: 1 }}
              facing="back"
              onBarcodeScanned={handleBarCodeScanned}
            >
              <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" }}>
                {/* Scan box */}
                <View style={{ width: 260, height: 260, position: "relative" }}>
                  <View style={{
                    position: "absolute", inset: 0,
                    borderWidth: 2, borderColor: "#D4AF37",
                    borderRadius: 18, backgroundColor: "transparent",
                  }} />
                  {/* Animated corner brackets */}
                  {[
                    { top: -2, left: -2,   borderTopWidth: 4,    borderLeftWidth: 4  },
                    { top: -2, right: -2,  borderTopWidth: 4,    borderRightWidth: 4 },
                    { bottom: -2, left: -2,  borderBottomWidth: 4, borderLeftWidth: 4  },
                    { bottom: -2, right: -2, borderBottomWidth: 4, borderRightWidth: 4 },
                  ].map((s, i) => (
                    <View key={i} style={[{
                      position: "absolute", width: 30, height: 30,
                      borderColor: "#D4AF37", borderRadius: 4,
                    }, s as any]} />
                  ))}
                </View>

                <Text style={{
                  marginTop: 28, color: "white",
                  fontSize: 15, fontWeight: "600", textAlign: "center",
                }}>
                  Align the QR code within the box
                </Text>
                <Text style={{
                  marginTop: 6, color: "rgba(255,255,255,0.6)",
                  fontSize: 12, fontWeight: "600",
                }}>
                  Hold steady — it scans automatically
                </Text>
              </View>
            </CameraView>
          </View>

          <Pressable
            style={({ pressed }) => [{
              flexDirection: "row", alignItems: "center", justifyContent: "center",
              gap: 8, padding: 14, borderRadius: 14,
              backgroundColor: "#EF444418", borderWidth: 1, borderColor: "#EF444433",
            }, pressed && { opacity: 0.8 }]}
            onPress={() => router.back()}
          >
            <Ionicons name="close-circle-outline" size={20} color="#EF4444" />
            <Text style={{ color: "#EF4444", fontSize: 16, fontWeight: "700" }}>Cancel</Text>
          </Pressable>
        </>
      )}
    </Screen>
  );
}
