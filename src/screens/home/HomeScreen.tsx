import React, { useEffect, useState } from "react";
import {
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import RecentActivityCard from "@/components/ui/RecentActivityCard";
import ActionCard from "@/components/ui/ActionCard";
import BottomNavigation from "@/components/ui/BottomNavigation";
import { getSession } from "@/utils/storage";

export default function HomeScreen() {
    const [name, setName] = useState("User");

    useEffect(() => {
        getSession().then((session) => {
            if (session?.name) setName(session.name);
        });
    }, []);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* ── Top Navigation Bar ── */}
            <View style={styles.navbar}>
                <Text style={styles.brand}>Revopz</Text>

                <TouchableOpacity
                    onPress={() => router.push("/profile")}
                    style={styles.avatar}
                    activeOpacity={0.8}
                >
                    <Feather name="user" size={20} color="#1565C0" />
                </TouchableOpacity>
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* ── Welcome Heading ── */}
                <Text style={styles.welcome}>Welcome back {name}</Text>

                {/* ── Recent Activity Card ── */}
                <RecentActivityCard />

                {/* ── Action Cards (dashed container) ── */}
                <View style={styles.dashedContainer}>
                    <ActionCard
                        icon="plus-square"
                        title="Add Single Unit"
                        subtitle="Log a single item with full metadata."
                        onPress={() => console.log("Add Unit pressed")}
                    />
                    <View style={{ height: 12 }} />
                    <ActionCard
                        icon="copy"
                        title="Bulk Add Units"
                        subtitle="Rapidly ingest multiple items of the same type."
                        onPress={() => console.log("Bulk Add pressed")}
                    />
                </View>
            </ScrollView>

            {/* ── Bottom Navigation ── */}
            <BottomNavigation />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },
    navbar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: "#F8FAFC",
    },
    brand: {
        fontSize: 22,
        fontWeight: "800",
        color: "#1565C0",
        letterSpacing: -0.5,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#DBEAFE",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    welcome: {
        fontSize: 26,
        fontWeight: "700",
        color: "#111827",
        marginTop: 4,
        marginBottom: 20,
    },
    dashedContainer: {
        marginTop: 20,
        borderWidth: 1.5,
        borderStyle: "dashed",
        borderColor: "#CBD5E1",
        borderRadius: 16,
        padding: 12,
    },
});
