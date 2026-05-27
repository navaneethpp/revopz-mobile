import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View, TouchableOpacity, StatusBar, Switch, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import HeaderBar from "@/components/ui/HeaderBar";
import { logoutUser } from "@/services/authService";
import { getSession } from "@/utils/storage";
import type { SessionData } from "@/types/auth";

export default function ProfileScreen() {
    const [session, setSession] = useState<SessionData | null>(null);
    const [biometricEnabled, setBiometricEnabled] = useState(false);
    const [hapticEnabled, setHapticEnabled] = useState(false);
    const [isBiometricSupported, setIsBiometricSupported] = useState(false);

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
    }, []);

    const toggleBiometric = async (value: boolean) => {
        setBiometricEnabled(value);
        try {
            await SecureStore.setItemAsync("biometric_enabled", value ? "true" : "false");
        } catch (e) {
            console.warn("Failed to save biometric preference:", e);
        }
    };

    const toggleHaptic = async (value: boolean) => {
        setHapticEnabled(value);
        try {
            await SecureStore.setItemAsync("haptic_enabled", value ? "true" : "false");
        } catch (e) {
            console.warn("Failed to save haptic preference:", e);
        }
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
            >
                {/* User Profile Card */}
                <View style={styles.profileCard}>
                    <Text style={styles.profileName}>{session?.name ?? "User"}</Text>
                    
                    <View style={styles.actionButtons}>
                        <TouchableOpacity style={styles.editProfileBtn} activeOpacity={0.85}>
                            <Text style={styles.editProfileText}>EDIT PROFILE</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity style={styles.passwordBtn} activeOpacity={0.85}>
                            <Text style={styles.passwordText}>PASSWORD</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Account Settings Category */}
                {isBiometricSupported && (
                    <>
                        <Text style={styles.categoryHeader}>ACCOUNT SETTINGS</Text>
                        <View style={styles.card}>
                            <View style={styles.row}>
                                <View style={[styles.iconBg, { backgroundColor: "#EFF6FF" }]}>
                                    <MaterialCommunityIcons name="fingerprint" size={22} color="#3B82F6" />
                                </View>
                                <View style={styles.rowText}>
                                    <Text style={styles.rowTitle}>Biometric Login</Text>
                                    <Text style={styles.rowSubtitle}>Face ID / Touch ID</Text>
                                </View>
                                <Switch
                                    value={biometricEnabled}
                                    onValueChange={toggleBiometric}
                                    trackColor={{ false: "#E2E8F0", true: "#3B82F6" }}
                                    thumbColor="#FFFFFF"
                                    ios_backgroundColor="#E2E8F0"
                                />
                            </View>
                        </View>
                    </>
                )}

                {/* App Preferences Category */}
                <Text style={styles.categoryHeader}>APP PREFERENCES</Text>
                <View style={styles.card}>
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
                            trackColor={{ false: "#E2E8F0", true: "#3B82F6" }}
                            thumbColor="#FFFFFF"
                            ios_backgroundColor="#E2E8F0"
                        />
                    </View>
                </View>

                {/* System Category */}
                <Text style={styles.categoryHeader}>SYSTEM</Text>
                <View style={styles.card}>
                    <View style={styles.row}>
                        <View style={[styles.iconBg, { backgroundColor: "#F1F5F9" }]}>
                            <MaterialCommunityIcons name="information-outline" size={22} color="#64748B" />
                        </View>
                        <View style={styles.rowText}>
                            <Text style={styles.rowTitle}>App Version</Text>
                        </View>
                        <Text style={styles.versionText}>v2.4.0</Text>
                    </View>
                </View>

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
    editProfileBtn: {
        backgroundColor: "#0052CC",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginRight: 10,
    },
    editProfileText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    passwordBtn: {
        backgroundColor: "transparent",
        borderWidth: 1,
        borderColor: "#475569",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    passwordText: {
        color: "#1E293B",
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
