import { Platform } from "react-native";

const DEV_MACHINE_IP = "172.20.10.3";
const DEV_PORT = 5000;

export const API_BASE_URL =
  Platform.OS === "web"
    ? `http://localhost:${DEV_PORT}`
    : `http://${DEV_MACHINE_IP}:${DEV_PORT}`;
