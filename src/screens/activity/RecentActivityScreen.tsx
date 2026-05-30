import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

// ── Shared components ──────────────────────────────────────────────────────────
import PageHeader from "@/components/ui/PageHeader";
import TimelineSection from "@/components/ui/TimelineSection";
import TimelineItem from "@/components/ui/TimelineItem";
import ActivityDetailModal from "@/components/ui/ActivityDetailModal";
import Loader from "@/components/common/Loader";

// ── Context / services ─────────────────────────────────────────────────────────
import { Alert } from "@/context/AlertContext";
import { useAuth } from "@/context/AuthContext";
import {
    fetchRecentActivitiesLast7Days,
    type ActivityItemData,
} from "@/services/activityService";
import { COLORS } from "@/theme/colors";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

type DayLabel = "TODAY" | "YESTERDAY" | "OLDER";

function getDayLabel(date: Date): DayLabel {
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
    }
    return "OLDER";
}

// ─────────────────────────────────────────────────────────────────────────────
// Screen
// ─────────────────────────────────────────────────────────────────────────────

export default function RecentActivityScreen() {
    const { user, authReady } = useAuth();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activities, setActivities] = useState<ActivityItemData[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ActivityItemData | null>(null);

    // CR-03: guard state updates after unmount
    const cancelledRef = useRef(false);

    const fetchActivities = async () => {
        try {
            const items = await fetchRecentActivitiesLast7Days();
            if (!cancelledRef.current) {
                setActivities(items);
            }
        } catch {
            if (!cancelledRef.current) {
                Alert.alert("Error", "Failed to retrieve activity log history.");
            }
        } finally {
            if (!cancelledRef.current) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    };

    useEffect(() => {
        cancelledRef.current = false;

        if (authReady) {
            if (user) {
                fetchActivities();
            } else {
                setLoading(false);
            }
        }

        return () => {
            cancelledRef.current = true;
        };
    }, [authReady, user]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchActivities();
    };

    // Filter → group by day
    const sections = useMemo(() => {
        const filtered = searchQuery
            ? activities.filter(
                (item) =>
                    item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.productNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    item.status.toLowerCase().includes(searchQuery.toLowerCase())
            )
            : activities;

        const today: ActivityItemData[] = [];
        const yesterday: ActivityItemData[] = [];
        const older: ActivityItemData[] = [];

        filtered.forEach((item) => {
            const label = getDayLabel(item.createdAt);
            if (label === "TODAY") today.push(item);
            else if (label === "YESTERDAY") yesterday.push(item);
            else older.push(item);
        });

        return { today, yesterday, older };
    }, [activities, searchQuery]);

    const hasNoData =
        sections.today.length === 0 &&
        sections.yesterday.length === 0 &&
        sections.older.length === 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/*
             * PageHeader lives OUTSIDE KeyboardAvoidingView so it stays pinned
             * at the top and is never shifted by the software keyboard.
             */}
            <PageHeader
                title="Recent Activity"
                showBackButton={true}
                showSearch={true}
                showAvatar={true}
                isSearching={isSearching}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                onSearchPress={() => setIsSearching(true)}
                onCloseSearch={() => {
                    setIsSearching(false);
                    setSearchQuery("");
                }}
            />

            {/*
             * KeyboardAvoidingView fills the space below the pinned header.
             *
             * Android: 'height' shrinks the container to the visible window
             *   height above the software keyboard — correct for Expo's default
             *   adjustPan windowSoftInputMode.
             * iOS: 'padding' adds bottom padding equal to the keyboard height.
             */}
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={0}
            >
                {/* Tap on empty areas → dismiss the keyboard */}
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <View style={styles.inner}>

                        {loading ? (
                            <Loader message="Loading activity history..." />
                        ) : (
                            <View style={styles.container}>
                                <ScrollView
                                    showsVerticalScrollIndicator={false}
                                    contentContainerStyle={styles.scrollContent}
                                    bounces={false}
                                    overScrollMode="never"
                                    keyboardShouldPersistTaps="handled"
                                    refreshControl={
                                        <RefreshControl
                                            refreshing={refreshing}
                                            onRefresh={onRefresh}
                                            colors={[COLORS.primary]}
                                            tintColor={COLORS.primary}
                                        />
                                    }
                                >
                                    {hasNoData ? (
                                        <View style={styles.emptyContainer}>
                                            <Feather
                                                name={searchQuery ? "search" : "activity"}
                                                size={48}
                                                color={COLORS.slate400}
                                            />
                                            <Text style={styles.emptyText}>
                                                {searchQuery
                                                    ? `No results found for "${searchQuery}"`
                                                    : "No recent activity found for the past 7 days."}
                                            </Text>
                                        </View>
                                    ) : (
                                        <>
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
                                                            createdByRole={item.createdByRole}
                                                            manufacturedDate={item.manufacturedDate}
                                                            warrantyMonths={item.warrantyMonths}
                                                            warrantyStatus={item.warrantyStatus}
                                                            isFirst={index === 0}
                                                            isLast={index === sections.today.length - 1}
                                                            onPress={() => setSelectedItem(item)}
                                                        />
                                                    ))}
                                                </TimelineSection>
                                            )}

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
                                                            createdByRole={item.createdByRole}
                                                            manufacturedDate={item.manufacturedDate}
                                                            warrantyMonths={item.warrantyMonths}
                                                            warrantyStatus={item.warrantyStatus}
                                                            isFirst={index === 0}
                                                            isLast={index === sections.yesterday.length - 1}
                                                            onPress={() => setSelectedItem(item)}
                                                        />
                                                    ))}
                                                </TimelineSection>
                                            )}

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
                                                            createdByRole={item.createdByRole}
                                                            manufacturedDate={item.manufacturedDate}
                                                            warrantyMonths={item.warrantyMonths}
                                                            warrantyStatus={item.warrantyStatus}
                                                            isFirst={index === 0}
                                                            isLast={index === sections.older.length - 1}
                                                            onPress={() => setSelectedItem(item)}
                                                        />
                                                    ))}
                                                </TimelineSection>
                                            )}

                                            <Text style={styles.footerText}>
                                                Older activity is not accessible through this app.
                                            </Text>
                                        </>
                                    )}
                                </ScrollView>
                            </View>
                        )}

                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>

            {/* Activity detail modal — rendered outside KeyboardAvoidingView so
                it always covers the full screen regardless of keyboard state. */}
            <ActivityDetailModal
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    // TouchableWithoutFeedback requires exactly one View child that fills space.
    inner: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        // 120 px gives clearance for the keyboard + bottom nav so the last
        // list item can always scroll fully above the keyboard.
        paddingBottom: 120,
    },
    emptyContainer: {
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 80,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textMuted,
        marginTop: 12,
        fontWeight: "500",
    },
    footerText: {
        textAlign: "center",
        color: COLORS.slate400,
        fontSize: 14,
        marginVertical: 28,
        fontWeight: "500",
    },
});
