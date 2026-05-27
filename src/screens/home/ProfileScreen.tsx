import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View, TouchableOpacity, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import BottomNavigation from "@/components/ui/BottomNavigation";
import { logoutUser } from "@/services/authService";
import { getSession } from "@/utils/storage";
import type { SessionData } from "@/types/auth";

export default function ProfileScreen() {
    const [session, setSession] = useState<SessionData | null>(null);

    useEffect(() => {
        getSession().then(setSession);
    }, []);

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

            <View style={styles.content}>
                {/* Profile Header */}
                <View style={styles.header}>
                    <View style={styles.avatar}>
                        <Feather name="user" size={48} color="#1565C0" />
                    </View>
                    
                    <Text style={styles.name}>
                        {session?.name ?? "—"}
                    </Text>

                    <Text style={styles.email}>
                        {session?.email ?? "—"}
                    </Text>
                </View>

                {/* Settings list */}
                <View style={styles.menu}>
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuItemLeft}>
                            <Feather name="settings" size={20} color="#6B7280" />
                            <Text style={styles.menuItemText}>Settings</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color="#CBD5E1" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuItemLeft}>
                            <Feather name="shield" size={20} color="#6B7280" />
                            <Text style={styles.menuItemText}>Security</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color="#CBD5E1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, { borderBottomWidth: 0 }]}
                        onPress={handleLogout}
                    >
                        <View style={styles.menuItemLeft}>
                            <Feather name="log-out" size={20} color="#DC2626" />
                            <Text style={[styles.menuItemText, { color: "#DC2626" }]}>Log Out</Text>
                        </View>
                        <Feather name="chevron-right" size={20} color="#CBD5E1" />
                    </TouchableOpacity>
                </View>
            </View>

            {/* Bottom Navigation always anchored to the bottom */}
            <BottomNavigation />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    header: {
        alignItems: "center",
        marginTop: 40,
        marginBottom: 32,
    },
    avatar: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: "#DBEAFE",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    name: {
        fontSize: 24,
        fontWeight: "700",
        color: "#111827",
    },
    email: {
        fontSize: 14,
        color: "#6B7280",
        marginTop: 4,
    },
    menu: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        paddingHorizontal: 16,
    },
    menuItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
    },
    menuItemLeft: {
        flexDirection: "row",
        alignItems: "center",
    },
    menuItemText: {
        fontSize: 16,
        fontWeight: "500",
        color: "#374151",
        marginLeft: 12,
    },
});
