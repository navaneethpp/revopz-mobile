import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";

import PageHeader from "@/components/ui/PageHeader";
import FormSectionCard from "@/components/ui/FormSectionCard";
import SkuInput from "@/components/ui/SkuInput";
import LabeledDropdown, {
    type DropdownOption,
} from "@/components/ui/LabeledDropdown";
import InspectionToggleCard from "@/components/ui/InspectionToggleCard";
import { fetchProducts } from "@/services/productService";
import { COLORS } from "@/theme/colors";
import { FONT_SIZE, FONT_WEIGHT } from "@/theme/typography";
import { RADIUS } from "@/theme/radius";
import { SPACING } from "@/theme/spacing";

/* ─── Static option data ─────────────────────────────────────── */
const CATEGORY_OPTIONS: DropdownOption[] = [
    { label: "Mechanical Components", value: "mechanical" },
    { label: "Electrical Components", value: "electrical" },
    { label: "Pneumatic Systems", value: "pneumatic" },
    { label: "Hydraulic Systems", value: "hydraulic" },
    { label: "Control Systems", value: "control" },
    { label: "Safety Equipment", value: "safety" },
];

/* ─── Screen ──────────────────────────────────────────────────── */
export default function AddUnitScreen() {
    const [sku, setSku] = useState("");
    const [productName, setProductName] = useState<string | null>(null);
    const [productOptions, setProductOptions] = useState<DropdownOption[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [category, setCategory] = useState<string | null>("mechanical");
    const [requiresInspection, setRequiresInspection] = useState(false);

    // Fetch product options from Firestore on mount
    useEffect(() => {
        let active = true;
        fetchProducts()
            .then((options) => {
                if (active) {
                    setProductOptions(options);
                    setProductsLoading(false);
                }
            })
            .catch((err) => {
                console.error("[AddUnitScreen] failed to load products:", err);
                if (active) {
                    setProductsLoading(false);
                }
            });
        return () => {
            active = false;
        };
    }, []);

    const handleBarcodeScan = () => {
        // Navigate to scanner screen — adjust route as needed
        router.push("/scanner" as any);
    };

    const handleRegister = () => {
        // TODO: wire up Firestore submission
        console.log({ sku, productName, category, requiresInspection });
        router.back();
    };

    const handleCancel = () => {
        router.back();
    };

    return (
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <PageHeader
                title="Add Product"
                showBackButton
                showSearch={false}
                showAvatar
            />

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── Page title & subtitle ── */}
                    <View style={styles.titleBlock}>
                        <Text style={styles.pageTitle}>Add New Item</Text>
                        <Text style={styles.pageSubtitle}>
                            Enter the specific details for the single unit entry
                            into the warehouse ledger.
                        </Text>
                    </View>

                    {/* ── Main form card ── */}
                    <FormSectionCard style={styles.formCard}>
                        <SkuInput
                            value={sku}
                            onChangeText={setSku}
                            onBarcodeScan={handleBarcodeScan}
                        />

                        <LabeledDropdown
                            label="Product Name"
                            options={productOptions}
                            value={productName}
                            onChange={(opt) => setProductName(opt.value)}
                            placeholder={productsLoading ? "Loading products..." : "Select Product Name"}
                        />

                        <LabeledDropdown
                            label="Category"
                            options={CATEGORY_OPTIONS}
                            value={category}
                            onChange={(opt) => setCategory(opt.value)}
                            placeholder="Select Category"
                        />
                    </FormSectionCard>

                    {/* ── Inspection toggle ── */}
                    <InspectionToggleCard
                        value={requiresInspection}
                        onValueChange={setRequiresInspection}
                    />
                </ScrollView>

                {/* ── Action buttons (pinned to bottom) ── */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.registerBtn}
                        activeOpacity={0.85}
                        onPress={handleRegister}
                        accessibilityLabel="Register item"
                        accessibilityRole="button"
                    >
                        <MaterialCommunityIcons
                            name="database-plus-outline"
                            size={20}
                            color="#FFFFFF"
                            style={styles.registerIcon}
                        />
                        <Text style={styles.registerText}>Register Item</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelBtn}
                        activeOpacity={0.7}
                        onPress={handleCancel}
                        accessibilityLabel="Cancel"
                        accessibilityRole="button"
                    >
                        <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    flex: {
        flex: 1,
    },
    scroll: {
        paddingHorizontal: SPACING.screenPadding,
        paddingTop: 24,
        paddingBottom: 20,
        gap: 16,
    },
    /* Title block */
    titleBlock: {
        marginBottom: 4,
    },
    pageTitle: {
        fontSize: 26,
        fontWeight: FONT_WEIGHT.bold as any,
        color: COLORS.textPrimary,
        marginBottom: 6,
    },
    pageSubtitle: {
        fontSize: FONT_SIZE.sm,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    /* Form card — give a tiny extra horizontal gap inside the card */
    formCard: {
        paddingBottom: 4,
    },
    /* Footer */
    footer: {
        paddingHorizontal: SPACING.screenPadding,
        paddingBottom: Platform.OS === "ios" ? 8 : 16,
        paddingTop: 12,
        backgroundColor: COLORS.background,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    registerBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: SPACING.buttonHeight,
        backgroundColor: COLORS.primary,
        borderRadius: RADIUS.md,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    registerIcon: {
        marginRight: 8,
    },
    registerText: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.bold as any,
        color: "#FFFFFF",
    },
    cancelBtn: {
        height: SPACING.buttonHeight,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: RADIUS.md,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
        backgroundColor: "transparent",
    },
    cancelText: {
        fontSize: FONT_SIZE.md,
        fontWeight: FONT_WEIGHT.semibold as any,
        color: COLORS.primary,
    },
});
