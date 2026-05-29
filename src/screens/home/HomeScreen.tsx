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

import { router } from "expo-router";
import HeaderBar from "@/components/ui/HeaderBar";
import RecentActivityCard from "@/components/ui/RecentActivityCard";
import ActionCard from "@/components/ui/ActionCard";
import { getSession } from "@/utils/storage";
import { fetchRecentActivity } from "@/services/activityService";
import { useAuth } from "@/context/AuthContext";
import { logoutUser } from "@/services/authService";
import type { ActivityItem } from "@/services/activityService";

export default function HomeScreen() {
    const { user, authReady } = useAuth();
    const [name, setName] = useState("User");
    const [activityEntries, setActivityEntries] = useState<ActivityItem[]>([]);
    // Stay in loading state until auth is resolved AND the Firestore fetch finishes.
    // Initialise to true so we never flash "No recent activity yet" during startup.
    const [activityLoading, setActivityLoading] = useState(true);

    // Load the logged-in user's display name from SecureStore
    useEffect(() => {
        getSession().then((session) => {
            if (session?.name) setName(session.name);
        });
    }, []);

    // ─────────────────────────────────────────────────────────────────────────
    // Fetch recent activity — only after Firebase Auth has finished restoring
    // the persisted session from AsyncStorage (authReady === true).
    //
    // WHY authReady MATTERS
    // ─────────────────────
    // On app reopen, auth.currentUser is null while Firebase is asynchronously
    // reading the token from AsyncStorage. Reading currentUser synchronously or
    // acting on the first onAuthStateChanged(null) emission causes Firestore
    // queries to run without credentials → permission-denied / empty results.
    //
    // AuthContext's onAuthStateChanged listener sets authReady=true only after
    // Firebase emits its final resolved state, so by the time this effect runs
    // with authReady===true, the user token is guaranteed to be valid.
    // ─────────────────────────────────────────────────────────────────────────
    useEffect(() => {
        // Auth hasn't finished initialising yet — keep the loading spinner.
        if (!authReady) return;

        let cancelled = false;

        if (!user) {
            // Force a clean logout to clear out of sync SecureStore state and
            // redirect to the login screen.
            logoutUser();
            return;
        }


        const fetchActivity = async () => {
            try {
                const items = await fetchRecentActivity(3);
                if (!cancelled) setActivityEntries(items);
            } catch (err: any) {
                console.error(
                    "[HomeScreen] fetchRecentActivity failed:",
                    err?.code,
                    err?.message,
                );
            } finally {
                if (!cancelled) setActivityLoading(false);
            }
        };

        fetchActivity();

        return () => {
            cancelled = true;
        };
    }, [authReady, user]);

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

            {/* ── Top Navigation Bar ── */}
            <HeaderBar />

            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
                {/* ── Welcome Heading ── */}
                <Text style={styles.welcome}>Welcome back {name}</Text>

                {/* ── Recent Activity Card (live Firestore data) ── */}
                <RecentActivityCard
                    entries={activityEntries}
                    loading={activityLoading}
                />

                {/* ── Action Cards (dashed container) ── */}
                <View style={styles.dashedContainer}>
                    <ActionCard
                        icon="plus-square"
                        title="Add Single Unit"
                        subtitle="Log a single item with full metadata."
                        onPress={() => router.push("/units/add")}
                    />
                    <View style={{ height: 12 }} />
                    <ActionCard
                        icon="copy"
                        title="Bulk Add Units"
                        subtitle="Rapidly ingest multiple items of the same type."
                        onPress={() => router.push("/units/bulk")}
                    />
                </View>
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
        paddingHorizontal: 16,
        paddingBottom: 110,
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
