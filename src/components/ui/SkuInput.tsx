import React from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { COLORS } from "@/theme/colors";
import { FONT_SIZE, FONT_WEIGHT } from "@/theme/typography";
import { RADIUS } from "@/theme/radius";

interface SkuInputProps extends TextInputProps {
    onBarcodeScan?: () => void;
}

/**
 * SKU / Serial Number field with an embedded barcode scanner button.
 * The scanner icon button triggers the camera/scanner flow.
 */
export default function SkuInput({ onBarcodeScan, ...props }: SkuInputProps) {
    return (
        <View style={styles.wrapper}>
            <Text style={styles.label}>SKU / SERIAL NUMBER</Text>
            <View style={styles.row}>
                <TextInput
                    style={styles.input}
                    placeholder="E.g. SN-8802-XP"
                    placeholderTextColor={COLORS.slate400}
                    autoCapitalize="characters"
                    returnKeyType="next"
                    accessibilityLabel="SKU or serial number input"
                    {...props}
                />
                <TouchableOpacity
                    style={styles.scanBtn}
                    activeOpacity={0.8}
                    onPress={onBarcodeScan}
                    accessibilityLabel="Scan barcode"
                    accessibilityRole="button"
                >
                    <MaterialCommunityIcons
                        name="barcode-scan"
                        size={24}
                        color={COLORS.white}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: 16,
    },
    label: {
        fontSize: 11,
        fontWeight: FONT_WEIGHT.semibold as any,
        color: "#64748B",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: 8,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
    },
    input: {
        flex: 1,
        height: 50,
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 14,
        fontSize: FONT_SIZE.md,
        color: COLORS.textPrimary,
    },
    scanBtn: {
        width: 50,
        height: 50,
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
        elevation: 4,
    },
});
