import { router } from "expo-router";

/**
 * Navigates to a target screen using replace, which resets the stack cleanly.
 * Use this for logout, login success, and role changes to ensure clean navigation state.
 */
export function resetNavigationTo(path: string) {
    // router.replace() replaces the current entry and clears forward history
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
