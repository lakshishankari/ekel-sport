import { router } from "expo-router";
import { clearAuth } from "./authStore";

export async function logout() {
  await clearAuth();

  // Replace replaces the current screen and resets the stack cleanly
  router.replace("/login");
}
