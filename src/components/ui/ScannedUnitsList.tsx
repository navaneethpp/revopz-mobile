import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "@/theme/colors";
import { FONT_WEIGHT } from "@/theme/typography";

interface ScannedUnit {
    serial: string;
    status: "VERIFIED SUCCESS";
}

interface ScannedUnitsListProps {
    items: ScannedUnit[];
    onRemove: (serial: string) => void;
    disabled?: boolean;
}

export default function ScannedUnitsList({ items, onRemove, disabled = false }: ScannedUnitsListProps) {
    return (
        <View style={styles.card}>
            <View style={styles.scannedHeader}>
                <Text style={styles.scannedTitle}>Scanned Units</Text>
                <View style={styles.progressPill}>
                    <Text style={styles.progressPillLabel}>MANUAL ENTRY</Text>
                    <Text style={styles.progressPillValue}>
                        {items.length}
                    </Text>
                </View>
            </View>

            {/* Scanned Items List */}
            <View style={styles.listContainer}>
                {items && items.map((item) => {
                    if (!item || !item.serial) return null;
                    return (
                        <View key={item.serial} style={styles.listItem}>
                            <View>
                                <Text style={[styles.itemSerial, disabled && styles.itemSerialDisabled]}>{item.serial}</Text>
                                <Text style={[styles.itemStatus, disabled && styles.itemStatusDisabled]}>{item.status}</Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => onRemove(item.serial)}
                                style={styles.deleteBtn}
                                activeOpacity={0.7}
                                disabled={disabled}
                                accessibilityLabel={`Remove serial ${item.serial}`}
                            >
                                <Feather name="trash-2" size={18} color={disabled ? "#CBD5E1" : "#DC2626"} />
                            </TouchableOpacity>
                        </View>
                    );
                })}
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
    scannedHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 16,
    },
    scannedTitle: {
        fontSize: 16,
        fontWeight: FONT_WEIGHT.bold as any,
        color: COLORS.textPrimary,
    },
    progressPill: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFBEB",
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 12,
    },
    progressPillLabel: {
        fontSize: 9,
        fontWeight: "900",
        color: "#1D4ED8",
        letterSpacing: 0.6,
        marginRight: 6,
    },
    progressPillValue: {
        fontSize: 11,
        fontWeight: FONT_WEIGHT.bold as any,
        color: "#92400E",
    },
    listContainer: {
        width: "100%",
    },
    listItem: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    itemSerial: {
        fontSize: 14,
        fontWeight: FONT_WEIGHT.semibold as any,
        color: "#1E293B",
    },
    itemSerialDisabled: {
        color: "#94A3B8",
    },
    itemStatus: {
        fontSize: 10,
        fontWeight: FONT_WEIGHT.bold as any,
        color: "#059669",
        marginTop: 3,
        letterSpacing: 0.4,
    },
    itemStatusDisabled: {
        color: "#A7F3D0",
    },
    deleteBtn: {
        padding: 6,
    },
});
