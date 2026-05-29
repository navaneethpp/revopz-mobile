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
    qtyContainer: {
        height: 52,
        backgroundColor: "#F8FAFC",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        alignItems: "center",
        justifyContent: "center",
    },
    qtyDisplayText: {
        fontSize: 22,
        fontWeight: FONT_WEIGHT.bold as any,
        color: "#0B57D0",
        textAlign: "center",
    },
});
