import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { COLORS } from "@/theme/colors";
import { FONT_WEIGHT } from "@/theme/typography";

interface ProductSelectorProps {
    value: string | null;
    loading: boolean;
    onPress: () => void;
    disabled?: boolean;
}

export default function ProductSelector({ value, loading, onPress, disabled = false }: ProductSelectorProps) {
    return (
        <View style={styles.card}>
            <Text style={styles.cardLabel}>PRODUCT NAME</Text>
            <TouchableOpacity
                style={[styles.dropdownSelector, disabled && styles.dropdownSelectorDisabled]}
                activeOpacity={0.75}
                onPress={onPress}
                disabled={disabled}
                accessibilityRole="button"
                accessibilityLabel="Select product name dropdown"
            >
                <View style={styles.dropdownLeft}>
                    <MaterialCommunityIcons
                        name="package-variant-closed"
                        size={20}
                        color={disabled ? COLORS.slate400 : "#64748B"}
                        style={{ marginRight: 10 }}
                    />
                    <Text style={[styles.dropdownText, disabled && styles.dropdownTextDisabled]} numberOfLines={1}>
                        {loading
                            ? "Loading products..."
                            : value
                            ? value
                            : "Select Product Name"}
                    </Text>
                </View>
                <Feather name="chevron-down" size={18} color={disabled ? COLORS.slate300 : "#64748B"} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        padding: 16,
    },
    cardLabel: {
        fontSize: 11,
        fontWeight: FONT_WEIGHT.semibold as any,
        color: "#64748B",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: 10,
    },
    dropdownSelector: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.white,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 14,
        height: 50,
    },
    dropdownSelectorDisabled: {
        backgroundColor: COLORS.background,
        borderColor: COLORS.border,
    },
    dropdownLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    dropdownText: {
        fontSize: 15,
        color: COLORS.textPrimary,
        fontWeight: FONT_WEIGHT.medium as any,
        flex: 1,
    },
    dropdownTextDisabled: {
        color: COLORS.slate400,
    },
});
