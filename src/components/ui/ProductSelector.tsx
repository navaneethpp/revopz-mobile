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
                        color={disabled ? "#94A3B8" : "#64748B"}
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
                <Feather name="chevron-down" size={18} color={disabled ? "#CBD5E1" : "#64748B"} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E2E8F0",
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
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        paddingHorizontal: 14,
        height: 50,
    },
    dropdownSelectorDisabled: {
        backgroundColor: "#F8FAFC",
        borderColor: "#E2E8F0",
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
        color: "#94A3B8",
    },
});
