import { Platform } from "react-native";

const DEV_MACHINE_IP = "192.168.1.3"; // ✅ Actual machine IP from ipconfig (hotspot)
const DEV_PORT = 5000;

export const API_BASE_URL =
  Platform.OS === "web"
    ? `http://localhost:${DEV_PORT}`
    : `http://${DEV_MACHINE_IP}:${DEV_PORT}`;
