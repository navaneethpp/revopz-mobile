import { useEffect, useRef, useState } from "react";
import { AppState, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Stack } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { AuthProvider } from "@/context/AuthContext";

export default function RootLayout() {
    const [isLocked, setIsLocked] = useState(false);
    const appState = useRef(AppState.currentState);

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
            console.error("[RootLayout] Authentication error:", e);
            setIsLocked(true);
        }
    };

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

    return (
        <AuthProvider>
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
