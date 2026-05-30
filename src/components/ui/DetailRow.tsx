import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

export interface DetailRowProps {
    label: string;
    value: string;
    /** Any valid Feather icon name */
    icon: React.ComponentProps<typeof Feather>["name"];
}

/**
 * A single labelled row with a Feather icon, used inside modal info grids.
 *
 * @example
 * <DetailRow label="Category" value={item.category} icon="tag" />
 */
export default function DetailRow({ label, value, icon }: DetailRowProps) {
    return (
        <View style={styles.detailRow}>
            <View style={styles.detailIconContainer}>
                <Feather name={icon} size={16} color="#D97706" />
            </View>
            <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={styles.detailValue}>{value}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    detailRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 16,
    },
    detailIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: "#FFFBEB",
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
});
