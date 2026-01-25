import { router } from "expo-router";
import { clearAuth } from "./authStore";

export async function logout() {
  await clearAuth();
  router.replace("/login");
}
