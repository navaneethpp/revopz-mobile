import React from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, ActivityIndicator } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "@/theme/colors";
import { FONT_WEIGHT } from "@/theme/typography";

interface ManualSerialAddProps {
    value: string;
    onChangeText: (text: string) => void;
    onAdd: () => void;
    loading?: boolean;
    disabled?: boolean;
}

export default function ManualSerialAdd({
    value,
    onChangeText,
    onAdd,
    loading = false,
    disabled = false,
}: ManualSerialAddProps) {
    const isActionDisabled = disabled || loading;

    return (
        <View style={styles.card}>
            <Text style={styles.cardLabel}>SERIAL NUMBER</Text>
            <View style={styles.manualEntryRow}>
                <View style={[styles.manualInputWrapper, disabled && styles.manualInputWrapperDisabled]}>
                    <Feather name="grid" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                    <TextInput
                        style={[styles.manualInput, disabled && styles.manualInputDisabled]}
                        placeholder="Enter serial number"
                        placeholderTextColor="#94A3B8"
                        value={value}
                        onChangeText={onChangeText}
                        autoCapitalize="characters"
                        autoCorrect={false}
                        onSubmitEditing={onAdd}
                        returnKeyType="done"
                        editable={!disabled}
                    />
                </View>
                <TouchableOpacity
                    style={[styles.addButton, isActionDisabled && styles.addButtonDisabled]}
                    activeOpacity={0.8}
                    onPress={onAdd}
                    disabled={isActionDisabled}
                    accessibilityRole="button"
                    accessibilityLabel="Add serial number"
                >
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <>
                            <Feather name="plus" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                            <Text style={styles.addButtonText}>Add</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
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
    manualEntryRow: {
        flexDirection: "row",
        alignItems: "center",
    },
    manualInputWrapper: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        paddingHorizontal: 12,
        height: 48,
    },
    manualInputWrapperDisabled: {
        backgroundColor: "#F8FAFC",
        borderColor: "#E2E8F0",
    },
    manualInput: {
        flex: 1,
        fontSize: 15,
        color: COLORS.textPrimary,
        height: "100%",
    },
    manualInputDisabled: {
        color: "#94A3B8",
    },
    addButton: {
        width: 92,
        height: 48,
        backgroundColor: "#059669",
        borderRadius: 10,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginLeft: 10,
        ...Platform.select({
            ios: {
                shadowColor: "#059669",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    addButtonDisabled: {
        backgroundColor: "#94A3B8",
        shadowOpacity: 0,
        elevation: 0,
    },
    addButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: FONT_WEIGHT.bold as any,
    },
});
