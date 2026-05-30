import React, { useEffect, useState } from "react";
import { StyleSheet, Text, View, TouchableOpacity, StatusBar, Switch, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";

import { Alert } from "@/context/AlertContext";
import HeaderBar from "@/components/ui/HeaderBar";
import { logoutUser } from "@/services/authService";
import { getSession } from "@/utils/storage";
import { triggerHaptic, updateHapticsCache } from "@/utils/haptics";
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
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

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
                        <TouchableOpacity style={styles.passwordBtn} activeOpacity={0.85}>
                            <Text style={styles.passwordText}>PASSWORD</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Security Category */}
                <Text style={styles.categoryHeader}>SECURITY</Text>
                <View style={styles.card}>
                    {/* Enable App Lock Toggle */}
                    <View style={styles.row}>
                        <View style={[styles.iconBg, { backgroundColor: "#FEF3C7" }]}>
                            <MaterialCommunityIcons name="shield-lock" size={22} color="#D97706" />
                        </View>
                        <View style={styles.rowText}>
                            <Text style={styles.rowTitle}>Enable App Lock</Text>
                            <Text style={styles.rowSubtitle}>Secure launch & background transitions</Text>
                        </View>
                        <Switch
                            value={appLockEnabled}
                            onValueChange={toggleAppLock}
                            trackColor={{ false: "#E2E8F0", true: "#D97706" }}
                            thumbColor="#FFFFFF"
                            ios_backgroundColor="#E2E8F0"
                        />
                    </View>

                    {/* Change PIN (Only visible if PIN configured) */}
                    {hasPin && (
                        <>
                            <View style={styles.rowDivider} />
                            <TouchableOpacity style={styles.row} onPress={handleChangePin} activeOpacity={0.7}>
                                <View style={[styles.iconBg, { backgroundColor: "#F1F5F9" }]}>
                                    <MaterialCommunityIcons name="lock-reset" size={22} color="#475569" />
                                </View>
                                <View style={styles.rowText}>
                                    <Text style={styles.rowTitle}>Change App PIN</Text>
                                    <Text style={styles.rowSubtitle}>Update your 4-digit passcode</Text>
                                </View>
                                <Feather name="chevron-right" size={18} color="#94A3B8" />
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Configurable Timeout */}
                    {appLockEnabled && (
                        <>
                            <View style={styles.rowDivider} />
                            <TouchableOpacity style={styles.row} onPress={showTimeoutPicker} activeOpacity={0.7}>
                                <View style={[styles.iconBg, { backgroundColor: "#F1F5F9" }]}>
                                    <MaterialCommunityIcons name="timer-outline" size={22} color="#475569" />
                                </View>
                                <View style={styles.rowText}>
                                    <Text style={styles.rowTitle}>Lock Timeout</Text>
                                    <Text style={styles.rowSubtitle}>Lock after {formatTimeoutLabel(resumeTimeout)} in background</Text>
                                </View>
                                <Feather name="chevron-right" size={18} color="#94A3B8" />
                            </TouchableOpacity>
                        </>
                    )}

                    {/* Use Biometric Unlock Toggle */}
                    {isBiometricSupported && (
                        <>
                            <View style={styles.rowDivider} />
                            <View style={styles.row}>
                                <View style={[styles.iconBg, { backgroundColor: "#FFFBEB" }]}>
                                    <MaterialCommunityIcons name="fingerprint" size={22} color="#3B82F6" />
                                </View>
                                <View style={styles.rowText}>
                                    <Text style={styles.rowTitle}>Biometric Unlock</Text>
                                    <Text style={styles.rowSubtitle}>Use fingerprint or face recognition</Text>
                                </View>
                                <Switch
                                    value={biometricEnabled}
                                    onValueChange={toggleBiometric}
                                    trackColor={{ false: "#E2E8F0", true: "#D97706" }}
                                    thumbColor="#FFFFFF"
                                    ios_backgroundColor="#E2E8F0"
                                />
                            </View>
                        </>
                    )}
                </View>

                {/* App Preferences Category */}
                <Text style={styles.categoryHeader}>APP PREFERENCES</Text>
                <TouchableOpacity activeOpacity={0.8} style={styles.card}>
                    <View style={styles.row}>
                        <View style={[styles.iconBg, { backgroundColor: "#ECFDF5" }]}>
                            <MaterialCommunityIcons name="vibrate" size={22} color="#10B981" />
                        </View>
                        <View style={styles.rowText}>
                            <Text style={styles.rowTitle}>Haptic Feedback</Text>
                            <Text style={styles.rowSubtitle}>Vibration on scan confirmation</Text>
                        </View>
                        <Switch
                            value={hapticEnabled}
                            onValueChange={toggleHaptic}
                            trackColor={{ false: "#E2E8F0", true: "#D97706" }}
                            thumbColor="#FFFFFF"
                            ios_backgroundColor="#E2E8F0"
                        />
                    </View>
                </TouchableOpacity>

                {/* System Category */}
                <Text style={styles.categoryHeader}>SYSTEM</Text>
                <TouchableOpacity activeOpacity={0.8} style={styles.card}>
                    <View style={styles.row}>
                        <View style={[styles.iconBg, { backgroundColor: "#F1F5F9" }]}>
                            <MaterialCommunityIcons name="information-outline" size={22} color="#64748B" />
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
                    <Feather name="log-out" size={20} color="#DC2626" style={{ marginRight: 8 }} />
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>

                {/* Footer Copyright */}
                <Text style={styles.footerText}>© 2026 Revopz. All rights reserved.</Text>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    scrollContent: {
        paddingTop: 20,
        paddingBottom: 110, // clear the floating tab bar
    },
    profileCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        padding: 20,
        marginHorizontal: 20,
        marginBottom: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
        elevation: 2,
    },
    profileName: {
        fontSize: 24,
        fontWeight: "700",
        color: "#1E293B",
    },
    actionButtons: {
        flexDirection: "row",
        marginTop: 14,
    },
    passwordBtn: {
        backgroundColor: "#D97706",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    passwordText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    categoryHeader: {
        fontSize: 12,
        fontWeight: "700",
        color: "#475569",
        marginHorizontal: 20,
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginHorizontal: 20,
        marginBottom: 24,
        shadowColor: "#000",
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
        backgroundColor: "#F1F5F9",
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
        color: "#1E293B",
    },
    rowSubtitle: {
        fontSize: 13,
        color: "#64748B",
        marginTop: 2,
    },
    versionText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#64748B",
        fontFamily: "System",
    },
    logoutBtn: {
        backgroundColor: "#FEE2E2",
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
        color: "#DC2626",
        fontSize: 16,
        fontWeight: "700",
    },
    footerText: {
        textAlign: "center",
        color: "#94A3B8",
        fontSize: 14,
        marginBottom: 16,
    },
});
