/**
 * src/hooks/useAppLock.ts
 *
 * Listens to React Native AppState changes and triggers onLock()
 * when the app remains backgrounded past the user-configured lock timeout.
 */
import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { isPinSet, getAppLockEnabled, getResumeTimeout } from "@/utils/pinStorage";

interface UseAppLockProps {
    onLock: () => void;
    authReady: boolean;
    isLoggedIn: boolean;
}

export function useAppLock({ onLock, authReady, isLoggedIn }: UseAppLockProps) {
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);
    const backgroundTimestampRef = useRef<number | null>(null);
    const hasCheckedInitialLockRef = useRef(false);

    // Keep onLock updated in a ref to avoid effect re-subscriptions
    const onLockRef = useRef(onLock);
    useEffect(() => {
        onLockRef.current = onLock;
    }, [onLock]);

    useEffect(() => {
        if (!authReady) return;

        if (!isLoggedIn) {
            hasCheckedInitialLockRef.current = false;
            backgroundTimestampRef.current = null;
            return;
        }

        // Perform initial lock check on launch or login
        if (!hasCheckedInitialLockRef.current) {
            hasCheckedInitialLockRef.current = true;
            const checkInitialLock = async () => {
                const hasPin = await isPinSet();
                const isEnabled = await getAppLockEnabled();
                if (hasPin && isEnabled) {
                    onLockRef.current();
                }
            };
            checkInitialLock();
        }

        const handleAppStateChange = async (nextAppState: AppStateStatus) => {
            const currentAppState = appStateRef.current;

            // Transition: active -> background/inactive
            if (currentAppState === "active" && nextAppState.match(/inactive|background/)) {
                backgroundTimestampRef.current = Date.now();
            }

            // Transition: background/inactive -> active
            if (currentAppState.match(/inactive|background/) && nextAppState === "active") {
                const hasPin = await isPinSet();
                const isEnabled = await getAppLockEnabled();

                if (hasPin && isEnabled && backgroundTimestampRef.current !== null) {
                    const elapsedMs = Date.now() - backgroundTimestampRef.current;
                    const timeoutSeconds = await getResumeTimeout();
                    const timeoutMs = timeoutSeconds * 1000;

                    if (elapsedMs >= timeoutMs) {
                        onLockRef.current();
                    }
                }
                backgroundTimestampRef.current = null;
            }

            appStateRef.current = nextAppState;
        };

        const subscription = AppState.addEventListener("change", handleAppStateChange);

        return () => {
            subscription.remove();
        };
    }, [authReady, isLoggedIn]);
}
