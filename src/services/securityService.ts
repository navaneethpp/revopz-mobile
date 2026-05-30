/**
 * src/services/securityService.ts
 *
 * Implements lockout prevention logic after multiple incorrect PIN entries.
 * State persists in SecureStore to prevent bypass via app restarts.
 */
import * as SecureStore from "expo-secure-store";

const KEYS = {
    FAILED_ATTEMPTS: "revopz_failed_attempts",
    LOCKOUT_TIMESTAMP: "revopz_lockout_ts",
} as const;

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 1000; // 30 seconds

/**
 * Registers an incorrect PIN entry attempt.
 * Increments count, and triggers lockout if >= 5 attempts.
 */
export async function registerFailedAttempt(): Promise<number> {
    try {
        const rawCount = await SecureStore.getItemAsync(KEYS.FAILED_ATTEMPTS);
        let count = rawCount ? parseInt(rawCount, 10) : 0;
        count += 1;
        
        await SecureStore.setItemAsync(KEYS.FAILED_ATTEMPTS, count.toString());

        if (count >= MAX_ATTEMPTS) {
            const now = Date.now();
            await SecureStore.setItemAsync(KEYS.LOCKOUT_TIMESTAMP, now.toString());
        }

        return count;
    } catch {
        return 1;
    }
}

/**
 * Checks if the user is currently locked out and returns the remaining time (in seconds).
 * Returns 0 if not locked out or if the lockout period has expired.
 */
export async function getLockoutRemainingTime(): Promise<number> {
    try {
        const lockoutTs = await SecureStore.getItemAsync(KEYS.LOCKOUT_TIMESTAMP);
        if (!lockoutTs) return 0;

        const start = parseInt(lockoutTs, 10);
        const elapsed = Date.now() - start;

        if (elapsed >= LOCKOUT_DURATION_MS) {
            // Lockout expired — clear metrics
            await resetFailedAttempts();
            return 0;
        }

        const remainingMs = LOCKOUT_DURATION_MS - elapsed;
        return Math.max(Math.ceil(remainingMs / 1000), 0);
    } catch {
        return 0;
    }
}

/**
 * Clears failed attempts and resets the lockout state on successful verification.
 */
export async function resetFailedAttempts(): Promise<void> {
    try {
        await Promise.all([
            SecureStore.deleteItemAsync(KEYS.FAILED_ATTEMPTS),
            SecureStore.deleteItemAsync(KEYS.LOCKOUT_TIMESTAMP),
        ]);
    } catch { }
}

/**
 * Retrieves the current number of failed attempts.
 */
export async function getFailedAttemptsCount(): Promise<number> {
    try {
        const count = await SecureStore.getItemAsync(KEYS.FAILED_ATTEMPTS);
        return count ? parseInt(count, 10) : 0;
    } catch {
        return 0;
    }
}
