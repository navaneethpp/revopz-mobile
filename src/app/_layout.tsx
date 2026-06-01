import { useEffect, useRef, useState } from "react";
import { AppState, StyleSheet, View, BackHandler, Platform } from "react-native";
import { Stack } from "expo-router";
import NetInfo from "@react-native-community/netinfo";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AlertProvider, GlobalAlertSetter, Alert } from "@/context/AlertContext";
import { db } from "@/config/firebase";
import { enableNetwork, disableNetwork } from "firebase/firestore";
import { useAppLock } from "@/hooks/useAppLock";
import UnlockScreen from "@/screens/security/UnlockScreen";

export default function RootLayout() {
    return (
        <AuthProvider>
            <AlertProvider>
                <GlobalAlertSetter />
                <AppContent />
            </AlertProvider>
        </AuthProvider>
    );
}

function AppContent() {
    const { user, authReady } = useAuth();
    const [isLocked, setIsLocked] = useState(false);
    
    const retryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isOfflineAlertShowing = useRef(false);

    const clearRetryTimers = () => {
        if (retryIntervalRef.current) {
            clearInterval(retryIntervalRef.current);
            retryIntervalRef.current = null;
        }
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
    };

    const showOfflineAlert = () => {
        if (isOfflineAlertShowing.current) return;
        isOfflineAlertShowing.current = true;

        Alert.alert(
            "No Internet Connection",
            "This application requires an active internet connection. Please verify your network settings and try again.",
            [
                {
                    text: "Retry",
                    onPress: () => {
                        isOfflineAlertShowing.current = false;
                        Alert.dismiss();

                        clearRetryTimers();

                        // Show loader modal
                        Alert.showLoading("Verifying network connection...");

                        let isConnected = false;

                        // Check network every 2 seconds
                        retryIntervalRef.current = setInterval(async () => {
                            try {
                                const state = await NetInfo.fetch();
                                const online = state.isConnected === true && state.isInternetReachable === true;
                                if (online) {
                                    isConnected = true;
                                    clearRetryTimers();
                                    Alert.hideLoading();

                                    // Start/Resume Firestore network connection
                                    enableNetwork(db).catch(() => {});
                                }
                            } catch { }
                        }, 2000);

                        // Timeout after 1 minute (60 seconds) — NET-02: re-show alert
                        // with an explanatory message so user knows why retry expired.
                        retryTimeoutRef.current = setTimeout(() => {
                            clearRetryTimers();
                            Alert.hideLoading();
                            if (!isConnected) {
                                isOfflineAlertShowing.current = false;
                                Alert.alert(
                                    "Connection Timed Out",
                                    "Could not verify your connection within 60 seconds. Please check your network settings and try again.",
                                    [
                                        {
                                            text: "Retry",
                                            onPress: () => {
                                                isOfflineAlertShowing.current = false;
                                                showOfflineAlert();
                                            },
                                        },
                                        {
                                            text: "Exit",
                                            style: "destructive",
                                            onPress: () => {
                                                isOfflineAlertShowing.current = false;
                                                if (Platform.OS === "android") {
                                                    BackHandler.exitApp();
                                                }
                                            },
                                        },
                                    ],
                                    { cancelable: false }
                                );
                            }
                        }, 60000);
                    },
                },
                {
                    text: "Exit",
                    style: "destructive",
                    onPress: () => {
                        isOfflineAlertShowing.current = false;
                        if (Platform.OS === "android") {
                            BackHandler.exitApp();
                        } else {
                            try {
                                const process = require("process");
                                process.exit(0);
                            } catch {
                                try {
                                    (globalThis as any).exit?.(0);
                                } catch { }
                            }
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    };

    useEffect(() => {
        // NET-03: strict isInternetReachable check — null (captive portal) treated as offline
        const handleNetworkChange = (offline: boolean) => {
            if (offline) {
                disableNetwork(db).catch(() => {});
            } else {
                enableNetwork(db).catch(() => {});
            }
        };

        // NET-01: The splash screen already handles startup connectivity, so we
        // only need addEventListener here for mid-session drops. Removing the
        // one-time NetInfo.fetch() startup check prevents duplicate offline alerts.
        const unsubscribe = NetInfo.addEventListener((state: any) => {
            // Treat isInternetReachable===null (captive portal) as offline (NET-03)
            const offline = state.isConnected !== true || state.isInternetReachable !== true;
            handleNetworkChange(offline);
            if (offline) {
                showOfflineAlert();
            } else {
                clearRetryTimers();
                Alert.hideLoading();
                if (isOfflineAlertShowing.current) {
                    isOfflineAlertShowing.current = false;
                    Alert.dismiss();
                }
            }
        });

        return () => {
            unsubscribe();
            clearRetryTimers();
        };
    }, []);

    // Enforce lock verification transitions
    useAppLock({
        onLock: () => setIsLocked(true),
        authReady,
        isLoggedIn: !!user,
    });

    return (
        <View style={styles.container}>
            <Stack screenOptions={{ headerShown: false }} />

            {/* Premium Full-Screen Unlock Overlay (Biometric / PIN keypad fallback) */}
            {isLocked && (
                <View style={styles.lockOverlay}>
                    <UnlockScreen onUnlock={() => setIsLocked(false)} />
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    lockOverlay: {
        ...StyleSheet.absoluteFill,
        zIndex: 999999, // Render on top of stack
    },
});
