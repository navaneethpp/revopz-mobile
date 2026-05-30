import React, { useState } from "react";
import {
    FlatList,
    Keyboard,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { COLORS } from "@/theme/colors";
import { FONT_SIZE, FONT_WEIGHT } from "@/theme/typography";
import { RADIUS } from "@/theme/radius";

export interface DropdownOption {
    label: string;
    value: string;
}

interface LabeledDropdownProps {
    label: string;
    options: DropdownOption[];
    value: string | null;
    onChange: (option: DropdownOption) => void;
    placeholder?: string;
}

/**
 * A reusable labeled dropdown (picker) component with a modal option list.
 * Renders a small all-caps label above a tappable row that opens a bottom sheet modal.
 */
export default function LabeledDropdown({
    label,
    options,
    value,
    onChange,
    placeholder = "Select…",
}: LabeledDropdownProps) {
    const [open, setOpen] = useState(false);

    const selected = options.find((o) => o.value === value);

    return (
        <View style={styles.wrapper}>
            <Text style={styles.label}>{label}</Text>

            <TouchableOpacity
                style={styles.selector}
                activeOpacity={0.75}
                onPress={() => {
                    Keyboard.dismiss();
                    setOpen(true);
                }}
                accessibilityLabel={`${label} dropdown`}
                accessibilityRole="button"
            >
                <Text
                    style={[
                        styles.selectorText,
                        !selected && styles.placeholderText,
                    ]}
                >
                    {selected ? selected.label : placeholder}
                </Text>
                <Feather name="chevron-down" size={18} color="#64748B" />
            </TouchableOpacity>

            {/* Modal sheet */}
            <Modal
                visible={open}
                transparent
                animationType="fade"
                onRequestClose={() => setOpen(false)}
            >
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={() => setOpen(false)}
                />
                <View style={styles.sheet}>
                    <View style={styles.sheetHandle} />
                    <Text style={styles.sheetTitle}>{label}</Text>
                    <FlatList
                        data={options}
                        keyExtractor={(item) => item.value}
                        ItemSeparatorComponent={() => (
                            <View style={styles.separator} />
                        )}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={[
                                    styles.option,
                                    item.value === value &&
                                        styles.optionSelected,
                                ]}
                                activeOpacity={0.7}
                                onPress={() => {
                                    Keyboard.dismiss();
                                    onChange(item);
                                    setOpen(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        item.value === value &&
                                            styles.optionTextSelected,
                                    ]}
                                >
                                    {item.label}
                                </Text>
                                {item.value === value && (
                                    <Feather
                                        name="check"
                                        size={16}
                                        color={COLORS.primary}
                                    />
                                )}
                            </TouchableOpacity>
                        )}
                    />
                </View>
            </Modal>
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
    selector: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.surface,
        borderRadius: RADIUS.md,
        borderWidth: 1,
        borderColor: COLORS.border,
        paddingHorizontal: 14,
        height: 50,
    },
    selectorText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textPrimary,
        fontWeight: FONT_WEIGHT.medium as any,
    },
    placeholderText: {
        color: COLORS.slate400,
        fontWeight: FONT_WEIGHT.regular as any,
    },
    /* Modal */
    backdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.35)",
    },
    sheet: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        paddingBottom: 32,
        paddingHorizontal: 16,
        maxHeight: "60%",
    },
    sheetHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.slate300,
        alignSelf: "center",
        marginBottom: 16,
    },
    sheetTitle: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold as any,
        color: "#64748B",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: 12,
    },
    separator: {
        height: 1,
        backgroundColor: COLORS.border,
    },
    option: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        paddingHorizontal: 4,
    },
    optionSelected: {
        // no background change, just checkmark
    },
    optionText: {
        fontSize: FONT_SIZE.md,
        color: COLORS.textPrimary,
    },
    optionTextSelected: {
        color: COLORS.primary,
        fontWeight: FONT_WEIGHT.semibold as any,
    },
});
