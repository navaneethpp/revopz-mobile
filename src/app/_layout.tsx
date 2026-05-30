import { useEffect, useRef, useState } from "react";
import { AppState, StyleSheet, Text, TouchableOpacity, View, BackHandler, Platform } from "react-native";
import { Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import NetInfo from "@react-native-community/netinfo";

import { AuthProvider } from "@/context/AuthContext";
import { AlertProvider, GlobalAlertSetter, Alert } from "@/context/AlertContext";
import { db } from "@/config/firebase";
import { enableNetwork, disableNetwork } from "firebase/firestore";

export default function RootLayout() {
    const [isLocked, setIsLocked] = useState(false);
    const appState = useRef(AppState.currentState);
    const retryIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    const authenticate = async () => {
        try {
            // Check if biometrics/passcode are supported and enrolled
            const hasHardware = await LocalAuthentication.hasHardwareAsync();
            const isEnrolled = await LocalAuthentication.isEnrolledAsync();

            if (!hasHardware || !isEnrolled) {
                // If the device does not support or have biometrics set up,
                // do not lock the user out, just bypass.
                setIsLocked(false);
                return;
            }

            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: "Unlock Revopz",
                fallbackLabel: "Use PIN/Passcode",
                disableDeviceFallback: false, // fallback to device PIN/Passcode
            });

            if (result.success) {
                setIsLocked(false);
            } else {
                setIsLocked(true);
            }
        } catch (e) {
            setIsLocked(true);
        }
    };

    const isOfflineAlertShowing = useRef(false);

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
                                const online = state.isConnected !== false && state.isInternetReachable !== false;
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

    useEffect(() => {
        // Initial lock check on launch
        SecureStore.getItemAsync("biometric_enabled").then((enabled) => {
            if (enabled === "true") {
                setIsLocked(true);
                // Tiny timeout to let the app finish mounting before prompting
                setTimeout(() => {
                    authenticate();
                }, 400);
            }
        });

        // AppState change listener for resume/background
        const subscription = AppState.addEventListener("change", (nextAppState) => {
            if (
                appState.current.match(/inactive|background/) &&
                nextAppState === "active"
            ) {
                // App is returning to foreground
                SecureStore.getItemAsync("biometric_enabled").then((enabled) => {
                    if (enabled === "true") {
                        setIsLocked(true);
                        authenticate();
                    }
                });
            }
            appState.current = nextAppState;
        });

        return () => {
            subscription.remove();
        };
    }, []);

    // NAV-03: Consume Android hardware back press while the biometric lock
    // overlay is active. Without this, back press can pop navigation screens
    // behind the overlay without unlocking the app.
    useEffect(() => {
        if (!isLocked) return;
        const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
        return () => sub.remove();
    }, [isLocked]);

    return (
        <AuthProvider>
            <AlertProvider>
                <GlobalAlertSetter />
                <View style={{ flex: 1 }}>
                    <Stack screenOptions={{ headerShown: false }} />

                    {/* Premium Lock Overlay */}
                    {isLocked && (
                        <View style={styles.lockOverlay}>
                            <View style={styles.lockContainer}>
                                {/* Lock Icon */}
                                <View style={styles.iconCircle}>
                                    <Feather name="lock" size={32} color="#D97706" />
                                </View>

                                <Text style={styles.lockTitle}>REVOPZ</Text>
                                <Text style={styles.lockSubtitle}>
                                    App is locked. Verify your identity to continue.
                                </Text>

                                {/* Unlock Trigger Button */}
                                <TouchableOpacity
                                    style={styles.unlockBtn}
                                    onPress={authenticate}
                                    activeOpacity={0.8}
                                >
                                    <Feather name="shield" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                                    <Text style={styles.unlockText}>Verify Identity</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </AlertProvider>
        </AuthProvider>
    );
}

const styles = StyleSheet.create({
    lockOverlay: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "#FFFFFF", // Fully opaque to protect app content
        zIndex: 999999, // Ensure it sits on top of everything
        alignItems: "center",
        justifyContent: "center",
    },
    lockContainer: {
        alignItems: "center",
        paddingHorizontal: 32,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: "#FEF3C7", // Light amber matching Revopz theme
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
    },
    lockTitle: {
        fontSize: 26,
        fontWeight: "900",
        color: "#D97706",
        letterSpacing: 1.5,
        marginBottom: 8,
    },
    lockSubtitle: {
        fontSize: 15,
        color: "#64748B",
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 36,
    },
    unlockBtn: {
        backgroundColor: "#D97706",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 12,
        shadowColor: "#D97706",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    unlockText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
});
