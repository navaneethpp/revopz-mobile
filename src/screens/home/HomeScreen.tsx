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
import { onAuthStateChanged } from "firebase/auth";
import HeaderBar from "@/components/ui/HeaderBar";
import RecentActivityCard from "@/components/ui/RecentActivityCard";
import ActionCard from "@/components/ui/ActionCard";
import { getSession } from "@/utils/storage";
import { auth } from "@/config/firebase";
import { fetchRecentActivity } from "@/services/activityService";
import type { ActivityItem } from "@/services/activityService";

export default function HomeScreen() {
    const [name, setName] = useState("User");
    const [activityEntries, setActivityEntries] = useState<ActivityItem[]>([]);
    // Keep loading=true until auth resolves AND the fetch finishes
    const [activityLoading, setActivityLoading] = useState(true);

    // Load the logged-in user's name from SecureStore
    useEffect(() => {
        getSession().then((session) => {
            if (session?.name) setName(session.name);
        });
    }, []);

    // Fetch recent activity — wait for Firebase Auth to restore the session
    // before querying Firestore to avoid "Missing or insufficient permissions".
    useEffect(() => {
        let cancelled = false;
        let unsubscribeAuth: (() => void) | null = null;
        let shouldUnsubscribe = false;

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

        const handleUser = async (user: any) => {
            if (cancelled) return;

            if (user) {
                // Auth confirmed — unsubscribe immediately so we only fetch once
                if (unsubscribeAuth) {
                    unsubscribeAuth();
                    unsubscribeAuth = null;
                } else {
                    shouldUnsubscribe = true;
                }
                await fetchActivity();
            } else {
                // If auth resolves to null, stop loading to avoid hanging spinner
                if (!cancelled) setActivityLoading(false);
            }
        };

        if (auth.currentUser) {
            // Fetch immediately if user is already present
            fetchActivity();
        } else {
            // Otherwise subscribe to state change
            unsubscribeAuth = onAuthStateChanged(auth, handleUser);
            if (shouldUnsubscribe && unsubscribeAuth) {
                unsubscribeAuth();
                unsubscribeAuth = null;
            }
        }

        return () => {
            cancelled = true;
            if (unsubscribeAuth) {
                unsubscribeAuth();
            }
        };
    }, []);

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
