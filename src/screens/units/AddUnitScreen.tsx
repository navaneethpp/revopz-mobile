import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Keyboard,
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

import { scanEvents } from "@/utils/scanEvents";
import { Alert } from "@/context/AlertContext";
import PageHeader from "@/components/ui/PageHeader";
import FormSectionCard from "@/components/ui/FormSectionCard";
import SkuInput from "@/components/ui/SkuInput";
import CustomInput from "@/components/ui/CustomInput";
import LabeledDropdown, {
    type DropdownOption,
} from "@/components/ui/LabeledDropdown";
import InspectionToggleCard from "@/components/ui/InspectionToggleCard";
import { fetchProducts, type Product } from "@/services/productService";
import { registerUnit } from "@/services/unitService";
import { COLORS } from "@/theme/colors";
import { FONT_SIZE, FONT_WEIGHT } from "@/theme/typography";
import { RADIUS } from "@/theme/radius";
import { SPACING } from "@/theme/spacing";

/* ─── Screen ──────────────────────────────────────────────────── */
export default function AddUnitScreen() {
    const [sku, setSku] = useState("");
    const [productName, setProductName] = useState<string | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [productOptions, setProductOptions] = useState<DropdownOption[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    // CR-05: track product load failure so we can show a retry button
    const [productsError, setProductsError] = useState(false);
    const [category, setCategory] = useState("");
    const [requiresInspection, setRequiresInspection] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // CR-05: extracted so it can be called on initial mount and on retry
    const loadProducts = (active: { value: boolean }) => {
        setProductsLoading(true);
        setProductsError(false);
        fetchProducts()
            .then((fetchedProducts) => {
                if (active.value) {
                    setProducts(fetchedProducts);
                    const options = fetchedProducts.map((p) => ({
                        label: p.name,
                        value: p.name,
                    }));
                    setProductOptions(options);
                    setProductsLoading(false);
                }
            })
            .catch(() => {
                if (active.value) {
                    setProductsError(true);
                    setProductsLoading(false);
                }
            });
    };

    // Fetch product options from Firestore on mount
    useEffect(() => {
        const active = { value: true };
        loadProducts(active);
        return () => {
            active.value = false;
        };
    }, []);

    const handleProductChange = (val: string) => {
        Keyboard.dismiss();
        setProductName(val);
        const matchedProduct = products.find((p) => p.name === val);
        if (matchedProduct) {
            setCategory(matchedProduct.category || "");
        } else {
            setCategory("");
        }
    };

    const handleBarcodeScan = () => {
        scanEvents.setCallback((serials) => {
            if (serials.length > 0) {
                setSku(serials[0]);
            }
        });
        router.push({
            pathname: "/scanner",
            params: { mode: "single" },
        } as any);
    };

    const handleRegister = async () => {
        // FV-04: SKU minimum length guard
        const trimmedSku = sku.trim();
        if (!trimmedSku) {
            Alert.alert("Validation Error", "Please scan or enter a Product Serial Number (SKU).");
            return;
        }
        if (trimmedSku.length < 3) {
            Alert.alert("Validation Error", "Serial number must be at least 3 characters.");
            return;
        }
        if (!productName) {
            Alert.alert("Validation Error", "Please select a Product Name.");
            return;
        }
        // FV-03: category guard — auto-filled but could be blank if product data is incomplete
        if (!category.trim()) {
            Alert.alert("Validation Error", "Selected product is missing a category. Please contact your administrator.");
            return;
        }

        setSubmitting(true);
        try {
            // Find the selected product to get its warranty duration
            const selectedProduct = products.find((p) => p.name === productName);
            const warrantyMonths = selectedProduct ? selectedProduct.warrantyMonths : 12;

            await registerUnit({
                productName,
                productNumber: trimmedSku,
                category: category,
                requiresInspection: requiresInspection,
                warrantyMonths: warrantyMonths,
            });

            Alert.alert("Success", "Product unit has been registered successfully.", [
                { text: "OK", onPress: () => router.back() }
            ]);
        } catch (err: any) {
            Alert.alert("Registration Failed", err?.message || "An unexpected error occurred.");
        } finally {
            setSubmitting(false);
        }
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
                    bounces={false}
                    overScrollMode="never"
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

                        {/* CR-05: show retry UI if products failed to load */}
                        {productsError ? (
                            <View style={styles.retryRow}>
                                <Text style={styles.retryErrorText}>Failed to load products.</Text>
                                <TouchableOpacity
                                    onPress={() => loadProducts({ value: true })}
                                    style={styles.retryButton}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.retryButtonText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <LabeledDropdown
                                label="Product Name"
                                options={productOptions}
                                value={productName}
                                onChange={(opt) => handleProductChange(opt.value)}
                                placeholder={productsLoading ? "Loading products..." : "Select Product Name"}
                            />
                        )}

                        <CustomInput
                            label="Category"
                            value={category}
                            editable={false}
                            placeholder="Autofilled from product selection"
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
                        style={[
                            styles.registerBtn,
                            (submitting || productsLoading) && styles.registerBtnDisabled
                        ]}
                        activeOpacity={0.85}
                        onPress={handleRegister}
                        disabled={submitting || productsLoading /* LS-01 */}
                        accessibilityLabel="Register item"
                        accessibilityRole="button"
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <>
                                <MaterialCommunityIcons
                                    name="database-plus-outline"
                                    size={20}
                                    color="#FFFFFF"
                                    style={styles.registerIcon}
                                />
                                <Text style={styles.registerText}>Register Item</Text>
                            </>
                        )}
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
    registerBtnDisabled: {
        backgroundColor: "#94A3B8",
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
    /* CR-05: product load failure retry row */
    retryRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
        paddingHorizontal: 4,
    },
    retryErrorText: {
        fontSize: FONT_SIZE.sm,
        color: "#DC2626",
        fontWeight: "500" as any,
        flex: 1,
    },
    retryButton: {
        paddingVertical: 6,
        paddingHorizontal: 14,
        borderRadius: RADIUS.sm,
        backgroundColor: "#EFF6FF",
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    retryButtonText: {
        fontSize: FONT_SIZE.sm,
        fontWeight: FONT_WEIGHT.semibold as any,
        color: COLORS.primary,
    },
});

