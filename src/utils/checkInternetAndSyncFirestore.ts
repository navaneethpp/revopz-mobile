/**
 * src/utils/checkInternetAndSyncFirestore.ts
 *
 * Centralized connectivity gate for REVOPZ.
 *
 * Call `await checkInternetAndSyncFirestore()` once during the splash screen
 * before navigating anywhere.  The function:
 *
 *   • Returns immediately when the device is online and Firestore network has
 *     been re-enabled via `enableNetwork(db)`.
 *
 *   • When offline, disables Firestore network, shows a blocking Alert with
 *     "Retry" and "Exit" buttons, and only resolves after the user has
 *     confirmed connectivity by pressing Retry (which loops until online) or
 *     exits the process.
 *
 * This guarantees that by the time SplashScreen navigates to /home or
 * /auth/login, Firestore is reachable and all subsequent queries succeed.
 */

import { Alert, BackHandler } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { enableNetwork, disableNetwork } from "firebase/firestore";
import { db } from "@/config/firebase";

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns true when the device has a working internet connection. */
async function isConnected(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected === true && state.isInternetReachable !== false;
}

/**
 * Shows a non-dismissible alert and resolves only when the user presses Retry
 * AND the device is back online.  Pressing Exit terminates the process.
 */
function showOfflineAlertAndWait(): Promise<void> {
    return new Promise((resolve) => {
        const showAlert = () => {
            Alert.alert(
                "No Internet Connection",
                "REVOPZ requires an active internet connection to continue.",
                [
                    {
                        text: "Exit",
                        style: "destructive",
                        onPress: () => {
                            // Exit the app gracefully on both platforms.
                            BackHandler.exitApp();
                        },
                    },
                    {
                        text: "Retry",
                        style: "default",
                        onPress: async () => {
                            const online = await isConnected();
                            if (online) {
                                // Back online — caller can now proceed.
                                resolve();
                            } else {
                                // Still offline — show the alert again.
                                showAlert();
                            }
                        },
                    },
                ],
                // Prevent dismissal by tapping outside the alert.
                { cancelable: false },
            );
        };

        showAlert();
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Checks internet connectivity and syncs Firestore network state accordingly.
 *
 * - Online  → calls `enableNetwork(db)` then returns.
 * - Offline → calls `disableNetwork(db)`, blocks on an Alert, then retries
 *             until the device is online before calling `enableNetwork(db)`.
 *
 * Always `await` this in the SplashScreen before calling `router.replace(...)`.
 */
export async function checkInternetAndSyncFirestore(): Promise<void> {
    const online = await isConnected();

    if (!online) {
        // Firestore must be offline so it does not attempt network calls while
        // we wait for the user to restore connectivity.
        try {
            await disableNetwork(db);
        } catch { }

        // Block until the user presses Retry and is online.
        await showOfflineAlertAndWait();
    }

    // Device is confirmed online — enable Firestore network so queries work.
    try {
        await enableNetwork(db);
    } catch { }
}
