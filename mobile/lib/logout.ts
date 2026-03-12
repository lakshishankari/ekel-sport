import { router } from "expo-router";
import { clearAuth } from "./authStore";

export async function logout() {
  await clearAuth();

  // Safely clear navigation stack with error handling
  try {
    let iterations = 0;
    const maxIterations = 20; // Safety limit

    while (router.canGoBack() && iterations < maxIterations) {
      router.back();
      iterations++;
    }
  } catch (error) {
    // Ignore navigation errors - we just want to clear the stack
    console.log("Navigation clearing completed");
  }

  // Navigate to login with clean state
  router.replace("/login");
}
