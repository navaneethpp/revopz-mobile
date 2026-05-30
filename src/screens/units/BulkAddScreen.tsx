import React, { useEffect, useRef, useState } from "react";
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
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { doc, getDoc } from "firebase/firestore";

import { scanEvents } from "@/utils/scanEvents";

import PageHeader from "@/components/ui/PageHeader";
import ProductSelector from "@/components/ui/ProductSelector";
import ScanBanner from "@/components/ui/ScanBanner";
import ManualSerialAdd from "@/components/ui/ManualSerialAdd";
import TotalQtyDisplay from "@/components/ui/TotalQtyDisplay";
import ScannedUnitsList from "@/components/ui/ScannedUnitsList";

import { Alert } from "@/context/AlertContext";
import { fetchProducts, type Product } from "@/services/productService";
import { COLORS } from "@/theme/colors";
import { registerUnitsBatch } from "@/services/unitService";
import { db } from "@/config/firebase";
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

    const [serialInput, setSerialInput] = useState("");
    const [scannedList, setScannedList] = useState<ScannedUnit[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [addingManualSerial, setAddingManualSerial] = useState(false);

    // CR-02: mounted ref — prevents state updates on unmounted component
    // when async verification resolves after the user has already navigated away.
    const mountedRef = useRef(true);
    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const totalQty = scannedList.length;

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
            .catch(() => {
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

    // Process Scanned Barcodes
    const processScannedBarcodes = async (serials: string[]) => {
        if (serials.length === 0) return;

        // Filter out serials already in the local scannedList to avoid local duplicates
        const uniqueNewSerials = serials.filter(
            (s) => s && !scannedList.some((item) => item && item.serial === s)
        );

        if (uniqueNewSerials.length === 0) {
            Alert.alert("No New Items", "All scanned barcodes are already present in your current batch list.");
            return;
        }

        setAddingManualSerial(true);
        const verifiedList: ScannedUnit[] = [];
        const duplicatesInDb: string[] = [];
        const failedSerials: string[] = [];

        try {
            await Promise.all(
                uniqueNewSerials.map(async (serial) => {
                    try {
                        const docRef = doc(db, "manufactured_units", serial);
                        const docSnap = await getDoc(docRef);
                        if (docSnap.exists()) {
                            duplicatesInDb.push(serial);
                        } else {
                            verifiedList.push({ serial, status: "VERIFIED SUCCESS" });
                        }
                    } catch {
                        failedSerials.push(serial);
                    }
                })
            );

            // CR-02: guard against unmounted state updates
            if (!mountedRef.current) return;

            // Add the verified ones to scannedList
            if (verifiedList.length > 0) {
                setScannedList((prev) => [...prev, ...verifiedList]);
            }

            // UX-02: truncate long serial lists to avoid unscrollable alerts
            const formatList = (list: string[]) => {
                const shown = list.slice(0, 5).join("\n");
                return list.length > 5 ? `${shown}\n… and ${list.length - 5} more` : shown;
            };

            // Report results
            if (duplicatesInDb.length > 0 || failedSerials.length > 0) {
                let message = "";
                if (duplicatesInDb.length > 0) {
                    message += `The following serial numbers already exist in the database and were excluded:\n${formatList(duplicatesInDb)}\n\n`;
                }
                if (failedSerials.length > 0) {
                    message += `Failed to verify the following serial numbers due to connection issues:\n${formatList(failedSerials)}`;
                }
                Alert.alert("Verification Results", message.trim());
            } else if (verifiedList.length > 0) {
                triggerHaptic("success");
            }
        } catch {
            // CR-02: guard
            if (!mountedRef.current) return;
            Alert.alert("Verification Error", "An error occurred while verifying the scanned serial numbers.");
        } finally {
            if (mountedRef.current) setAddingManualSerial(false);
        }
    };

    // Camera Scan Handler
    const handleScanBarcode = () => {
        if (submitting || addingManualSerial) return;
        dismissKeyboard();

        const currentSerials = scannedList.map((item) => item.serial);

        scanEvents.setCallback((serials) => {
            processScannedBarcodes(serials);
        });

        router.push({
            pathname: "/scanner",
            params: {
                mode: "bulk",
                targetQty: 24,
                initialSerials: JSON.stringify(currentSerials),
            },
        } as any);
    };

    // Manual Add Handler
    const handleManualAdd = async () => {
        if (submitting || addingManualSerial) return;
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
        // FV-05: minimum serial length guard
        if (trimmedSerial.length < 3) {
            Alert.alert("Validation Error", "Serial number must be at least 3 characters.");
            return;
        }

        // Check if already in local scanned list
        if (scannedList.some((item) => item && item.serial === trimmedSerial)) {
            Alert.alert("Duplicate Item", `Serial number "${trimmedSerial}" is already in this batch list.`);
            return;
        }

        setAddingManualSerial(true);
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
            // CR-02: guard
            if (!mountedRef.current) return;
            setScannedList((prev) => [
                ...prev,
                { serial: trimmedSerial, status: "VERIFIED SUCCESS" },
            ]);
            setSerialInput("");
        } catch {
            Alert.alert("Verification Failed", "Failed to verify the serial number with the database.");
        } finally {
            if (mountedRef.current) setAddingManualSerial(false);
        }
    };

    // Remove Scanned Item
    const handleRemoveItem = (serial: string) => {
        if (submitting || addingManualSerial) return;
        triggerHaptic("light");
        setScannedList((prev) => prev.filter((item) => item && item.serial !== serial));
    };

    // Submit Batch Handler
    const handleSubmitBatch = async () => {
        if (submitting || addingManualSerial) return;
        dismissKeyboard();
        if (!selectedProduct) {
            Alert.alert("Validation Error", "Please select a product.");
            return;
        }
        // FV-03: category guard — check if the product category is missing
        if (!selectedProduct.category || !selectedProduct.category.trim()) {
            Alert.alert("Validation Error", "Selected product is missing a category. Please contact your administrator.");
            return;
        }
        if (scannedList.length === 0) {
            Alert.alert("Validation Error", "Please scan or add at least one serial number.");
            return;
        }

        setSubmitting(true);
        try {
            const productNumbers = scannedList
                .filter((item) => item && item.serial)
                .map((item) => item.serial);

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
            Alert.alert("Submission Failed", err?.message || "An unexpected error occurred during batch registration.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.background} />

            {/* Header */}
            <PageHeader
                title="Bulk Add"
                showBackButton={!submitting && !addingManualSerial}
                showSearch={false}
                showAvatar={!submitting && !addingManualSerial}
                onBackPress={() => {
                    if (!submitting && !addingManualSerial) {
                        router.back();
                    }
                }}
            />

            <KeyboardAvoidingView
                style={styles.flex}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scroll}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    overScrollMode="never"
                >
                    {/* 1. Reusable Product Selector */}
                    <ProductSelector
                        value={selectedProduct ? selectedProduct.name : null}
                        loading={productsLoading}
                        disabled={submitting || addingManualSerial}
                        onPress={() => {
                            dismissKeyboard();
                            setProductDropdownOpen(true);
                        }}
                    />

                    {/* 2. Reusable Scan Serial Numbers Banner */}
                    <ScanBanner
                        onPress={handleScanBarcode}
                        disabled={submitting || addingManualSerial}
                    />

                    {/* 3. Reusable Manual Entry Card */}
                    <ManualSerialAdd
                        value={serialInput}
                        onChangeText={setSerialInput}
                        onAdd={handleManualAdd}
                        loading={addingManualSerial}
                        disabled={submitting || addingManualSerial}
                    />

                    {/* 4. Reusable Total Quantity Display */}
                    <TotalQtyDisplay value={totalQty} />

                    {/* 5. Reusable Scanned list progress card */}
                    <ScannedUnitsList
                        items={scannedList}
                        onRemove={handleRemoveItem}
                        disabled={submitting || addingManualSerial}
                    />
                </ScrollView>

                {/* Footer Action Buttons */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[
                            styles.submitBtn,
                            (submitting || addingManualSerial || scannedList.length === 0) && styles.submitBtnDisabled,
                        ]}
                        activeOpacity={0.85}
                        onPress={handleSubmitBatch}
                        disabled={submitting || addingManualSerial || scannedList.length === 0}
                        accessibilityRole="button"
                        accessibilityLabel="Submit batch registration"
                    >
                        {submitting ? (
                            <ActivityIndicator color={COLORS.white} size="small" />
                        ) : (
                            <Text style={styles.submitBtnText}>Submit Batch</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.cancelBtn}
                        activeOpacity={0.7}
                        onPress={() => router.back()}
                        disabled={submitting || addingManualSerial}
                        accessibilityRole="button"
                        accessibilityLabel="Cancel"
                    >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>

            {/* Product Selection Modal */}
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
                        bounces={false}
                        overScrollMode="never"
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
        backgroundColor: COLORS.blueAccent,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        ...Platform.select({
            ios: {
                shadowColor: COLORS.blueAccent,
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
        backgroundColor: COLORS.slate400,
        shadowOpacity: 0,
        elevation: 0,
    },
    submitBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "700",
    },
    cancelBtn: {
        height: SPACING.buttonHeight,
        backgroundColor: COLORS.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelBtnText: {
        color: COLORS.slate600,
        fontSize: 16,
        fontWeight: "600",
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.4)",
    },
    modalSheet: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: COLORS.white,
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
        backgroundColor: COLORS.slate300,
        alignSelf: "center",
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 11,
        fontWeight: "700",
        color: COLORS.textMuted,
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
        borderBottomColor: COLORS.slate100,
    },
    modalOptionSelected: {},
    modalOptionText: {
        fontSize: 16,
        color: COLORS.textPrimary,
        flex: 1,
    },
    modalOptionTextSelected: {
        color: COLORS.primary,
        fontWeight: "600",
    },
});
