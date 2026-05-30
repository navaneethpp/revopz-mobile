import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Switch, ScrollView, Modal, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";

import { COLORS } from "@/theme/colors";
import { Alert } from "@/context/AlertContext";
import HeaderBar from "@/components/ui/HeaderBar";
import { logoutUser, resetPassword } from "@/services/authService";
import { getSession } from "@/utils/storage";
import { triggerHaptic, updateHapticsCache } from "@/utils/haptics";
import CustomInput from "@/components/ui/CustomInput";
import { checkPasswordRequirements, isPasswordValid } from "@/utils/passwordValidator";
import {
    getAppLockEnabled,
    setAppLockEnabled,
    getResumeTimeout,
    setResumeTimeout,
    isPinSet,
} from "@/utils/pinStorage";
import type { SessionData } from "@/types/auth";

export default function SettingsScreen() {
    const [session, setSession] = useState<SessionData | null>(null);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [hapticEnabled, setHapticEnabled] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);

    // App Lock PIN security settings
    const [appLockEnabled, setAppLockEnabledState] = useState(false);
    const [resumeTimeout, setResumeTimeoutState] = useState(30);
    const [hasPin, setHasPinState] = useState(false);

    // Reset password states
    const [resetModalVisible, setResetModalVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const [resetErrors, setResetErrors] = useState({ current: "", newPassword: "", confirm: "" });

    const closeResetModal = () => {
        setResetModalVisible(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setResetLoading(false);
        setResetErrors({ current: "", newPassword: "", confirm: "" });
    };

    const handleResetPassword = async () => {
        const newErrors = { current: "", newPassword: "", confirm: "" };
        let hasError = false;

        if (!currentPassword) {
            newErrors.current = "Current password is required.";
            hasError = true;
        }

        const reqs = checkPasswordRequirements(newPassword);
        if (!newPassword) {
            newErrors.newPassword = "New password is required.";
            hasError = true;
        } else if (!isPasswordValid(reqs)) {
            newErrors.newPassword = "New password does not meet requirements.";
            hasError = true;
        }

        if (!confirmPassword) {
            newErrors.confirm = "Confirm password is required.";
            hasError = true;
        } else if (newPassword !== confirmPassword) {
            newErrors.confirm = "Passwords do not match.";
            hasError = true;
        }

        if (hasError) {
            setResetErrors(newErrors);
            triggerHaptic("error");
            return;
        }

        setResetLoading(true);
        try {
            await resetPassword(currentPassword, newPassword);
            closeResetModal();
            triggerHaptic("success");
            Alert.alert(
                "Success",
                "Password has been changed successfully.",
                [{ text: "OK" }]
            );
        } catch (err: any) {
            triggerHaptic("error");
            Alert.alert(
                "Error",
                err.message || "Failed to update password. Please try again.",
                [{ text: "OK" }]
            );
        } finally {
            setResetLoading(false);
        }
    };

    const reqs = checkPasswordRequirements(newPassword);

    const RequirementRow = ({ label, met }: { label: string; met: boolean }) => (
        <View style={styles.reqRow}>
            <Feather
                name={met ? "check-circle" : "circle"}
                size={14}
                color={met ? COLORS.success : COLORS.gray400}
                style={{ marginRight: 8 }}
            />
            <Text style={[styles.reqText, met && styles.reqTextMet]}>
                {label}
            </Text>
        </View>
    );

    useEffect(() => {
        // Load user session
        getSession().then(setSession);

        // Load settings from SecureStore
        SecureStore.getItemAsync("biometric_enabled").then((val) => {
            if (val !== null) setBiometricEnabled(val === "true");
        });
        SecureStore.getItemAsync("haptic_enabled").then((val) => {
            if (val !== null) setHapticEnabled(val === "true");
        });

        // Check if biometric authentication is supported and enrolled
        Promise.all([
            LocalAuthentication.hasHardwareAsync(),
            LocalAuthentication.isEnrolledAsync(),
        ]).then(([hasHardware, isEnrolled]) => {
            setIsBiometricSupported(hasHardware && isEnrolled);
        });

        // Load PIN lock configurations
        getAppLockEnabled().then(setAppLockEnabledState);
        getResumeTimeout().then(setResumeTimeoutState);
        isPinSet().then(setHasPinState);
    }, []);

    // Listen to focus changes to refresh hasPin status (e.g. returning from CreatePinScreen)
    useEffect(() => {
        const interval = setInterval(() => {
            isPinSet().then(setHasPinState);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const toggleBiometric = async (value: boolean) => {
        if (value) {
            try {
                const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: "Confirm identity to enable Biometric Login",
                    fallbackLabel: "Use PIN/Passcode",
                    disableDeviceFallback: false,
                });

                if (result.success) {
                    setBiometricEnabled(true);
                    await SecureStore.setItemAsync("biometric_enabled", "true");
                    Alert.alert("Success", "Biometric Login enabled successfully.");
                } else {
                    setBiometricEnabled(false);
                    await SecureStore.setItemAsync("biometric_enabled", "false");
                }
            } catch {
                setBiometricEnabled(false);
                await SecureStore.setItemAsync("biometric_enabled", "false");
                Alert.alert("Error", "Authentication failed. Please try again.");
            }
        } else {
            setBiometricEnabled(false);
            await SecureStore.setItemAsync("biometric_enabled", "false");
        }
    };

    const toggleHaptic = async (value: boolean) => {
        setHapticEnabled(value);
        try {
            await SecureStore.setItemAsync("haptic_enabled", value ? "true" : "false");
            updateHapticsCache(value);
            if (value) {
                triggerHaptic("success");
            }
        } catch { }
    };

    const toggleAppLock = async (value: boolean) => {
        try {
            if (value) {
                const pinExists = await isPinSet();
                if (!pinExists) {
                    // Navigate to set up a new PIN first
                    triggerHaptic("warning");
                    Alert.alert("Setup Required", "Please configure a secure App PIN first.", [
                        { text: "Cancel", style: "cancel" },
                        { text: "Configure PIN", onPress: () => router.push("/security/create-pin") }
                    ]);
                    return;
                }
            }
            setAppLockEnabledState(value);
            await setAppLockEnabled(value);
            triggerHaptic("success");
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to update App Lock settings.");
        }
    };

    const handleChangePin = () => {
        triggerHaptic("light");
        router.push("/security/create-pin");
    };

    const showTimeoutPicker = () => {
        triggerHaptic("light");
        Alert.alert(
            "Lock Timeout",
            "Select when the app should lock after going to the background:",
            [
                { text: "Immediately", onPress: () => handleSetTimeout(0) },
                { text: "30 Seconds", onPress: () => handleSetTimeout(30) },
                { text: "1 Minute", onPress: () => handleSetTimeout(60) },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const handleSetTimeout = async (seconds: number) => {
        try {
            await setResumeTimeout(seconds);
            setResumeTimeoutState(seconds);
            triggerHaptic("success");
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to update timeout.");
        }
    };

    const formatTimeoutLabel = (seconds: number) => {
        if (seconds === 0) return "Immediately";
        if (seconds === 30) return "30 seconds";
        if (seconds === 60) return "1 minute";
        return `${seconds} seconds`;
    };

    const handleLogout = () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: () => logoutUser(),
                },
            ],
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header / Top Navigation Bar */}
            <HeaderBar />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                bounces={false}
                overScrollMode="never"
            >
                {/* User Profile Card */}
                <View style={styles.profileCard}>
                    <Text style={styles.profileName}>{session?.name ?? "User"}</Text>

                    <View style={styles.actionButtons}>
                        <TouchableOpacity
                            style={styles.passwordBtn}
                            activeOpacity={0.85}
                            onPress={() => setResetModalVisible(true)}
                        >
                            <Text style={styles.passwordText}>Reset Password</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Security Category */}
                <Text style={styles.categoryHeader}>SECURITY</Text>
                <View style={styles.card}>
                    {/* Enable App Lock Toggle */}
                    <View style={styles.row}>
                        <View style={[styles.iconBg, { backgroundColor: COLORS.amber100 }]}>
                            <MaterialCommunityIcons name="shield-lock" size={22} color={COLORS.warning} />
                        </View>
                        <View style={styles.rowText}>
                            <Text style={styles.rowTitle}>Enable App Lock</Text>
                            <Text style={styles.rowSubtitle}>Secure launch & background transitions</Text>
                        </View>
                        <Switch
                            value={appLockEnabled}
                            onValueChange={toggleAppLock}
                            trackColor={{ false: COLORS.border, true: COLORS.warning }}
                            thumbColor={COLORS.white}
                            ios_backgroundColor={COLORS.border}
                        />
                    </View>

                    {/* Change PIN (Only visible if PIN configured) */}
                    {hasPin && (
                        <>
                            <View style={styles.rowDivider} />
                            <TouchableOpacity style={styles.row} onPress={handleChangePin} activeOpacity={0.7}>
                                <View style={[styles.iconBg, { backgroundColor: COLORS.slate100 }]}>
                                    <MaterialCommunityIcons name="lock-reset" size={22} color={COLORS.slate600} />
                                </View>
                                <View style={styles.rowText}>
                                    <Text style={styles.rowTitle}>Change App PIN</Text>
                                    <Text style={styles.rowSubtitle}>Update your 4-digit passcode</Text>
                                </View>
                                <Feather name="chevron-right" size={18} color={COLORS.slate400} />
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Configurable Timeout */}
                    {appLockEnabled && (
                        <>
                            <View style={styles.rowDivider} />
                            <TouchableOpacity style={styles.row} onPress={showTimeoutPicker} activeOpacity={0.7}>
                                <View style={[styles.iconBg, { backgroundColor: COLORS.slate100 }]}>
                                    <MaterialCommunityIcons name="timer-outline" size={22} color={COLORS.slate600} />
                                </View>
                                <View style={styles.rowText}>
                                    <Text style={styles.rowTitle}>Lock Timeout</Text>
                                    <Text style={styles.rowSubtitle}>Lock after {formatTimeoutLabel(resumeTimeout)} in background</Text>
                                </View>
                                <Feather name="chevron-right" size={18} color={COLORS.slate400} />
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Use Biometric Unlock Toggle */}
                    {isBiometricSupported && (
                        <>
                            <View style={styles.rowDivider} />
                            <View style={styles.row}>
                                <View style={[styles.iconBg, { backgroundColor: COLORS.slate100 }]}>
                                    <MaterialCommunityIcons name="fingerprint" size={22} color={COLORS.blueClassic} />
                                </View>
                                <View style={styles.rowText}>
                                    <Text style={styles.rowTitle}>Biometric Unlock</Text>
                                    <Text style={styles.rowSubtitle}>Use fingerprint or face recognition</Text>
                                </View>
                                <Switch
                                    value={biometricEnabled}
                                    onValueChange={toggleBiometric}
                                    trackColor={{ false: COLORS.border, true: COLORS.primary }}
                                    thumbColor={COLORS.white}
                                    ios_backgroundColor={COLORS.border}
                                />
                            </View>
                        </>
                    )}
                </View>

                {/* App Preferences Category */}
                <Text style={styles.categoryHeader}>APP PREFERENCES</Text>
                <TouchableOpacity activeOpacity={0.8} style={styles.card}>
                    <View style={styles.row}>
                        <View style={[styles.iconBg, { backgroundColor: COLORS.emerald50 }]}>
                            <MaterialCommunityIcons name="vibrate" size={22} color={COLORS.emerald500} />
                        </View>
                        <View style={styles.rowText}>
                            <Text style={styles.rowTitle}>Haptic Feedback</Text>
                            <Text style={styles.rowSubtitle}>Vibration on scan confirmation</Text>
                        </View>
                        <Switch
                            value={hapticEnabled}
                            onValueChange={toggleHaptic}
                            trackColor={{ false: COLORS.border, true: COLORS.primary }}
                            thumbColor={COLORS.white}
                            ios_backgroundColor={COLORS.border}
                        />
                    </View>
                </TouchableOpacity>

                {/* System Category */}
                <Text style={styles.categoryHeader}>SYSTEM</Text>
                <TouchableOpacity activeOpacity={0.8} style={styles.card}>
                    <View style={styles.row}>
                        <View style={[styles.iconBg, { backgroundColor: COLORS.slate100 }]}>
                            <MaterialCommunityIcons name="information-outline" size={22} color={COLORS.slate500} />
                        </View>
                        <View style={styles.rowText}>
                            <Text style={styles.rowTitle}>App Version</Text>
                        </View>
                        <Text style={styles.versionText}>v2.4.0</Text>
                    </View>
                </TouchableOpacity>

                {/* Logout Button */}
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                    activeOpacity={0.8}
                >
                    <Feather name="log-out" size={20} color={COLORS.red600} style={{ marginRight: 8 }} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                {/* Footer Copyright */}
                <Text style={styles.footerText}>© 2026 Revopz. All rights reserved.</Text>
            </ScrollView>

            <Modal
                visible={resetModalVisible}
                animationType="fade"
                transparent={true}
                onRequestClose={closeResetModal}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Reset Password</Text>
                        
                        <CustomInput
                            label="Current Password"
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChangeText={setCurrentPassword}
                            secureTextEntry
                            editable={!resetLoading}
                            error={resetErrors.current}
                        />
                        
                        <CustomInput
                            label="New Password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                            editable={!resetLoading}
                            error={resetErrors.newPassword}
                        />

                        {/* Password requirements indicators */}
                        <View style={styles.reqsContainer}>
                            <RequirementRow label="At least 8 characters" met={reqs.hasMinLength} />
                            <RequirementRow label="At least one uppercase letter (A-Z)" met={reqs.hasUppercase} />
                            <RequirementRow label="At least one lowercase letter (a-z)" met={reqs.hasLowercase} />
                            <RequirementRow label="At least one number (0-9)" met={reqs.hasNumber} />
                            <RequirementRow label="At least one special character (!@#...)" met={reqs.hasSpecialChar} />
                        </View>
                        
                        <CustomInput
                            label="Repeat Password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                            editable={!resetLoading}
                            error={resetErrors.confirm}
                        />

                        <View style={styles.modalActionButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={closeResetModal}
                                disabled={resetLoading}
                            >
                                <Text style={styles.modalCancelText}>Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.modalSubmitBtn,
                                    (!isPasswordValid(reqs) || newPassword !== confirmPassword) && styles.modalSubmitBtnDisabled
                                ]}
                                onPress={handleResetPassword}
                                disabled={resetLoading}
                            >
                                {resetLoading ? (
                                    <ActivityIndicator size="small" color={COLORS.white} />
                                ) : (
                                    <Text style={styles.modalSubmitText}>Change Password</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        paddingTop: 20,
        paddingBottom: 110, // clear the floating tab bar
    },
    profileCard: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 24,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    profileName: {
        fontSize: 24,
        fontWeight: "700",
        color: COLORS.slate800,
    },
    actionButtons: {
        flexDirection: "row",
        marginTop: 14,
    },
    passwordBtn: {
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    passwordText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    categoryHeader: {
        fontSize: 12,
        fontWeight: "700",
        color: COLORS.slate600,
        marginHorizontal: 20,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginHorizontal: 20,
        marginBottom: 24,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    rowDivider: {
        height: 1,
        backgroundColor: COLORS.slate100,
        marginVertical: 12,
        marginLeft: 52,
    },
    iconBg: {
        width: 40,
        height: 40,
        borderRadius: 10,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    rowText: {
        flex: 1,
    },
    rowTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.slate800,
    },
    rowSubtitle: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    versionText: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.textMuted,
        fontFamily: "System",
    },
    logoutBtn: {
        backgroundColor: COLORS.red100,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 14,
        marginHorizontal: 20,
        borderRadius: 12,
        marginTop: 8,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "rgba(220, 38, 38, 0.15)",
    },
    logoutText: {
        color: COLORS.red600,
        fontSize: 16,
        fontWeight: "700",
    },
    footerText: {
        textAlign: "center",
        color: COLORS.slate400,
        fontSize: 14,
        marginBottom: 16,
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalCard: {
        width: "100%",
        maxWidth: 360,
        backgroundColor: COLORS.white,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 24,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.slate800,
        marginBottom: 20,
        textAlign: "center",
    },
    reqsContainer: {
        marginBottom: 16,
        backgroundColor: COLORS.slate50,
        padding: 12,
        borderRadius: 12,
        gap: 6,
    },
    reqRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    reqText: {
        fontSize: 12,
        color: COLORS.slate500,
        fontWeight: "500",
    },
    reqTextMet: {
        color: COLORS.success,
        fontWeight: "600",
    },
    modalActionButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        marginTop: 10,
    },
    modalCancelBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.white,
    },
    modalCancelText: {
        fontSize: 15,
        fontWeight: "600",
        color: COLORS.slate600,
    },
    modalSubmitBtn: {
        flex: 1,
        height: 48,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        alignItems: "center",
        justifyContent: "center",
    },
    modalSubmitBtnDisabled: {
        opacity: 0.5,
    },
    modalSubmitText: {
        fontSize: 15,
        fontWeight: "700",
        color: COLORS.white,
    },
});
