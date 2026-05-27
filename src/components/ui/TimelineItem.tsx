import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";

export interface TimelineItemProps {
    id: string;
    productName: string;
    productNumber: string;
    category: string;
    status: string;
    createdAt: Date;
    createdByName?: string;
    createdByRole?: string;
    manufacturedDate?: string;
    warrantyMonths?: number;
    warrantyStatus?: string;
    isFirst?: boolean;
    isLast?: boolean;
    onPress?: () => void;
}

export default function TimelineItem({
    id,
    productName,
    productNumber,
    category,
    status,
    createdAt,
    createdByName,
    createdByRole,
    manufacturedDate,
    warrantyMonths = 0,
    warrantyStatus = "",
    isFirst = false,
    isLast = false,
    onPress,
}: TimelineItemProps) {
    // Normalize status to one of the 4 activity types
    const norm = (status || "").toLowerCase();
    let statusType: "manufacturing" | "testing" | "quality" | "transfer" = "manufacturing";
    if (norm === "ready" || norm.includes("complete") || norm.includes("manufactur")) {
        statusType = "manufacturing";
    } else if (norm.includes("fail") || norm.includes("test")) {
        statusType = "testing";
    } else if (norm.includes("pass") || norm.includes("quality") || norm.includes("qa")) {
        statusType = "quality";
    } else if (norm.includes("transfer") || norm.includes("warehouse") || norm.includes("logistics")) {
        statusType = "transfer";
    }

    // Format the time as HH:MM
    const timeStr = (() => {
        const hours = String(createdAt.getHours()).padStart(2, "0");
        const minutes = String(createdAt.getMinutes()).padStart(2, "0");
        return `${hours}:${minutes}`;
    })();

    // Generate semi-deterministic mock values based on productNumber for UI matching
    const numSeed = parseInt(productNumber.replace(/\D/g, "")) || 42;
    const batchNum = `Batch #${(numSeed % 900) + 100}`;
    const unitNum = `Unit #${String(numSeed % 1000).padStart(3, "0")}`;
    const unitCount = `${((numSeed % 20) + 1) * 10} Units`;

    // Configure display values per status type
    let config: {
        label: string;
        icon: "battery" | "zap" | "sliders" | "trending-up";
        iconColor: string;
        circleBg: string;
        badgeColor: string;
        metaLeftText: string;
        metaLeftIsLink: boolean;
        metaRightText: string;
        metaRightIsLink: boolean;
        highlightLeft: string;
        highlightLeftColor: string;
        highlightRight: string;
        highlightBg: string;
        highlightBorderColor: string;
        isTransfer: boolean;
        transferFrom: string;
        transferTo: string;
    } = {
        label: "MANUFACTURING COMPLETED",
        icon: "battery",
        iconColor: "#10B981",
        circleBg: "#ECFDF5",
        badgeColor: "#059669",
        metaLeftText: `SKU: ${productNumber}`,
        metaLeftIsLink: true,
        metaRightText: manufacturedDate ? `Mfg: ${manufacturedDate}` : `Line A-${(numSeed % 4) + 1}`,
        metaRightIsLink: false,
        highlightLeft: "",
        highlightLeftColor: "#059669",
        highlightRight: `Warranty: ${warrantyMonths} Mos (${warrantyStatus === "not_registered" ? "Not Registered" : "Registered"})`,
        highlightBg: "#ECFDF5",
        highlightBorderColor: "#A7F3D0",
        isTransfer: false,
        transferFrom: "",
        transferTo: "",
    };

    if (statusType === "testing") {
        config = {
            label: "TESTING FAILED",
            icon: "zap",
            iconColor: "#EF4444",
            circleBg: "#FEF2F2",
            badgeColor: "#DC2626",
            metaLeftText: "Efficiency Test",
            metaLeftIsLink: false,
            metaRightText: `SKU: ${productNumber}`,
            metaRightIsLink: true,
            highlightLeft: "",
            highlightLeftColor: "#DC2626",
            highlightRight: `Voltage Fluctuations Detected (Mfg: ${manufacturedDate || "N/A"})`,
            highlightBg: "#FEF2F2",
            highlightBorderColor: "#FCA5A5",
            isTransfer: false,
            transferFrom: "",
            transferTo: "",
        };
    } else if (statusType === "quality") {
        config = {
            label: "QUALITY CHECK PASSED",
            icon: "sliders",
            iconColor: "#D97706",
            circleBg: "#FFFBEB",
            badgeColor: "#D97706",
            metaLeftText: "Final QA Stage",
            metaLeftIsLink: false,
            metaRightText: `SKU: ${productNumber}`,
            metaRightIsLink: true,
            highlightLeft: "",
            highlightLeftColor: "#1E293B",
            highlightRight: `Warranty: ${warrantyStatus === "not_registered" ? "Not Registered" : "Registered"} (Mfg: ${manufacturedDate || "N/A"})`,
            highlightBg: "#F1F5F9",
            highlightBorderColor: "#E2E8F0",
            isTransfer: false,
            transferFrom: "",
            transferTo: "",
        };
    } else if (statusType === "transfer") {
        config = {
            label: "WAREHOUSE TRANSFER",
            icon: "trending-up",
            iconColor: "#2563EB",
            circleBg: "#EFF6FF",
            badgeColor: "#2563EB",
            metaLeftText: "",
            metaLeftIsLink: false,
            metaRightText: "",
            metaRightIsLink: false,
            highlightLeft: "",
            highlightLeftColor: "#2563EB",
            highlightRight: `Logistics Sync • Mfg: ${manufacturedDate || "N/A"}`,
            highlightBg: "#EFF6FF",
            highlightBorderColor: "#BFDBFE",
            isTransfer: true,
            transferFrom: "Production Floor",
            transferTo: `Storage Hub ${String.fromCharCode(66 + (numSeed % 3))}`, // storage hub B, C, etc.
        };
    }

    return (
        <View style={styles.row}>
            {/* Timeline Column */}
            <View style={styles.timelineCol}>
                {/* Timeline vertical line (before circle) */}
                {!isFirst && (
                    <View
                        style={[
                            styles.line,
                            { top: 0, height: 30 }
                        ]}
                    />
                )}
                {/* Timeline vertical line (after circle) */}
                {!isLast && (
                    <View
                        style={[
                            styles.line,
                            { top: 30, bottom: 0 }
                        ]}
                    />
                )}
                
                {/* Circle Container with Status Icon */}
                <View style={[styles.circle, { backgroundColor: config.circleBg }]}>
                    <Feather name={config.icon} size={16} color={config.iconColor} />
                </View>
            </View>

            {/* Main Card Content */}
            <TouchableOpacity
                style={styles.card}
                onPress={onPress}
                activeOpacity={0.85}
                disabled={!onPress}
            >
                {/* Status Label and Time Row */}
                <View style={styles.cardHeader}>
                    <Text style={[styles.statusLabel, { color: config.badgeColor }]}>
                        {config.label}
                    </Text>
                    <Text style={styles.timeText}>{timeStr}</Text>
                </View>

                {/* Product Name Title */}
                <Text style={styles.productName}>{productName}</Text>

                {/* Metadata section (Standard side-by-side or Warehouse Transfer list) */}
                {config.isTransfer ? (
                    <View style={styles.transferFlow}>
                        <View style={styles.transferRow}>
                            <View style={[styles.transferDot, { backgroundColor: "#94A3B8" }]} />
                            <Text style={styles.transferLabel}>
                                From: <Text style={styles.transferValue}>{config.transferFrom}</Text>
                            </Text>
                        </View>
                        <View style={styles.transferRow}>
                            <View style={[styles.transferDot, { backgroundColor: "#2563EB" }]} />
                            <Text style={styles.transferLabel}>
                                To: <Text style={styles.transferValue}>{config.transferTo}</Text>
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.metaRow}>
                        {config.metaLeftText ? (
                            <View style={styles.metaCol}>
                                <Feather name={config.icon} size={13} color="#64748B" style={styles.metaIcon} />
                                <Text
                                    style={[
                                        styles.metaText,
                                        config.metaLeftIsLink && styles.metaLinkText,
                                    ]}
                                >
                                    {config.metaLeftText}
                                </Text>
                            </View>
                        ) : null}
                        {config.metaRightText ? (
                            <View style={styles.metaCol}>
                                <Feather name={config.icon} size={13} color="#64748B" style={styles.metaIcon} />
                                <Text
                                    style={[
                                        styles.metaText,
                                        config.metaRightIsLink && styles.metaLinkText,
                                    ]}
                                >
                                    {config.metaRightText}
                                </Text>
                            </View>
                        ) : null}
                    </View>
                )}

                {/* Highlight Info Box */}
                <View
                    style={[
                        styles.highlightBox,
                        {
                            backgroundColor: config.highlightBg,
                            borderColor: config.highlightBorderColor,
                        },
                    ]}
                >
                    {config.highlightLeft ? (
                        <>
                            <Text style={[styles.highlightLeft, { color: config.highlightLeftColor }]}>
                                {config.highlightLeft}
                            </Text>
                            <View style={[styles.highlightDivider, { backgroundColor: config.highlightBorderColor }]} />
                        </>
                    ) : null}
                    <Text style={styles.highlightRight} numberOfLines={1}>
                        {config.highlightRight}
                    </Text>
                </View>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    timelineCol: {
        width: 50,
        alignItems: "center",
        alignSelf: "stretch",
        position: "relative",
    },
    line: {
        position: "absolute",
        width: 2,
        backgroundColor: "#E2E8F0",
        left: 24, // center alignment for 50px col width ((50 - 2) / 2)
    },
    circle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        marginTop: 12,
        zIndex: 2,
        borderWidth: 1,
        borderColor: "rgba(0,0,0,0.03)",
    },
    card: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        padding: 16,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
        elevation: 1,
    },
    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },
    statusLabel: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    timeText: {
        fontSize: 13,
        color: "#94A3B8",
        fontWeight: "500",
    },
    productName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1E293B",
        marginBottom: 10,
        lineHeight: 22,
    },
    metaRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    metaCol: {
        flexDirection: "row",
        alignItems: "center",
        marginRight: 16,
    },
    metaIcon: {
        marginRight: 6,
    },
    metaText: {
        fontSize: 13,
        color: "#475569",
        fontWeight: "500",
    },
    metaLinkText: {
        color: "#1565C0",
        fontWeight: "600",
    },
    transferFlow: {
        marginBottom: 12,
    },
    transferRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    transferDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
    },
    transferLabel: {
        fontSize: 13,
        color: "#64748B",
        fontWeight: "500",
    },
    transferValue: {
        color: "#1E293B",
        fontWeight: "600",
    },
    highlightBox: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    highlightLeft: {
        fontSize: 13,
        fontWeight: "700",
        marginRight: 10,
    },
    highlightDivider: {
        width: 1.5,
        height: 14,
        marginRight: 10,
    },
    highlightRight: {
        flex: 1,
        fontSize: 13,
        color: "#64748B",
        fontWeight: "500",
    },
});
