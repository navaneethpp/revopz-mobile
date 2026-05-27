/**
 * src/utils/storage.ts
 *
 * Typed SecureStore helpers for persisting and retrieving the user session.
 * All values are JSON-serialised so complex types (arrays, objects) round-trip
 * cleanly. Errors are caught and re-thrown with descriptive messages so callers
 * can handle failures appropriately.
 */
import * as SecureStore from "expo-secure-store";
import type { SessionData } from "@/types/auth";

// ------------------------------------------------------------------
// Storage keys — keep in one place so typos can't cause ghost values
// ------------------------------------------------------------------
const KEYS = {
    SESSION: "revopz_session",
} as const;

/**
 * Persist the full session to SecureStore.
 * Call this immediately after a successful login validation.
 */
export async function saveSession(session: SessionData): Promise<void> {
    try {
        await SecureStore.setItemAsync(
            KEYS.SESSION,
            JSON.stringify(session),
        );
    } catch (err) {
        throw new Error("Failed to save session. Please try again.");
    }
}

/**
 * Retrieve the persisted session. Returns `null` when no session exists
 * (e.g. first launch or after explicit logout).
 */
export async function getSession(): Promise<SessionData | null> {
    try {
        const raw = await SecureStore.getItemAsync(KEYS.SESSION);
        if (!raw) return null;
        return JSON.parse(raw) as SessionData;
    } catch (err) {
        // Corrupt / unreadable storage — treat as "no session".
        return null;
    }
}

/**
 * Delete the persisted session.
 * Call this during logout so the next app launch redirects to login.
 */
export async function clearSession(): Promise<void> {
    try {
        await Promise.all([
            SecureStore.deleteItemAsync(KEYS.SESSION),
            SecureStore.deleteItemAsync("biometric_enabled"),
        ]);
    } catch (err) {
        // Nothing the user can do; swallow silently but log for debugging.
        console.warn("[storage] clearSession failed:", err);
    }
}

/**
 * Convenience: check whether a valid logged-in session exists.
 */
export async function isLoggedIn(): Promise<boolean> {
    const session = await getSession();
    return session?.isLoggedIn === true;
}
