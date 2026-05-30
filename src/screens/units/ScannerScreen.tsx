import React, { useState, useEffect, useRef } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import type { BarcodeScanningResult } from "expo-camera";

import { scanEvents } from "@/utils/scanEvents";
import { COLORS } from "@/theme/colors";

const mockUseCameraPermissions = () => {
    return [null, async () => false] as const;
};

let CameraView: any = null;
let useCameraPermissions: any = mockUseCameraPermissions;
let isCameraModuleAvailable = false;

try {
    const ExpoCamera = require("expo-camera");
    CameraView = ExpoCamera.CameraView;
    useCameraPermissions = ExpoCamera.useCameraPermissions || mockUseCameraPermissions;
    isCameraModuleAvailable = !!CameraView;
} catch { }
import { triggerHaptic } from "@/utils/haptics";
import { FONT_WEIGHT } from "@/theme/typography";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ScannerScreen() {
    const params = useLocalSearchParams<{
        mode?: string;
        targetQty?: string;
        initialSerials?: string;
    }>();

    const mode = params.mode === "single" ? "single" : "bulk";
    const targetQty = params.targetQty ? parseInt(params.targetQty, 10) : 24;

    // Parse initial serials safely
    let parsedInitial: string[] = [];
    try {
        if (params.initialSerials) {
            parsedInitial = JSON.parse(params.initialSerials);
        }
    } catch { }

    const [scannedSerials, setScannedSerials] = useState<string[]>(parsedInitial);
    const [permission, requestPermission] = useCameraPermissions();
    const [torchEnabled, setTorchEnabled] = useState(false);

    const [warningMessage, setWarningMessage] = useState<string | null>(null);
    const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Use synchronous refs to prevent React state race conditions during rapid camera scans
    const scannedRef = useRef<Set<string>>(new Set(parsedInitial));
    const isScanningLocked = useRef(false);

    // Clean up warning timeouts on unmount
    useEffect(() => {
        return () => {
            if (warningTimeoutRef.current) {
                clearTimeout(warningTimeoutRef.current);
            }
        };
    }, []);

    if (!isCameraModuleAvailable) {
        return (
            <SafeAreaView style={styles.permissionContainer} edges={["top", "bottom"]}>
                <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={styles.headerAction}
                        activeOpacity={0.7}
                    >
                        <Feather name="arrow-left" size={24} color={COLORS.blueAccent} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Scan Items</Text>
                    <View style={styles.headerAction} />
                </View>

                <View style={styles.permissionContent}>
                    <View style={[styles.permissionIconWrapper, { backgroundColor: COLORS.red100 }]}>
                        <MaterialCommunityIcons name="alert-circle-outline" size={64} color={COLORS.red600} />
                    </View>
                    <Text style={styles.permissionTitle}>Native Code Rebuild Required</Text>
                    <Text style={styles.permissionSubtitle}>
                        A new native module (expo-camera) was added. To use the camera barcode scanner, you must stop your current process and rebuild the app binary.
                    </Text>

                    <View style={styles.codeBlock}>
                        <Text style={styles.codeText}>npm run android</Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.permissionBtn, { backgroundColor: COLORS.red600 }]}
                        activeOpacity={0.8}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.permissionBtnText}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (!permission) {
        // Permissions are still loading
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.blueAccent} />
            </View>
        );
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet
        return (
            <SafeAreaView style={styles.permissionContainer}>
                <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
                <View style={styles.permissionContent}>
                    <View style={styles.permissionIconWrapper}>
                        <MaterialCommunityIcons name="camera-lock" size={64} color={COLORS.warning} />
                    </View>
                    <Text style={styles.permissionTitle}>Camera Permission Required</Text>
                    <Text style={styles.permissionSubtitle}>
                        Revopz needs access to your device camera to scan warehouse product barcodes and serial numbers.
                    </Text>
                    <TouchableOpacity
                        style={styles.permissionBtn}
                        activeOpacity={0.8}
                        onPress={requestPermission}
                    >
                        <Text style={styles.permissionBtnText}>Grant Access</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.permissionCancelBtn}
                        activeOpacity={0.7}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.permissionCancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Barcode scanned callback
    const handleBarcodeScanned = (result: BarcodeScanningResult) => {
        const barcodeData = result.data?.trim();
        if (!barcodeData || barcodeData.length < 3) return;

        // 1. Check scan lock (synchronous)
        if (isScanningLocked.current) return;

        // 2. Check if already scanned in current session (synchronous)
        if (scannedRef.current.has(barcodeData)) {
            // Trigger a duplicate warning alert and display the bubble message temporarily
            if (warningTimeoutRef.current) {
                clearTimeout(warningTimeoutRef.current);
            }
            setWarningMessage(`Barcode already scanned: ${barcodeData}`);
            warningTimeoutRef.current = setTimeout(() => {
                setWarningMessage(null);
            }, 2500);

            triggerHaptic("warning");
            return;
        }

        if (mode === "single") {
            isScanningLocked.current = true;
            triggerHaptic("success");
            scanEvents.trigger([barcodeData]);
            router.back();
        } else {
            // Lock scanning immediately (synchronous)
            isScanningLocked.current = true;

            // Add to scanned ref immediately (synchronous)
            scannedRef.current.add(barcodeData);

            triggerHaptic("success");

            // Update UI state
            setScannedSerials((prev) => [barcodeData, ...prev]);

            // Release the scan lock after a short delay (e.g. 1.2s)
            // to allow the user to point the camera at a different barcode
            setTimeout(() => {
                isScanningLocked.current = false;
            }, 1200);
        }
    };

    // Finished scanning button handler (only for bulk mode)
    const handleFinishScanning = () => {
        // Trigger callback with all scanned serials
        scanEvents.trigger(scannedSerials);
        router.back();
    };

    // Helper to calculate progress percentage (efficiency)
    const currentCount = scannedSerials.length;
    const progressPercent = Math.min((currentCount / targetQty) * 100, 100);

    return (
        <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* Custom Header matching the screenshot */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.headerAction}
                    activeOpacity={0.7}
                >
                    <Feather name="arrow-left" size={24} color={COLORS.blueAccent} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Scan Items</Text>

                <TouchableOpacity
                    onPress={() => setTorchEnabled((prev) => !prev)}
                    style={styles.headerAction}
                    activeOpacity={0.7}
                >
                    <MaterialCommunityIcons
                        name={torchEnabled ? "flashlight" : "flashlight-off"}
                        size={24}
                        color={COLORS.blueAccent}
                    />
                </TouchableOpacity>
            </View>

            {/* Camera View Area */}
            <View style={styles.cameraContainer}>
                <CameraView
                    style={StyleSheet.absoluteFill}
                    facing="back"
                    enableTorch={torchEnabled}
                    onBarcodeScanned={handleBarcodeScanned}
                    barcodeScannerSettings={{
                        barcodeTypes: [
                            "qr",
                            "ean13",
                            "ean8",
                            "code128",
                            "code39",
                            "code93",
                            "itf14",
                            "codabar",
                            "upc_a",
                            "upc_e",
                        ],
                    }}
                >
                    {/* Centered Align Text Overlay */}
                    <View style={styles.cameraOverlay}>
                        <Text style={styles.overlayText}>Align barcode within the frame</Text>

                        {warningMessage && (
                            <View style={styles.warningOverlay}>
                                <Feather name="alert-triangle" size={16} color={COLORS.white} />
                                <Text style={styles.warningText} numberOfLines={2}>
                                    {warningMessage}
                                </Text>
                            </View>
                        )}

                        {/* Scanner Framing Overlay */}
                        <View style={styles.scannerFrame}>
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                        </View>
                    </View>
                </CameraView>
            </View>

            {/* Bottom panel / sheet (only displayed in bulk mode) */}
            {mode === "bulk" && (
                <View style={styles.bottomSheet}>
                    {/* Session progress and Efficiency indicators */}
                    <View style={styles.metricsRow}>
                        <View style={styles.metricItem}>
                            <Text style={styles.metricLabel}>CURRENT SESSION</Text>
                            <Text style={styles.metricValue}>
                                <Text style={styles.metricValueHighlight}>{currentCount}</Text>
                                {` / ${targetQty} items captured`}
                            </Text>
                        </View>

                        <View style={[styles.metricItem, { alignItems: "flex-end" }]}>
                            <Text style={styles.metricLabel}>EFFICIENCY</Text>
                            <View style={styles.efficiencyIndicator}>
                                <View
                                    style={[
                                        styles.efficiencyBar,
                                        { width: `${progressPercent}%` },
                                    ]}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Recent scans display section */}
                    <Text style={styles.sectionLabel}>RECENT SCANS</Text>
                    <View style={styles.recentScansContainer}>
                        {currentCount === 0 ? (
                            <View style={styles.emptyScans}>
                                <Text style={styles.emptyScansText}>No serials scanned yet in this session</Text>
                            </View>
                        ) : (
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.horizontalScroll}
                                bounces={false}
                                overScrollMode="never"
                            >
                                {scannedSerials.map((serial, index) => (
                                    <View key={`${serial}-${index}`} style={styles.scanCard}>
                                        <Text style={styles.scanCardLabel}>SERIAL</Text>
                                        <Text style={styles.scanCardValue} numberOfLines={1}>
                                            {serial}
                                        </Text>
                                    </View>
                                ))}
                            </ScrollView>
                        )}
                    </View>

                    {/* Finish Scanning Button */}
                    <TouchableOpacity
                        style={styles.finishBtn}
                        activeOpacity={0.85}
                        onPress={handleFinishScanning}
                    >
                        <Text style={styles.finishBtnText}>Finish Scanning</Text>
                        <Feather name="send" size={16} color={COLORS.white} style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: COLORS.white,
        alignItems: "center",
        justifyContent: "center",
    },
    permissionContainer: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    permissionContent: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
    },
    permissionIconWrapper: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.amber50,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 24,
    },
    permissionTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.slate800,
        marginBottom: 12,
        textAlign: "center",
    },
    permissionSubtitle: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: "center",
        lineHeight: 22,
        marginBottom: 32,
    },
    permissionBtn: {
        height: 48,
        width: "100%",
        backgroundColor: COLORS.blueAccent,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 12,
    },
    permissionBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "600",
    },
    permissionCancelBtn: {
        height: 48,
        width: "100%",
        backgroundColor: COLORS.slate100,
        borderRadius: 12,
        alignItems: "center",
        justifyContent: "center",
    },
    permissionCancelBtnText: {
        color: COLORS.slate600,
        fontSize: 16,
        fontWeight: "600",
    },
    codeBlock: {
        backgroundColor: COLORS.slate100,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 32,
        width: "100%",
        alignItems: "center",
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    codeText: {
        fontFamily: Platform.OS === "ios" ? "CourierNewPSMT" : "monospace",
        fontSize: 15,
        color: COLORS.slate900,
        fontWeight: "700",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        height: 56,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerAction: {
        width: 40,
        height: 40,
        alignItems: "center",
        justifyContent: "center",
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.slate800,
    },
    cameraContainer: {
        flex: 1,
        backgroundColor: COLORS.black,
    },
    cameraOverlay: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0, 0, 0, 0.25)",
    },
    overlayText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "600",
        textShadowColor: "rgba(0, 0, 0, 0.75)",
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        position: "absolute",
        top: 40,
    },
    scannerFrame: {
        width: SCREEN_WIDTH * 0.75,
        height: 120,
        borderWidth: 1,
        borderColor: "rgba(11, 87, 208, 0.3)",
        position: "relative",
    },
    corner: {
        position: "absolute",
        width: 20,
        height: 20,
        borderColor: COLORS.blueAccent,
    },
    topLeft: {
        top: -2,
        left: -2,
        borderTopWidth: 4,
        borderLeftWidth: 4,
    },
    topRight: {
        top: -2,
        right: -2,
        borderTopWidth: 4,
        borderRightWidth: 4,
    },
    bottomLeft: {
        bottom: -2,
        left: -2,
        borderBottomWidth: 4,
        borderLeftWidth: 4,
    },
    bottomRight: {
        bottom: -2,
        right: -2,
        borderBottomWidth: 4,
        borderRightWidth: 4,
    },
    bottomSheet: {
        backgroundColor: COLORS.gray200, // Light gray shade for matching the screenshot card
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        padding: 20,
        paddingBottom: Platform.OS === "ios" ? 12 : 24,
    },
    metricsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    metricItem: {
        flex: 1,
    },
    metricLabel: {
        fontSize: 10,
        fontWeight: "700",
        color: COLORS.gray600,
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 14,
        color: COLORS.gray700,
        fontWeight: "500",
    },
    metricValueHighlight: {
        fontSize: 22,
        fontWeight: "800",
        color: COLORS.blueAccent,
    },
    efficiencyIndicator: {
        width: 100,
        height: 8,
        backgroundColor: COLORS.gray300,
        borderRadius: 4,
        overflow: "hidden",
        marginTop: 6,
    },
    efficiencyBar: {
        height: "100%",
        backgroundColor: COLORS.blueAccent,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: "700",
        color: COLORS.gray600,
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    recentScansContainer: {
        height: 68,
        marginBottom: 20,
    },
    emptyScans: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.gray100,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.gray200,
    },
    emptyScansText: {
        fontSize: 12,
        color: COLORS.gray400,
    },
    horizontalScroll: {
        gap: 10,
    },
    scanCard: {
        width: 140,
        backgroundColor: COLORS.white,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        justifyContent: "center",
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    scanCardLabel: {
        fontSize: 8,
        fontWeight: "800",
        color: COLORS.gray500,
        marginBottom: 2,
    },
    scanCardValue: {
        fontSize: 13,
        fontWeight: "700",
        color: COLORS.blueAccent,
    },
    finishBtn: {
        height: 52,
        backgroundColor: COLORS.blueAccent,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: COLORS.blueAccent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    finishBtnText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "700",
    },
    warningOverlay: {
        backgroundColor: "rgba(217, 119, 6, 0.95)", // Curated Amber theme color
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 20,
        flexDirection: "row",
        alignItems: "center",
        position: "absolute",
        top: 90,
        maxWidth: "85%",
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
        gap: 8,
    },
    warningText: {
        color: COLORS.white,
        fontSize: 13,
        fontWeight: "600",
        textAlign: "center",
        flexShrink: 1,
    },
});
