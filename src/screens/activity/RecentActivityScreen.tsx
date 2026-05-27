import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { collection, getDocs, orderBy, query, Timestamp } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/config/firebase";
import PageHeader from "@/components/ui/PageHeader";
import TimelineSection from "@/components/ui/TimelineSection";
import TimelineItem from "@/components/ui/TimelineItem";

interface ActivityItemData {
    id: string;
    productName: string;
    productNumber: string;
    category: string;
    status: string;
    createdAt: Date;
    createdByName: string;
}

const getDayLabel = (date: Date): "TODAY" | "YESTERDAY" | "OLDER" => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    ) {
        return "TODAY";
    } else if (
        date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear()
    ) {
        return "YESTERDAY";
    } else {
        return "OLDER";
    }
};

export default function RecentActivityScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [sections, setSections] = useState<{
        today: ActivityItemData[];
        yesterday: ActivityItemData[];
        older: ActivityItemData[];
    }>({ today: [], yesterday: [], older: [] });

    const fetchActivities = async () => {
        try {
            const q = query(
                collection(db, "manufactured_units"),
                orderBy("createdAt", "desc")
            );
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                setSections({ today: [], yesterday: [], older: [] });
                return;
            }

            const items: ActivityItemData[] = snapshot.docs.map((doc) => {
                const data = doc.data();
                const createdAt: Date =
                    data.createdAt instanceof Timestamp
                        ? data.createdAt.toDate()
                        : new Date();

                return {
                    id: doc.id,
                    productName: data.productName ?? "Unknown Product",
                    productNumber: data.productNumber ?? "",
                    category: data.category ?? "",
                    status: data.status ?? "",
                    createdAt,
                    createdByName: data.createdByName ?? "",
                };
            });

            // Group items into Today, Yesterday, and Older
            const todayList: ActivityItemData[] = [];
            const yesterdayList: ActivityItemData[] = [];
            const olderList: ActivityItemData[] = [];

            items.forEach((item) => {
                const label = getDayLabel(item.createdAt);
                if (label === "TODAY") {
                    todayList.push(item);
                } else if (label === "YESTERDAY") {
                    yesterdayList.push(item);
                } else {
                    olderList.push(item);
                }
            });

            setSections({
                today: todayList,
                yesterday: yesterdayList,
                older: olderList,
            });
        } catch (error: any) {
            console.error("[RecentActivityScreen] Fetch activities error:", error);
            Alert.alert("Error", "Failed to retrieve activity log history.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        let unsubscribeAuth: (() => void) | null = null;
        let cancelled = false;

        const checkAuthAndFetch = () => {
            if (auth.currentUser) {
                fetchActivities();
            } else {
                unsubscribeAuth = onAuthStateChanged(auth, (user) => {
                    if (cancelled) return;
                    if (user) {
                        // Unsubscribe so it doesn't trigger multiple times
                        if (unsubscribeAuth) {
                            unsubscribeAuth();
                            unsubscribeAuth = null;
                        }
                        fetchActivities();
                    } else {
                        setLoading(false);
                    }
                });
            }
        };

        checkAuthAndFetch();

        return () => {
            cancelled = true;
            if (unsubscribeAuth) {
                unsubscribeAuth();
            }
        };
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchActivities();
    };

    const handleDownloadReport = () => {
        Alert.alert(
            "Export Activity Report",
            "Do you want to download a PDF report of the recent activity logs?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Download",
                    onPress: () => {
                        Alert.alert("Success", "Activity log report downloaded successfully.");
                    },
                },
            ]
        );
    };

    const hasNoData =
        sections.today.length === 0 &&
        sections.yesterday.length === 0 &&
        sections.older.length === 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Reusable Page Header */}
            <PageHeader
                title="Recent Activity"
                showBackButton={true}
                showSearch={true}
                showAvatar={true}
                onSearchPress={() => Alert.alert("Search", "Search functionality coming soon.")}
            />

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1565C0" />
                    <Text style={styles.loadingText}>Loading activity history...</Text>
                </View>
            ) : (
                <View style={styles.container}>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                colors={["#1565C0"]}
                                tintColor="#1565C0"
                            />
                        }
                    >
                        {hasNoData ? (
                            <View style={styles.emptyContainer}>
                                <Feather name="activity" size={48} color="#94A3B8" />
                                <Text style={styles.emptyText}>No recent activity yet.</Text>
                            </View>
                        ) : (
                            <>
                                {/* Today Section */}
                                {sections.today.length > 0 && (
                                    <TimelineSection title="Today">
                                        {sections.today.map((item, index) => (
                                            <TimelineItem
                                                key={item.id}
                                                id={item.id}
                                                productName={item.productName}
                                                productNumber={item.productNumber}
                                                category={item.category}
                                                status={item.status}
                                                createdAt={item.createdAt}
                                                createdByName={item.createdByName}
                                                isFirst={index === 0}
                                                isLast={index === sections.today.length - 1}
                                            />
                                        ))}
                                    </TimelineSection>
                                )}

                                {/* Yesterday Section */}
                                {sections.yesterday.length > 0 && (
                                    <TimelineSection title="Yesterday">
                                        {sections.yesterday.map((item, index) => (
                                            <TimelineItem
                                                key={item.id}
                                                id={item.id}
                                                productName={item.productName}
                                                productNumber={item.productNumber}
                                                category={item.category}
                                                status={item.status}
                                                createdAt={item.createdAt}
                                                createdByName={item.createdByName}
                                                isFirst={index === 0}
                                                isLast={index === sections.yesterday.length - 1}
                                            />
                                        ))}
                                    </TimelineSection>
                                )}

                                {/* Older Section */}
                                {sections.older.length > 0 && (
                                    <TimelineSection title="Older">
                                        {sections.older.map((item, index) => (
                                            <TimelineItem
                                                key={item.id}
                                                id={item.id}
                                                productName={item.productName}
                                                productNumber={item.productNumber}
                                                category={item.category}
                                                status={item.status}
                                                createdAt={item.createdAt}
                                                createdByName={item.createdByName}
                                                isFirst={index === 0}
                                                isLast={index === sections.older.length - 1}
                                            />
                                        ))}
                                    </TimelineSection>
                                )}

                                {/* End of Activity Footer */}
                                <Text style={styles.footerText}>End of recent activity</Text>
                            </>
                        )}
                    </ScrollView>

                    {/* Floating download button (FAB) */}
                    <TouchableOpacity
                        style={styles.fab}
                        onPress={handleDownloadReport}
                        activeOpacity={0.8}
                        accessibilityLabel="Download Report"
                    >
                        <Feather name="download" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: "#FFFFFF",
    },
    container: {
        flex: 1,
        position: "relative",
    },
    scrollContent: {
        paddingBottom: 80, // buffer space for the floating action button (FAB)
    },
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FFFFFF",
    },
    loadingText: {
        fontSize: 15,
        color: "#64748B",
        marginTop: 12,
        fontWeight: "500",
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 16,
        color: "#64748B",
        marginTop: 12,
        fontWeight: "500",
    },
    footerText: {
        textAlign: "center",
        color: "#94A3B8",
        fontSize: 14,
        marginVertical: 28,
        fontWeight: "500",
    },
    fab: {
        position: "absolute",
        bottom: 20,
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: "#1565C0",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#1565C0",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
        zIndex: 10,
    },
});
