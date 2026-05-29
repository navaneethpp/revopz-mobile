/**
 * src/services/authService.ts
 *
 * All Firebase Auth + Firestore interactions live here.
 * The rest of the app never imports from firebase directly — use these helpers.
 */
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import {
    collection,
    query,
    where,
    getDocs,
} from "firebase/firestore";
import { router } from "expo-router";

import { auth, db } from "@/config/firebase";
import { saveSession, clearSession } from "@/utils/storage";
import type { AdminUser, SessionData } from "@/types/auth";

// -----------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------
const ALLOWED_ROLE = "production_unit";
const ALLOWED_STATUS = "active";

// -----------------------------------------------------------------------
// loginUser
// -----------------------------------------------------------------------

/**
 * Authenticate a user with Firebase email/password, then validate their role
 * and status against the `admins` Firestore collection.
 *
 * On success: persists the session to SecureStore and navigates to /home.
 * On failure: throws an Error with a user-facing message.
 *
 * @param email    — Plain-text email from the login form
 * @param password — Plain-text password from the login form
 * @returns        The validated AdminUser data
 */
export async function loginUser(
    email: string,
    password: string,
): Promise<AdminUser> {
    // 1. Firebase Authentication
    let uid: string;
    try {
        const credential = await signInWithEmailAndPassword(
            auth,
            email.trim(),
            password,
        );
        uid = credential.user.uid;
    } catch (err: any) {
        // Map Firebase error codes to friendly messages
        const code: string = err?.code ?? "";
        if (
            code === "auth/user-not-found" ||
            code === "auth/wrong-password" ||
            code === "auth/invalid-credential"
        ) {
            throw new Error("Invalid email or password.");
        }
        if (code === "auth/too-many-requests") {
            throw new Error(
                "Too many failed attempts. Please try again later.",
            );
        }
        if (code === "auth/network-request-failed") {
            throw new Error(
                "Network error. Please check your connection.",
            );
        }
        throw new Error(err?.message ?? "Authentication failed.");
    }

    // 2. Firestore lookup — query by email so the document structure is flexible
    let adminData: AdminUser | null = null;
    try {
        const adminsRef = collection(db, "admins");
        const q = query(adminsRef, where("email", "==", email.trim().toLowerCase()));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const doc = snapshot.docs[0];
            adminData = {
                uid,
                ...(doc.data() as Omit<AdminUser, "uid">),
            };
        }
    } catch (err: any) {
        throw new Error(
            "Could not verify your account. Please try again.",
        );
    }

    if (!adminData) {
        // Firebase authenticated but no matching admin document — sign out silently
        await signOut(auth).catch(() => null);
        throw new Error("Unauthorized access. Account not found.");
    }

    // 3. Role validation
    if (adminData.role !== ALLOWED_ROLE) {
        await signOut(auth).catch(() => null);
        throw new Error(
            "You don't have permission to access this app.",
        );
    }

    // 4. Status validation
    if (adminData.status !== ALLOWED_STATUS) {
        await signOut(auth).catch(() => null);
        throw new Error(
            "Your account is inactive. Please contact your administrator.",
        );
    }

    // 5. Persist session to SecureStore
    const session: SessionData = {
        uid: adminData.uid,
        email: adminData.email,
        name: adminData.name,
        role: adminData.role,
        permissions: adminData.permissions ?? [],
        isLoggedIn: true,
    };
    await saveSession(session);

    // 6. Navigate to home — replace so the user can't back-navigate to login
    router.replace("/home");

    return adminData;
}

// -----------------------------------------------------------------------
// logoutUser
// -----------------------------------------------------------------------

/**
 * Sign the user out of Firebase Auth, wipe SecureStore, and navigate to login.
 */
export async function logoutUser(): Promise<void> {
    await Promise.allSettled([
        signOut(auth),
        clearSession(),
    ]);
    router.replace("/auth/login");
}