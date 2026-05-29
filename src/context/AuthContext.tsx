/**
 * src/context/AuthContext.tsx
 *
 * Resolves Firebase Auth's async persistence restore exactly once and
 * exposes the result app-wide via React Context.
 *
 * WHY THIS EXISTS
 * ───────────────
 * Firebase Auth with AsyncStorage persistence hydrates the session
 * asynchronously on app launch. During that window auth.currentUser is
 * null even though a valid session exists. Any code that reads
 * auth.currentUser synchronously (or listens to onAuthStateChanged and
 * treats the first null emission as "logged out") will show incorrect UI.
 *
 * onAuthStateChanged fires:
 *   1. null       ← auth is still restoring from AsyncStorage  (DO NOT act on this)
 *   2. User | null ← final resolved state  (act here)
 *
 * We differentiate these two emissions using `authReady`.
 * `authReady` becomes true only after the FIRST non-initial emission.
 */

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/config/firebase";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface AuthContextValue {
    /**
     * The currently authenticated Firebase user, or null when logged out.
     * This is only meaningful when `authReady === true`.
     */
    user: User | null;
    /**
     * True once Firebase has finished reading the persisted session from
     * AsyncStorage. Until this is true, treat `user` as "unknown" —
     * do NOT show empty states or redirect to login.
     */
    authReady: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue>({
    user: null,
    authReady: false,
});

// ─────────────────────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [authReady, setAuthReady] = useState(false);

    useEffect(() => {
        console.log(
            "[AuthContext] Mounting AuthProvider. Initial auth.currentUser:",
            auth.currentUser?.uid ?? "null",
        );

        // onAuthStateChanged always fires at least once with the resolved state.
        // The first emission IS the final state (Firebase SDK handles the
        // AsyncStorage read internally and calls the listener only once it has
        // a definitive answer).
        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            console.log(
                "[AuthContext] onAuthStateChanged fired — user:",
                firebaseUser?.uid ?? "null",
                "| email:",
                firebaseUser?.email ?? "null"
            );
            setUser(firebaseUser);
            setAuthReady(true);
        });

        return unsubscribe;
    }, []);

    return (
        <AuthContext.Provider value={{ user, authReady }}>
            {children}
        </AuthContext.Provider>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the resolved Firebase auth state.
 * Always wait for `authReady === true` before acting on `user`.
 */
export function useAuth(): AuthContextValue {
    return useContext(AuthContext);
}
