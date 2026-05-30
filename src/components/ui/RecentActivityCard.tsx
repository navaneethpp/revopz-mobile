import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { router } from "expo-router";
import ActivityItem from "./ActivityItem";
import type { ActivityItem as ActivityItemData } from "@/services/activityService";

type Props = {
    entries?: ActivityItemData[];
    loading?: boolean;
    /** True when the fetch failed — shows an error message instead of empty state */
    error?: boolean;
    /** Called when the user taps "Tap to retry" in the error state */
    onRetry?: () => void;
};

export default function RecentActivityCard({ entries = [], loading = false, error = false, onRetry }: Props) {

    return (
        <View style={styles.card}>
            {/* Header row */}
            <View style={styles.header}>
                <Text style={styles.heading}>Recent Activity</Text>
                <TouchableOpacity
                    onPress={() => router.push("/activity")}
                    activeOpacity={0.7}
                    accessibilityLabel="View all activity logs"
                >
                    <Text style={styles.viewAll}>View All</Text>
                </TouchableOpacity>
            </View>

            {/* Loading state */}
            {loading && (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="small" color="#D97706" />
                    <Text style={styles.loadingText}>Loading activity…</Text>
                </View>
            )}

            {/* Error state — distinct from empty state (ES-01 / FB-04) */}
            {!loading && error && (
                <View style={styles.centerBox}>
                    <Text style={styles.errorText}>Failed to load activity.</Text>
                    {onRetry && (
                        <TouchableOpacity onPress={onRetry} activeOpacity={0.7} style={styles.retryBtn}>
                            <Text style={styles.retryText}>Tap to retry</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            {/* Empty state */}
            {!loading && !error && entries.length === 0 && (
                <View style={styles.centerBox}>
                    <Text style={styles.emptyText}>No recent activity yet.</Text>
                </View>
            )}

            {/* Live entries */}
            {!loading && !error &&
                entries.map((entry, index) => (
                    <ActivityItem
                        key={entry.id}
                        title={entry.title}
                        subtitle={entry.subtitle}
                        isLast={index === entries.length - 1}
                    />
                ))}
        </View>
    );
}


const styles = StyleSheet.create({
    card: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        padding: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 18,
    },
    heading: {
        fontSize: 17,
        fontWeight: "700",
        color: "#111827",
    },
    viewAll: {
        fontSize: 14,
        fontWeight: "600",
        color: "#D97706",
    },
    centerBox: {
        alignItems: "center",
        paddingVertical: 16,
    },
    loadingText: {
        fontSize: 13,
        color: "#6B7280",
        marginTop: 8,
    },
    emptyText: {
        fontSize: 14,
        color: "#9CA3AF",
    },
    errorText: {
        fontSize: 14,
        color: "#DC2626",
        fontWeight: "500",
    },
    retryBtn: {
        marginTop: 8,
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: "#FFFBEB",
    },
    retryText: {
        fontSize: 13,
        color: "#D97706",
        fontWeight: "600",
    },
});