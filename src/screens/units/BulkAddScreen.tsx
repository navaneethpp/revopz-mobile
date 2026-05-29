import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";

import PageHeader from "@/components/ui/PageHeader";
import { Alert } from "@/context/AlertContext";
import { fetchProducts, type Product } from "@/services/productService";
import { registerUnitsBatch } from "@/services/unitService";
import { db } from "@/config/firebase";
import { COLORS } from "@/theme/colors";
import { FONT_SIZE, FONT_WEIGHT } from "@/theme/typography";
import { RADIUS } from "@/theme/radius";
import { SPACING } from "@/theme/spacing";
import { triggerHaptic } from "@/utils/haptics";

interface ScannedUnit {
    serial: string;
    status: "VERIFIED SUCCESS";
}

export default function BulkAddScreen() {
    const [products, setProducts] = useState<Product[]>([]);
    const [productsLoading, setProductsLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [productDropdownOpen, setProductDropdownOpen] = useState(false);

    const [totalQty, setTotalQty] = useState(24);
    const [serialInput, setSerialInput] = useState("");
    const [scannedList, setScannedList] = useState<ScannedUnit[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // Fetch products on mount
    useEffect(() => {
        let active = true;
        fetchProducts()
            .then((fetched) => {
                if (active) {
                    setProducts(fetched);
                    setProductsLoading(false);
                    if (fetched.length > 0) {
                        setSelectedProduct(fetched[0]); // Default to first product
                    }
                }
            })
            .catch((err) => {
                console.error("[BulkAddScreen] Failed to load products:", err);
                if (active) setProductsLoading(false);
            });
        return () => {
            active = false;
        };
    }, []);

    // Dismiss keyboard helper
    const dismissKeyboard = () => {
        Keyboard.dismiss();
    };

    // Simulated Scan Handler
    const handleSimulateScan = () => {
        dismissKeyboard();
        Alert.alert("Scan Serial Numbers", "This feature will be updated soon.");
    };

    // Manual Add Handler
    const handleManualAdd = async () => {
        dismissKeyboard();
        const trimmedSerial = serialInput.trim();
        
        if (!selectedProduct) {
            Alert.alert("Selection Required", "Please select a Product Name first.");
            return;
        }
        if (!trimmedSerial) {
            Alert.alert("Validation Error", "Please enter a valid serial number.");
            return;
        }

        if (scannedList.length >= totalQty) {
            Alert.alert("Limit Reached", `Cannot add more units. The batch size is configured to ${totalQty}.`);
            return;
        }

        // Check if already in local scanned list
        if (scannedList.some((item) => item.serial === trimmedSerial)) {
            Alert.alert("Duplicate Item", `Serial number "${trimmedSerial}" is already in this batch list.`);
            return;
        }

        try {
            // Check if already registered in the DB
            const docRef = doc(db, "manufactured_units", trimmedSerial);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                Alert.alert(
                    "Duplicate Serial Number",
                    `A unit with serial number "${trimmedSerial}" is already registered in the database.`
                );
                return;
            }

            // Success adding
            triggerHaptic("success");
            setScannedList((prev) => [
                ...prev,
                { serial: trimmedSerial, status: "VERIFIED SUCCESS" },
            ]);
            setSerialInput("");
        } catch (err: any) {
            console.error("[BulkAddScreen] Manual verification failed:", err);
            Alert.alert("Verification Failed", "Failed to verify the serial number with the database.");
        }
    };

    // Remove Scanned Item
    const handleRemoveItem = (serial: string) => {
        triggerHaptic("light");
        setScannedList((prev) => prev.filter((item) => item.serial !== serial));
    };

    // Submit Batch Handler
    const handleSubmitBatch = async () => {
        dismissKeyboard();
        if (!selectedProduct) {
            Alert.alert("Validation Error", "Please select a product.");
            return;
        }
        if (scannedList.length === 0) {
            Alert.alert("Validation Error", "Please scan or add at least one serial number.");
            return;
        }

        setSubmitting(true);
        try {
            const productNumbers = scannedList.map((item) => item.serial);
            
            await registerUnitsBatch({
                productName: selectedProduct.name,
                productNumbers,
                category: selectedProduct.category,
                warrantyMonths: selectedProduct.warrantyMonths,
            });

            triggerHaptic("success");
            Alert.alert("Batch Complete", `Successfully registered ${productNumbers.length} product units in Firestore.`, [
                { text: "OK", onPress: () => router.back() },
            ]);
        } catch (err: any) {
            console.log("[BulkAddScreen] Batch registration failed:", err?.message || err);
            Alert.alert("Submission Failed", err?.message || "An unexpected error occurred during batch registration.");
        } finally {
            setSubmitting(false);
        }
    };

    // Calculate progress percentage
    const progressPercent = Math.min(100, Math.round((scannedList.length / totalQty) * 100)) || 0;

    return (
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Custom Header with Notifications and Avatar */}
            <PageHeader
                title="Bulk Add"
                showBackButton
                showSearch={false}
                showAvatar
            />

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* 1. Product Name Dropdown Card */}
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>PRODUCT NAME</Text>
                        <TouchableOpacity
                            style={styles.dropdownSelector}
                            activeOpacity={0.75}
                            onPress={() => {
                                dismissKeyboard();
                                setProductDropdownOpen(true);
                            }}
                            accessibilityRole="button"
                            accessibilityLabel="Select product name dropdown"
                        >
                            <View style={styles.dropdownLeft}>
                                <MaterialCommunityIcons
                                    name="package-variant-closed"
                                    size={20}
                                    color="#64748B"
                                    style={{ marginRight: 10 }}
                                />
                                <Text style={styles.dropdownText} numberOfLines={1}>
                                    {productsLoading
                                        ? "Loading products..."
                                        : selectedProduct
                                        ? selectedProduct.name
                                        : "Select Product Name"}
                                </Text>
                            </View>
                            <Feather name="chevron-down" size={18} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {/* 2. Scan Serial Numbers Banner Button */}
                    <TouchableOpacity
                        style={[
                            styles.scanBanner,
                            submitting && styles.scanBannerDisabled,
                        ]}
                        activeOpacity={0.85}
                        onPress={handleSimulateScan}
                        disabled={submitting}
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

                    {/* 3. Manual Serial Number Entry Card */}
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>SERIAL NUMBER</Text>
                        <View style={styles.manualEntryRow}>
                            <View style={styles.manualInputWrapper}>
                                <Feather name="grid" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
                                <TextInput
                                    style={styles.manualInput}
                                    placeholder="Enter serial number"
                                    placeholderTextColor="#94A3B8"
                                    value={serialInput}
                                    onChangeText={setSerialInput}
                                    autoCapitalize="characters"
                                    autoCorrect={false}
                                    onSubmitEditing={handleManualAdd}
                                    returnKeyType="done"
                                />
                            </View>
                            <TouchableOpacity
                                style={styles.addButton}
                                activeOpacity={0.8}
                                onPress={handleManualAdd}
                                accessibilityRole="button"
                                accessibilityLabel="Add serial number"
                            >
                                <Feather name="plus" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                                <Text style={styles.addButtonText}>Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* 4. Total Qty Ingest Configuration Card */}
                    <View style={styles.card}>
                        <Text style={styles.cardLabel}>TOTAL QTY</Text>
                        <View style={styles.qtyContainer}>
                            <TextInput
                                style={styles.qtyInput}
                                keyboardType="number-pad"
                                value={String(totalQty)}
                                onChangeText={(val) => {
                                    const parsed = parseInt(val, 10);
                                    setTotalQty(isNaN(parsed) || parsed <= 0 ? 0 : parsed);
                                }}
                                selectTextOnFocus
                                returnKeyType="done"
                            />
                        </View>
                    </View>

                    {/* 5. Scanned List Progress Card */}
                    <View style={styles.card}>
                        <View style={styles.scannedHeader}>
                            <Text style={styles.scannedTitle}>Scanned Units</Text>
                            <View style={styles.progressPill}>
                                <Text style={styles.progressPillLabel}>MANUAL ENTRY</Text>
                                <Text style={styles.progressPillValue}>
                                    {scannedList.length} / {totalQty}
                                </Text>
                            </View>
                        </View>

                        {/* Scanned Items Map */}
                        <View style={styles.listContainer}>
                            {scannedList.map((item) => (
                                <View key={item.serial} style={styles.listItem}>
                                    <View>
                                        <Text style={styles.itemSerial}>{item.serial}</Text>
                                        <Text style={styles.itemStatus}>{item.status}</Text>
                                    </View>
                                    <TouchableOpacity
                                        onPress={() => handleRemoveItem(item.serial)}
                                        style={styles.deleteBtn}
                                        activeOpacity={0.7}
                                        accessibilityLabel={`Remove serial ${item.serial}`}
                                    >
                                        <Feather name="trash-2" size={18} color="#DC2626" />
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {scannedList.length < totalQty && (
                                <Text style={styles.progressHelper}>Scanning in progress...</Text>
                            )}
                        </View>

                        {/* Progress Bar */}
                        <View style={styles.progressBarContainer}>
                            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                        </View>
                    </View>
                </ScrollView>

                {/* Footer Action Buttons */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.submitBtn,
                            (submitting || scannedList.length === 0) && styles.submitBtnDisabled,
                        ]}
                        activeOpacity={0.85}
                        onPress={handleSubmitBatch}
                        disabled={submitting || scannedList.length === 0}
                        accessibilityRole="button"
                        accessibilityLabel="Submit batch registration"
                    >
                        {submitting ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <Text style={styles.submitBtnText}>Submit Batch</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelBtn}
                        activeOpacity={0.7}
                        onPress={() => router.back()}
                        disabled={submitting}
                        accessibilityRole="button"
                        accessibilityLabel="Cancel"
                    >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Product Picker Selection Modal (Bottom Sheet style) */}
            <Modal
                visible={productDropdownOpen}
                transparent
                animationType="fade"
                onRequestClose={() => setProductDropdownOpen(false)}
            >
                <TouchableOpacity
                    style={styles.modalBackdrop}
                    activeOpacity={1}
                    onPress={() => setProductDropdownOpen(false)}
                />
                <View style={styles.modalSheet}>
                    <View style={styles.modalHandle} />
                    <Text style={styles.modalTitle}>PRODUCT NAME</Text>
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 24 }}
                    >
                        {products.map((item) => (
                            <TouchableOpacity
                                key={item.name}
                                style={[
                                    styles.modalOption,
                                    selectedProduct?.name === item.name && styles.modalOptionSelected,
                                ]}
                                activeOpacity={0.7}
                                onPress={() => {
                                    setSelectedProduct(item);
                                    setProductDropdownOpen(false);
                                }}
                            >
                                <Text
                                    style={[
                                        styles.modalOptionText,
                                        selectedProduct?.name === item.name && styles.modalOptionTextSelected,
                                    ]}
                                >
                                    {item.name}
                                </Text>
                                {selectedProduct?.name === item.name && (
                                    <Feather name="check" size={16} color={COLORS.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
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
        paddingTop: 20,
        paddingBottom: 24,
        gap: 16,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    /* Container Card Layouts */
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
    /* 1. Product Dropdown Styles */
    dropdownSelector: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#FFFFFF",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        paddingHorizontal: 14,
        height: 50,
    },
    dropdownLeft: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
    },
    dropdownText: {
        fontSize: 15,
        color: COLORS.textPrimary,
        fontWeight: FONT_WEIGHT.medium as any,
        flex: 1,
    },
    /* 2. Scan Banner Button Styles */
    scanBanner: {
        height: 86,
        backgroundColor: "#0B57D0", // Premium royal blue banner accent
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
    /* 3. Manual Entry Input Box */
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
    manualInput: {
        flex: 1,
        fontSize: 15,
        color: COLORS.textPrimary,
        height: "100%",
    },
    addButton: {
        width: 92,
        height: 48,
        backgroundColor: "#059669", // Success Emerald Green
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
    addButtonText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: FONT_WEIGHT.bold as any,
    },
    /* 4. Total Quantity Config */
    qtyContainer: {
        height: 52,
        backgroundColor: "#F8FAFC",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        alignItems: "center",
        justifyContent: "center",
    },
    qtyInput: {
        fontSize: 22,
        fontWeight: FONT_WEIGHT.bold as any,
        color: "#0B57D0",
        width: "100%",
        textAlign: "center",
        height: "100%",
    },
    /* 5. Scanned Items List card */
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
        backgroundColor: "#EFF6FF", // Light Blue tag
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
        color: "#1D4ED8",
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
    itemStatus: {
        fontSize: 10,
        fontWeight: FONT_WEIGHT.bold as any,
        color: "#059669",
        marginTop: 3,
        letterSpacing: 0.4,
    },
    deleteBtn: {
        padding: 6,
    },
    progressHelper: {
        fontSize: 13,
        color: "#94A3B8",
        fontStyle: "italic",
        marginTop: 12,
        marginBottom: 4,
    },
    progressBarContainer: {
        height: 5,
        backgroundColor: "#E2E8F0",
        borderRadius: 3,
        width: "100%",
        marginTop: 12,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        backgroundColor: "#0B57D0",
        borderRadius: 3,
    },
    /* Action buttons footer (pinned to bottom) */
    footer: {
        paddingHorizontal: SPACING.screenPadding,
        paddingBottom: Platform.OS === "ios" ? 8 : 16,
        paddingTop: 12,
        backgroundColor: COLORS.background,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    submitBtn: {
        height: SPACING.buttonHeight,
        backgroundColor: "#0B57D0",
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        ...Platform.select({
            ios: {
                shadowColor: "#0B57D0",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    submitBtnDisabled: {
        backgroundColor: "#94A3B8",
        shadowOpacity: 0,
        elevation: 0,
    },
    submitBtnText: {
        color: "#FFFFFF",
        fontSize: 16,
        fontWeight: FONT_WEIGHT.bold as any,
    },
    cancelBtn: {
        height: SPACING.buttonHeight,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        alignItems: "center",
        justifyContent: "center",
    },
    cancelBtnText: {
        color: "#475569",
        fontSize: 16,
        fontWeight: FONT_WEIGHT.semibold as any,
    },
    /* Product Picker Modal Bottom Sheet Styles */
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    modalSheet: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFFFFF",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 12,
        paddingHorizontal: 20,
        maxHeight: "65%",
    },
    modalHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: "#CBD5E1",
        alignSelf: "center",
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 11,
        fontWeight: FONT_WEIGHT.bold as any,
        color: "#64748B",
        letterSpacing: 0.8,
        textTransform: "uppercase",
        marginBottom: 16,
    },
    modalOption: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F1F5F9",
    },
    modalOptionSelected: {
        // no background change, just text coloring and checkmark
    },
    modalOptionText: {
        fontSize: 16,
        color: COLORS.textPrimary,
        flex: 1,
    },
    modalOptionTextSelected: {
        color: COLORS.primary,
        fontWeight: FONT_WEIGHT.semibold as any,
    },
});
