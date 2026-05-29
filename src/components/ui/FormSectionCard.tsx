import React from "react";
import { StyleSheet, View } from "react-native";
import { COLORS } from "@/theme/colors";
import { RADIUS } from "@/theme/radius";

interface FormSectionCardProps {
    children: React.ReactNode;
    style?: object;
}

/**
 * A reusable card container used to group form fields visually.
 * Provides a white surface with rounded corners and a subtle border/shadow.
 */
export default function FormSectionCard({
    children,
    style,
}: FormSectionCardProps) {
    return (
        <View style={[styles.card, style]}>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.lg,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 16,
        paddingVertical: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
});
