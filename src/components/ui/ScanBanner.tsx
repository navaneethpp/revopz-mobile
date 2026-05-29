import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FONT_WEIGHT } from "@/theme/typography";

interface ScanBannerProps {
    onPress: () => void;
    disabled?: boolean;
}

export default function ScanBanner({ onPress, disabled = false }: ScanBannerProps) {
    return (
        <TouchableOpacity
            style={[styles.scanBanner, disabled && styles.scanBannerDisabled]}
            activeOpacity={0.85}
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel="Scan serial numbers banner"
        >
            <View style={styles.scanBannerLeft}>
                <Text style={styles.scanBrackets}>{"[ - ]"}</Text>
            </View>
            <Text style={styles.scanBannerText}>Scan Serial Numbers</Text>
            <View style={styles.scanBannerRight}>
                <MaterialCommunityIcons name="barcode-scan" size={28} color="#FFFFFF" />
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    scanBanner: {
        height: 86,
        backgroundColor: "#0B57D0",
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        ...Platform.select({
            ios: {
                shadowColor: "#0B57D0",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    scanBannerDisabled: {
        opacity: 0.75,
    },
    scanBannerLeft: {
        width: 32,
        justifyContent: "center",
    },
    scanBrackets: {
        color: "rgba(255, 255, 255, 0.4)",
        fontSize: 12,
        fontFamily: "System",
        fontWeight: "700",
    },
    scanBannerText: {
        fontSize: 17,
        fontWeight: FONT_WEIGHT.bold as any,
        color: "#FFFFFF",
    },
    scanBannerRight: {
        width: 32,
        alignItems: "flex-end",
        justifyContent: "center",
    },
});
