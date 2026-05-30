import React, { useEffect, useMemo, useState, useRef } from "react";
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { Alert } from "@/context/AlertContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import PageHeader from "@/components/ui/PageHeader";
import TimelineSection from "@/components/ui/TimelineSection";
import TimelineItem from "@/components/ui/TimelineItem";
import { useAuth } from "@/context/AuthContext";
import { fetchRecentActivitiesLast7Days, type ActivityItemData } from "@/services/activityService";

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

const DetailRow = ({ label, value, icon }: { label: string; value: string; icon: any }) => (
    <View style={styles.detailRow}>
        <View style={styles.detailIconContainer}>
            <Feather name={icon} size={16} color="#1565C0" />
        </View>
        <View style={styles.detailTextContainer}>
            <Text style={styles.detailLabel}>{label}</Text>
            <Text style={styles.detailValue}>{value}</Text>
        </View>
    </View>
);

const getStatusColor = (status: string) => {
    const norm = (status || "").toLowerCase();
    if (norm === "ready" || norm.includes("complete") || norm.includes("manufactur")) {
        return { bg: "#ECFDF5", text: "#059669" };
    } else if (norm.includes("fail") || norm.includes("test")) {
        return { bg: "#FEF2F2", text: "#DC2626" };
    } else if (norm.includes("pass") || norm.includes("quality") || norm.includes("qa")) {
        return { bg: "#FFFBEB", text: "#D97706" };
    } else if (norm.includes("transfer") || norm.includes("warehouse") || norm.includes("logistics")) {
        return { bg: "#EFF6FF", text: "#2563EB" };
    }
    return { bg: "#F1F5F9", text: "#64748B" }; // default
};

