import { router } from "expo-router";

/**
 * Clears the entire navigation stack and navigates to a target screen
 * Use this for logout, login success, and role changes to ensure clean navigation state
 */
export function resetNavigationTo(path: string) {
    // Clear entire navigation history
    while (router.canGoBack()) {
        router.back();
    }

    // Navigate to target with replace (prevents adding to stack)
    router.replace(path as any);
}

/**
 * Check if we can safely go back (without exposing protected routes)
 * This prevents going back from role home screens
 */
export function canSafelyGoBack(): boolean {
    // Back button blocking is handled in _layout.tsx
    // This function exists for future extensibility
    return router.canGoBack();
}
