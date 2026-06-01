import { COLORS } from "@/theme/colors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

export interface TimelineSectionProps {
    title: string;
    children: React.ReactNode;
}

export default function TimelineSection({ title, children }: TimelineSectionProps) {
    return (
        <View style={styles.sectionContainer}>
            {/* Section Header Row with Divider Lines */}
            <View style={styles.headerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.titleText}>{title.toUpperCase()}</Text>
                <View style={styles.dividerLine} />
            </View>

            {/* List of items inside the section */}
            <View style={styles.listContainer}>
                {children}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    sectionContainer: {
        marginBottom: 8,
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        marginVertical: 18,
        paddingHorizontal: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1.25,
        backgroundColor: COLORS.border,
    },
    titleText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#64748B",
        marginHorizontal: 16,
        letterSpacing: 1.5,
    },
    listContainer: {
        paddingHorizontal: 12,
    },
});
