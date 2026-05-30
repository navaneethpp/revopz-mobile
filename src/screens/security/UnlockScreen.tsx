/**
 * src/screens/security/UnlockScreen.tsx
 *
 * App unlock screen: prompts for biometrics on mount, falls back to secure PIN
 * entry, handles persistent lockout for wrong attempts, and blocks navigation.
 */
import React, { useEffect, useRef, useState } from "react";
import {
    BackHandler,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

import { Alert } from "@/context/AlertContext";
import { verifyAppPin } from "@/utils/pinStorage";
import {
    getLockoutRemainingTime,
    registerFailedAttempt,
    resetFailedAttempts,
} from "@/services/securityService";
import { triggerHaptic } from "@/utils/haptics";
import { COLORS } from "@/theme/colors";
import { FONT_SIZE, FONT_WEIGHT } from "@/theme/typography";
import { SPACING } from "@/theme/spacing";

interface UnlockScreenProps {
    onUnlock: () => void;
}

export default function UnlockScreen({ onUnlock }: UnlockScreenProps) {
    const [pin, setPin] = useState("");
    const [errorMsg, setErrorMsg] = useState("");
    const [lockoutSeconds, setLockoutSeconds] = useState(0);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);
    const [isAuthenticating, setIsAuthenticating] = useState(false);

    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const isUnlockedRef = useRef(false);

    // Block back navigation on Android
    useEffect(() => {
        const backAction = () => true; // Consume action
        const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
        return () => backHandler.remove();
    }, []);

    // Check lockout on mount
    useEffect(() => {
        checkLockout();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Load biometric preferences and trigger biometric authenticate on mount
    useEffect(() => {
        Promise.all([
            LocalAuthentication.hasHardwareAsync(),
            LocalAuthentication.isEnrolledAsync(),
            SecureStore.getItemAsync("biometric_enabled"),
        ]).then(([hasHardware, isEnrolled, enabledVal]) => {
            const supported = hasHardware && isEnrolled;
            setIsBiometricSupported(supported);
            const enabled = enabledVal === "true";
            setBiometricEnabled(enabled);

            // Auto-trigger biometric verification if set up & not locked out
            if (supported && enabled) {
                // Short timeout to allow layout to mount
                setTimeout(() => {
                    handleBiometricUnlock();
                }, 300);
            }
        });
    }, []);

    const checkLockout = async () => {
        const remaining = await getLockoutRemainingTime();
        if (remaining > 0) {
            startLockoutTimer(remaining);
        }
    };

    const startLockoutTimer = (seconds: number) => {
        setLockoutSeconds(seconds);
        setPin("");
        setErrorMsg("");

        if (timerRef.current) clearInterval(timerRef.current);

        timerRef.current = setInterval(async () => {
            const rem = await getLockoutRemainingTime();
            if (rem <= 0) {
                if (timerRef.current) clearInterval(timerRef.current);
                setLockoutSeconds(0);
            } else {
                setLockoutSeconds(rem);
            }
        }, 1000);
    };

    const handleKeyPress = async (num: string) => {
        if (lockoutSeconds > 0) return;
        triggerHaptic("light");
        setErrorMsg("");

        if (pin.length >= 4) return;

        const nextPin = pin + num;
        setPin(nextPin);

        if (nextPin.length === 4) {
            handleVerifyPin(nextPin);
        }
    };

    const handleDelete = () => {
        if (lockoutSeconds > 0) return;
        triggerHaptic("light");
        setPin((prev) => prev.slice(0, -1));
    };

    const handleVerifyPin = async (inputPin: string) => {
        if (isUnlockedRef.current) return;
        const isValid = await verifyAppPin(inputPin);
        if (isValid) {
            isUnlockedRef.current = true;
            triggerHaptic("success");
            await resetFailedAttempts();
            onUnlock();
        } else {
            triggerHaptic("warning");
            const count = await registerFailedAttempt();
            const remaining = await getLockoutRemainingTime();

            if (remaining > 0) {
                startLockoutTimer(remaining);
            } else {
                setPin("");
                setErrorMsg(`Incorrect passcode. attempt ${count} of 5.`);
            }
        }
    };

    const handleBiometricUnlock = async () => {
        if (lockoutSeconds > 0 || isUnlockedRef.current || isAuthenticating) return;
        setIsAuthenticating(true);
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: "Unlock REVOPZ",
                fallbackLabel: "Use Passcode",
                disableDeviceFallback: false,
            });

            if (result.success) {
                isUnlockedRef.current = true;
                triggerHaptic("success");
                await resetFailedAttempts();
                onUnlock();
            }
        } catch {
            // Biometrics failed or cancelled by user, let them use PIN
        } finally {
            setIsAuthenticating(false);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* Header info */}
            <View style={styles.header}>
                <Text style={styles.brandTitle}>REVOPZ</Text>
                <Text style={styles.title}>Unlock App</Text>
                <Text style={styles.subtitle}>
                    {lockoutSeconds > 0
                        ? "App locked due to too many failed attempts"
                        : "Enter your 4-digit security passcode to continue"}
                </Text>
            </View>

            {/* Verification dots / Lockout timer */}
            <View style={styles.centerSection}>
                {lockoutSeconds > 0 ? (
                    <View style={styles.lockoutBox}>
                        <MaterialCommunityIcons name="lock-clock" size={48} color={COLORS.red600} style={{ marginBottom: 12 }} />
                        <Text style={styles.lockoutTitle}>Too many incorrect attempts</Text>
                        <Text style={styles.lockoutTimer}>
                            Try again in {lockoutSeconds} seconds
                        </Text>
                    </View>
                ) : (
                    <View style={styles.dotsContainer}>
                        {[0, 1, 2, 3].map((idx) => {
                            const filled = pin.length > idx;
                            return (
                                <View
                                    key={idx}
                                    style={[
                                        styles.dot,
                                        filled && styles.dotFilled,
                                        errorMsg !== "" && styles.dotError,
                                    ]}
                                />
                            );
                        })}
                    </View>
                )}
            </View>

            {/* Error Message */}
            <View style={styles.errorContainer}>
                {errorMsg && lockoutSeconds === 0 ? (
                    <Text style={styles.errorText}>{errorMsg}</Text>
                ) : null}
            </View>

            {/* Keypad */}
            <View style={styles.keypad}>
                {/* Rows 1-3 */}
                {[
                    ["1", "2", "3"],
                    ["4", "5", "6"],
                    ["7", "8", "9"],
                ].map((row, rowIdx) => (
                    <View key={rowIdx} style={styles.row}>
                        {row.map((num) => (
                            <TouchableOpacity
                                key={num}
                                style={[styles.key, lockoutSeconds > 0 && styles.keyDisabled]}
                                activeOpacity={0.6}
                                onPress={() => handleKeyPress(num)}
                                disabled={lockoutSeconds > 0}
                            >
                                <Text style={[styles.keyText, lockoutSeconds > 0 && styles.keyTextDisabled]}>{num}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}

                {/* Last Row (Biometric / Passcode switch, 0, Delete) */}
                <View style={styles.row}>
                    {isBiometricSupported && biometricEnabled ? (
                        <TouchableOpacity
                            style={[styles.key, lockoutSeconds > 0 && styles.keyDisabled]}
                            activeOpacity={0.6}
                            onPress={handleBiometricUnlock}
                            disabled={lockoutSeconds > 0}
                        >
                            <MaterialCommunityIcons
                                name="fingerprint"
                                size={28}
                                color={lockoutSeconds > 0 ? COLORS.slate300 : COLORS.warning}
                            />
                        </TouchableOpacity>
                    ) : (
                        <View style={styles.keyEmpty} />
                    )}

                    <TouchableOpacity
                        style={[styles.key, lockoutSeconds > 0 && styles.keyDisabled]}
                        activeOpacity={0.6}
                        onPress={() => handleKeyPress("0")}
                        disabled={lockoutSeconds > 0}
                    >
                        <Text style={[styles.keyText, lockoutSeconds > 0 && styles.keyTextDisabled]}>0</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.key, lockoutSeconds > 0 && styles.keyDisabled]}
                        activeOpacity={0.6}
                        onPress={handleDelete}
                        disabled={lockoutSeconds > 0}
                    >
                        <Feather
                            name="delete"
                            size={24}
                            color={lockoutSeconds > 0 ? COLORS.slate300 : COLORS.slate800}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
        justifyContent: "space-between",
        paddingVertical: SPACING.xl,
    },
    header: {
        alignItems: "center",
        paddingHorizontal: SPACING.lg,
        marginTop: SPACING.md,
    },
    brandTitle: {
        fontSize: 16,
        fontWeight: FONT_WEIGHT.bold as any,
        color: COLORS.warning,
        letterSpacing: 1.5,
        marginBottom: SPACING.sm,
    },
    title: {
        fontSize: 22,
        fontWeight: FONT_WEIGHT.bold as any,
        color: COLORS.slate800,
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: "center",
        lineHeight: 20,
        paddingHorizontal: SPACING.sm,
    },
    centerSection: {
        justifyContent: "center",
        alignItems: "center",
        marginVertical: SPACING.lg,
        minHeight: 120,
    },
    dotsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: COLORS.slate300,
        backgroundColor: "transparent",
    },
    dotFilled: {
        borderColor: COLORS.warning,
        backgroundColor: COLORS.warning,
    },
    dotError: {
        borderColor: COLORS.red600,
        backgroundColor: COLORS.red600,
    },
    lockoutBox: {
        alignItems: "center",
        paddingHorizontal: SPACING.lg,
    },
    lockoutTitle: {
        fontSize: 16,
        fontWeight: FONT_WEIGHT.semibold as any,
        color: COLORS.red600,
        marginBottom: 4,
    },
    lockoutTimer: {
        fontSize: 14,
        color: COLORS.textMuted,
    },
    errorContainer: {
        height: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    errorText: {
        fontSize: 14,
        color: COLORS.red600,
        fontWeight: "500",
    },
    keypad: {
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: SPACING.md,
    },
    key: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: COLORS.slate50,
        alignItems: "center",
        justifyContent: "center",
    },
    keyDisabled: {
        backgroundColor: COLORS.slate100,
    },
    keyEmpty: {
        width: 80,
        height: 80,
    },
    keyText: {
        fontSize: 26,
        fontWeight: "600",
        color: COLORS.slate800,
    },
    keyTextDisabled: {
        color: COLORS.slate300,
    },
});