export default function RecentActivityScreen() {
    const { user, authReady } = useAuth();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activities, setActivities] = useState<ActivityItemData[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [selectedItem, setSelectedItem] = useState<ActivityItemData | null>(null);

    const cancelledRef = useRef(false);

    // CR-03: use a stable component-level ref to prevent memory leaks/state updates on unmount
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

    // Filter and group activities based on search text input
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

        const todayList: ActivityItemData[] = [];
        const yesterdayList: ActivityItemData[] = [];
        const olderList: ActivityItemData[] = [];

        filtered.forEach((item) => {
            const label = getDayLabel(item.createdAt);
            if (label === "TODAY") {
                todayList.push(item);
            } else if (label === "YESTERDAY") {
                yesterdayList.push(item);
            } else {
                olderList.push(item);
            }
        });

        return {
            today: todayList,
            yesterday: yesterdayList,
            older: olderList,
        };
    }, [activities, searchQuery]);

    const hasNoData =
        sections.today.length === 0 &&
        sections.yesterday.length === 0 &&
        sections.older.length === 0;

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            {/* Reusable Page Header with Search Integration */}
            {/*
             * PageHeader lives OUTSIDE KeyboardAvoidingView so it is always
             * pinned at the top and never pushed up/down by the keyboard.
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
             * KeyboardAvoidingView fills the remaining space below the header.
             *
             * Android: 'height' shrinks the container to the available window
             *   height above the software keyboard — the most reliable mode on
             *   Android when the activity windowSoftInputMode is NOT set to
             *   'adjustResize' (which is the Expo default).
             *
             * iOS: 'padding' adds bottom padding equal to the keyboard height
             *   so SafeAreaView + ScrollView respond naturally.
             */}
            <KeyboardAvoidingView
                style={styles.keyboardAvoidingView}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={0}
            >
                {/*
                 * TouchableWithoutFeedback propagates taps on empty areas of
                 * the ScrollView down to Keyboard.dismiss(), closing the
                 * keyboard when the user taps anywhere outside the search input.
                 */}
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
                    <View style={styles.inner}>

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
                        bounces={false}
                        overScrollMode="never"
                        keyboardShouldPersistTaps="handled"
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
                                <Feather name={searchQuery ? "search" : "activity"} size={48} color="#94A3B8" />
                                <Text style={styles.emptyText}>
                                    {searchQuery
                                        ? `No results found for "${searchQuery}"`
                                        : "No recent activity found for the past 7 days."}
                                </Text>
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

                                {/* End of Activity Footer */}
                                <Text style={styles.footerText}>Older activity is not accessible through this app.</Text>
                            </>
                        )}
                    </ScrollView>
                </View>
            )}

                    </View>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>

            {/* Details Modal Popup Overlay */}
            <Modal
                visible={selectedItem !== null}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedItem(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        {/* Header */}
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalHeaderTitle}>Activity Details</Text>
                            <TouchableOpacity
                                onPress={() => setSelectedItem(null)}
                                style={styles.modalCloseButton}
                                activeOpacity={0.7}
                                accessibilityLabel="Close details"
                            >
                                <Feather name="x" size={24} color="#64748B" />
                            </TouchableOpacity>
                        </View>

                        {selectedItem && (
                            <ScrollView
                                showsVerticalScrollIndicator={false}
                                style={styles.modalBody}
                                bounces={false}
                                overScrollMode="never"
                            >
                                {/* Product Name */}
                                <Text style={styles.modalProductName}>{selectedItem.productName}</Text>

                                {/* Status Badge */}
                                <View style={styles.modalStatusRow}>
                                    <View
                                        style={[
                                            styles.modalStatusBadge,
                                            { backgroundColor: getStatusColor(selectedItem.status).bg },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.modalStatusText,
                                                { color: getStatusColor(selectedItem.status).text },
                                            ]}
                                        >
                                            {selectedItem.status.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>

                                {/* Info Grid */}
                                <View style={styles.modalInfoGrid}>
                                    <DetailRow label="Product Number (SKU)" value={selectedItem.productNumber} icon="package" />
                                    <DetailRow label="Category" value={selectedItem.category} icon="tag" />
                                    <DetailRow label="Manufactured Date" value={selectedItem.manufacturedDate || "N/A"} icon="calendar" />
                                    <DetailRow
                                        label="Warranty Duration"
                                        value={`${selectedItem.warrantyMonths} Months`}
                                        icon="shield"
                                    />
                                    <DetailRow
                                        label="Warranty Registration"
                                        value={selectedItem.warrantyStatus === "not_registered" ? "Not Registered" : "Registered"}
                                        icon="file-text"
                                    />
                                    <DetailRow
                                        label="Logged By"
                                        value={`${selectedItem.createdByName} (${selectedItem.createdByRole || "Operator"})`}
                                        icon="user"
                                    />
                                    <DetailRow
                                        label="Logged At"
                                        value={selectedItem.createdAt.toLocaleString()}
                                        icon="clock"
                                    />
                                </View>
                            </ScrollView>
                        )}

                        {/* Modal Footer Buttons */}
                        <View style={styles.modalFooter}>
                            <TouchableOpacity
                                style={styles.modalConfirmBtn}
                                onPress={() => setSelectedItem(null)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.modalConfirmText}>Close</Text>
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
        backgroundColor: "#FFFFFF",
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    // Inner wrapper required by TouchableWithoutFeedback (needs a single child
    // View that fills all available space).
    inner: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        // 120 px: enough clearance for the keyboard + bottom nav area so the
        // last list item can always scroll fully above the keyboard.
        paddingBottom: 120,
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
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    modalContent: {
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        width: "100%",
        maxHeight: "85%",
        padding: 24,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
        marginBottom: 16,
    },
    modalHeaderTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: "#1E293B",
    },
    modalCloseButton: {
        padding: 4,
    },
    modalBody: {
        marginBottom: 20,
    },
    modalProductName: {
        fontSize: 20,
        fontWeight: "800",
        color: "#111827",
        lineHeight: 28,
        marginBottom: 12,
    },
    modalStatusRow: {
        flexDirection: "row",
        marginBottom: 20,
    },
    modalStatusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    modalStatusText: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    modalInfoGrid: {
        backgroundColor: "#F8FAFC",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    detailRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    detailIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: "#EFF6FF",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
        marginTop: 2,
    },
    detailTextContainer: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 11,
        color: "#64748B",
        fontWeight: "600",
        marginBottom: 2,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    detailValue: {
        fontSize: 14,
        color: "#1E293B",
        fontWeight: "600",
    },
    modalFooter: {
        borderTopWidth: 1,
        borderTopColor: "#F1F5F9",
        paddingTop: 16,
    },
    modalConfirmBtn: {
        backgroundColor: "#1565C0",
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    modalConfirmText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: "700",
    },
});
