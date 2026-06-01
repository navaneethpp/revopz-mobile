import React from "react";
import { StyleSheet, Switch, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/theme/colors";
import { FONT_SIZE, FONT_WEIGHT } from "@/theme/typography";
import { RADIUS } from "@/theme/radius";

interface InspectionToggleCardProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
    title?: string;
    description?: string;
}

/**
 * A card-style toggle for "Requires Inspection" (or any boolean flag).
 * Shows an icon, title, description text, and a Switch on the right.
 */
export default function InspectionToggleCard({
    value,
    onValueChange,
    title = "Requires Inspection",
    description = "HOLD item for QA review before release",
}: InspectionToggleCardProps) {
    return (
        <View style={styles.card}>
            {/* Left: icon + text */}
            <View style={styles.iconWrap}>
                <MaterialCommunityIcons
                    name="clipboard-check-outline"
                    size={24}
                    color={COLORS.warning}
                />
            </View>

            <View style={styles.textGroup}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>
            </View>

            {/* Right: toggle */}
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: COLORS.gray300, true: COLORS.primary }}
                thumbColor={COLORS.white}
                accessibilityLabel={title}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
        gap: 12,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    iconWrap: {
        width: 40,
        height: 40,
        borderRadius: RADIUS.md,
        backgroundColor: COLORS.amber100,
        alignItems: "center",
        justifyContent: "center",
    },
    textGroup: {
        flex: 1,
    },
    title: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold as any,
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    description: {
        fontSize: FONT_SIZE.xs,
        color: "#64748B",
        lineHeight: 17,
        fontWeight: FONT_WEIGHT.medium as any,
        textTransform: "uppercase",
        letterSpacing: 0.3,
    },
});
