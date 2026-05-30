/**
 * src/screens/security/CreatePinScreen.tsx
 *
 * Provides a premium, banking-app inspired 4-digit PIN setup screen
 * containing a custom virtual keypad, confirmation entry, and haptic feedback.
 */
import React, { useState } from "react";
import {
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";

import { Alert } from "@/context/AlertContext";
import { setAppPin } from "@/utils/pinStorage";
import { triggerHaptic } from "@/utils/haptics";
import { COLORS } from "@/theme/colors";
import { FONT_SIZE, FONT_WEIGHT } from "@/theme/typography";
import { SPACING } from "@/theme/spacing";

export default function CreatePinScreen() {
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [isConfirming, setIsConfirming] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    const handleKeyPress = (num: string) => {
        triggerHaptic("light");
        setErrorMsg("");

        const currentVal = isConfirming ? confirmPin : pin;
        if (currentVal.length >= 4) return;

        const nextVal = currentVal + num;
        if (isConfirming) {
            setConfirmPin(nextVal);
            if (nextVal.length === 4) {
                // Confirm input match
                handleVerifyAndSave(pin, nextVal);
            }
        } else {
            setPin(nextVal);
            if (nextVal.length === 4) {
                // Move to confirmation step after a small delay for visual feedback
                setTimeout(() => {
                    setIsConfirming(true);
                }, 200);
            }
        }
    };

    const handleDelete = () => {
        triggerHaptic("light");
        if (isConfirming) {
            setConfirmPin((prev) => prev.slice(0, -1));
        } else {
            setPin((prev) => prev.slice(0, -1));
        }
    };

    const handleVerifyAndSave = async (primary: string, confirmation: string) => {
        if (primary === confirmation) {
            try {
                await setAppPin(primary);
                triggerHaptic("success");
                Alert.alert("Success", "Security passcode configured successfully.", [
                    {
                        text: "Continue",
                        onPress: () => router.replace("/home"),
                    },
                ]);
            } catch (err: any) {
                triggerHaptic("warning");
                Alert.alert("Configuration Error", err?.message || "Failed to configure PIN.");
                handleReset();
            }
        } else {
            triggerHaptic("warning");
            setErrorMsg("Passcodes do not match. Please try again.");
            // Reset confirmation field with visual error
            setTimeout(() => {
                setConfirmPin("");
            }, 300);
        }
    };

    const handleReset = () => {
        setPin("");
        setConfirmPin("");
        setIsConfirming(false);
        setErrorMsg("");
    };

    const activeVal = isConfirming ? confirmPin : pin;

    return (
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Header info */}
            <View style={styles.header}>
                <Text style={styles.brandTitle}>REVOPZ</Text>
                <Text style={styles.title}>
                    {isConfirming ? "Confirm App PIN" : "Create App PIN"}
                </Text>
                <Text style={styles.subtitle}>
                    {isConfirming
                        ? "Enter your 4-digit passcode again to verify identity"
                        : "Configure a secure 4-digit passcode for app level protection"}
                </Text>
            </View>

            {/* Verification dots */}
            <View style={styles.dotsContainer}>
                {[0, 1, 2, 3].map((idx) => {
                    const filled = activeVal.length > idx;
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

            {/* Error Message */}
            <View style={styles.errorContainer}>
                {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
            </View>

            {/* Numeric virtual keypad */}
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
                                style={styles.key}
                                activeOpacity={0.6}
                                onPress={() => handleKeyPress(num)}
                            >
                                <Text style={styles.keyText}>{num}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}

                {/* Last Row (Reset, 0, Delete) */}
                <View style={styles.row}>
                    <TouchableOpacity
                        style={styles.key}
                        activeOpacity={0.6}
                        onPress={handleReset}
                    >
                        <Text style={styles.actionText}>Reset</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.key}
                        activeOpacity={0.6}
                        onPress={() => handleKeyPress("0")}
                    >
                        <Text style={styles.keyText}>0</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.key}
                        activeOpacity={0.6}
                        onPress={handleDelete}
                    >
                        <Feather name="delete" size={24} color="#1E293B" />
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#FFFFFF",
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
        color: "#D97706", // Amber branding
        letterSpacing: 1.5,
        marginBottom: SPACING.sm,
    },
    title: {
        fontSize: 22,
        fontWeight: FONT_WEIGHT.bold as any,
        color: "#1E293B",
        marginBottom: SPACING.xs,
    },
    subtitle: {
        fontSize: 14,
        color: "#64748B",
        textAlign: "center",
        lineHeight: 20,
    },
    dotsContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 24,
        marginVertical: SPACING.lg,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: "#CBD5E1",
        backgroundColor: "transparent",
    },
    dotFilled: {
        borderColor: "#D97706",
        backgroundColor: "#D97706",
    },
    dotError: {
        borderColor: "#DC2626",
        backgroundColor: "#DC2626",
    },
    errorContainer: {
        height: 24,
        alignItems: "center",
        justifyContent: "center",
    },
    errorText: {
        fontSize: 14,
        color: "#DC2626",
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
        backgroundColor: "#F8FAFC",
        alignItems: "center",
        justifyContent: "center",
    },
    keyText: {
        fontSize: 26,
        fontWeight: "600",
        color: "#1E293B",
    },
    actionText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#64748B",
    },
});
