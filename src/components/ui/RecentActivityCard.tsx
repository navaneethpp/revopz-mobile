import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ActivityItem from "./ActivityItem";

export default function RecentActivityCard() {
    return (
        <View style={styles.card}>
            {/* Header row */}
            <View style={styles.header}>
                <Text style={styles.heading}>Recent Activity</Text>
                <TouchableOpacity>
                    <Text style={styles.viewAll}>View All</Text>
                </TouchableOpacity>
            </View>

            <ActivityItem
                title="Units Added: Titanium Drill Bits"
                subtitle="12 units added to Warehouse A • 5 mins ago"
            />
            <ActivityItem
                title="Units Added: Industrial Grade Servo"
                subtitle="24 units added to Warehouse B • 15 mins ago"
            />
            <ActivityItem
                title="Units Added: Pneumatic Actuator"
                subtitle="8 units added to Warehouse A • 45 mins ago"
                isLast
            />
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
});