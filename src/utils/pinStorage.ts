/**
 * src/utils/pinStorage.ts
 *
 * Encapsulated storage wrappers using expo-secure-store to manage
 * user PIN code configuration and settings securely.
 */
import * as SecureStore from "expo-secure-store";

const KEYS = {
    PIN: "revopz_app_pin",
    ENABLED: "revopz_app_lock_enabled",
    TIMEOUT: "revopz_app_lock_timeout",
} as const;

/**
 * Persists the 4-digit PIN securely.
 */
export async function setAppPin(pin: string): Promise<void> {
    try {
        await SecureStore.setItemAsync(KEYS.PIN, pin);
        // Automatically enable App Lock when a PIN is set for the first time
        await SecureStore.setItemAsync(KEYS.ENABLED, "true");
    } catch (err) {
        throw new Error("Failed to save PIN securely. Please try again.");
    }
}

/**
 * Verifies if the entered PIN matches the securely stored PIN.
 */
export async function verifyAppPin(pin: string): Promise<boolean> {
    try {
        const stored = await SecureStore.getItemAsync(KEYS.PIN);
        return stored === pin;
    } catch {
        return false;
    }
}

/**
 * Checks whether an App PIN has been configured.
 */
export async function isPinSet(): Promise<boolean> {
    try {
        const stored = await SecureStore.getItemAsync(KEYS.PIN);
        return !!stored;
    } catch {
        return false;
    }
}

/**
 * Clears the PIN and all associated security configurations.
 */
export async function clearPin(): Promise<void> {
    try {
        await Promise.all([
            SecureStore.deleteItemAsync(KEYS.PIN),
            SecureStore.deleteItemAsync(KEYS.ENABLED),
            SecureStore.deleteItemAsync(KEYS.TIMEOUT),
        ]);
    } catch { }
}

/**
 * Checks whether App Lock is enabled (defaults to true if a PIN exists).
 */
export async function getAppLockEnabled(): Promise<boolean> {
    try {
        const enabled = await SecureStore.getItemAsync(KEYS.ENABLED);
        if (enabled === null) {
            // Default to true if a PIN exists
            return await isPinSet();
        }
        return enabled === "true";
    } catch {
        return false;
    }
}

/**
 * Toggles the App Lock security configuration.
 */
export async function setAppLockEnabled(enabled: boolean): Promise<void> {
    try {
        await SecureStore.setItemAsync(KEYS.ENABLED, enabled ? "true" : "false");
    } catch (err) {
        throw new Error("Failed to update App Lock settings.");
    }
}

/**
 * Gets the configured app resume lock timeout (in seconds).
 * Default timeout is 30 seconds.
 */
export async function getResumeTimeout(): Promise<number> {
    try {
        const val = await SecureStore.getItemAsync(KEYS.TIMEOUT);
        if (val === null) return 30; // default 30s
        return parseInt(val, 10);
    } catch {
        return 30;
    }
}

/**
 * Configures the app resume lock timeout (in seconds).
 * Common options: 0 (Immediately), 30 (30s), 60 (1m).
 */
export async function setResumeTimeout(timeoutSeconds: number): Promise<void> {
    try {
        await SecureStore.setItemAsync(KEYS.TIMEOUT, timeoutSeconds.toString());
    } catch {
        throw new Error("Failed to update resume timeout settings.");
    }
}
