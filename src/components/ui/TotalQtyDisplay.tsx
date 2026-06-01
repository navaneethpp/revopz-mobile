import { COLORS } from "@/theme/colors";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { FONT_WEIGHT } from "@/theme/typography";

interface TotalQtyDisplayProps {
    value: number;
}

export default function TotalQtyDisplay({ value }: TotalQtyDisplayProps) {
    return (
        <View style={styles.card}>
            <Text style={styles.cardLabel}>TOTAL QTY</Text>
            <View style={styles.qtyContainer}>
                <Text style={styles.qtyDisplayText}>
                    {value}
                </Text>
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
    cardLabel: {
        fontSize: 11,
        fontWeight: FONT_WEIGHT.semibold as any,
        color: "#64748B",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: 10,
    },
    qtyContainer: {
        height: 52,
        backgroundColor: COLORS.background,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
    },
    qtyDisplayText: {
        fontSize: 22,
        fontWeight: FONT_WEIGHT.bold as any,
        color: COLORS.blueAccent,
        textAlign: "center",
    },
});
