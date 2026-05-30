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
                                <Feather name="trash-2" size={18} color={disabled ? COLORS.slate300 : COLORS.red600} />
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
        backgroundColor: COLORS.white,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
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
        backgroundColor: COLORS.slate100,
        borderRadius: 20,
        paddingVertical: 5,
        paddingHorizontal: 12,
    },
    progressPillLabel: {
        fontSize: 9,
        fontWeight: "900",
        color: COLORS.blue700,
        letterSpacing: 0.6,
        marginRight: 6,
    },
    progressPillValue: {
        fontSize: 11,
        fontWeight: FONT_WEIGHT.bold as any,
        color: COLORS.slate800,
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
        borderBottomColor: COLORS.slate100,
    },
    itemSerial: {
        fontSize: 14,
        fontWeight: FONT_WEIGHT.semibold as any,
        color: COLORS.slate800,
    },
    itemSerialDisabled: {
        color: COLORS.slate400,
    },
    itemStatus: {
        fontSize: 10,
        fontWeight: FONT_WEIGHT.bold as any,
        color: COLORS.emerald600,
        marginTop: 3,
        letterSpacing: 0.4,
    },
    itemStatusDisabled: {
        color: COLORS.emerald200,
    },
    deleteBtn: {
        padding: 6,
    },
});
