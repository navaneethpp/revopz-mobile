import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ActivityItem from "./ActivityItem";
import type { ActivityItem as ActivityItemData } from "@/services/activityService";

type Props = {
    entries?: ActivityItemData[];
    loading?: boolean;
};

export default function RecentActivityCard({ entries = [], loading = false }: Props) {

    return (
        <View style={styles.card}>
            {/* Header row */}
            <View style={styles.header}>
                <Text style={styles.heading}>Recent Activity</Text>
                <TouchableOpacity>
                    <Text style={styles.viewAll}>View All</Text>
                </TouchableOpacity>
            </View>

            {/* Loading state */}
            {loading && (
                <View style={styles.centerBox}>
                    <ActivityIndicator size="small" color="#1565C0" />
                    <Text style={styles.loadingText}>Loading activity…</Text>
                </View>
            )}

            {/* Empty state */}
            {!loading && entries.length === 0 && (
                <View style={styles.centerBox}>
                    <Text style={styles.emptyText}>No recent activity yet.</Text>
                </View>
            )}

            {/* Live entries */}
            {!loading &&
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
        color: "#1565C0",
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
});