import { COLORS } from "@/theme/colors";
import React from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import DetailRow from "@/components/ui/DetailRow";
import { getStatusColor } from "@/utils/statusColor";
import type { ActivityItemData } from "@/services/activityService";

export interface ActivityDetailModalProps {
    /** The activity item to display, or null when the modal is hidden. */
    item: ActivityItemData | null;
    onClose: () => void;
}

/**
 * Full-screen overlay modal that shows detailed information about a single
 * manufactured unit activity entry.
 *
 * Uses {@link DetailRow} for each field and {@link getStatusColor} for the
 * status badge — both of which are independently reusable.
 */
export default function ActivityDetailModal({ item, onClose }: ActivityDetailModalProps) {
    const statusColor = item ? getStatusColor(item.status) : { bg: COLORS.slate100, text: "#64748B" };

    return (
        <Modal
            visible={item !== null}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>Activity Details</Text>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.closeButton}
                            activeOpacity={0.7}
                            accessibilityLabel="Close details"
                        >
                            <Feather name="x" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>

                    {item && (
                        <ScrollView
                            showsVerticalScrollIndicator={false}
                            style={styles.body}
                            bounces={false}
                            overScrollMode="never"
                        >
                            {/* Product Name */}
                            <Text style={styles.productName}>{item.productName}</Text>

                            {/* Status Badge */}
                            <View style={styles.statusRow}>
                                <View
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: statusColor.bg },
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.statusText,
                                            { color: statusColor.text },
                                        ]}
                                    >
                                        {item.status.toUpperCase()}
                                    </Text>
                                </View>
                            </View>

                            {/* Info Grid */}
                            <View style={styles.infoGrid}>
                                <DetailRow
                                    label="Product Number (SKU)"
                                    value={item.productNumber}
                                    icon="package"
                                />
                                <DetailRow
                                    label="Category"
                                    value={item.category}
                                    icon="tag"
                                />
                                <DetailRow
                                    label="Manufactured Date"
                                    value={item.manufacturedDate || "N/A"}
                                    icon="calendar"
                                />
                                <DetailRow
                                    label="Warranty Duration"
                                    value={`${item.warrantyMonths} Months`}
                                    icon="shield"
                                />
                                <DetailRow
                                    label="Warranty Registration"
                                    value={
                                        item.warrantyStatus === "not_registered"
                                            ? "Not Registered"
                                            : "Registered"
                                    }
                                    icon="file-text"
                                />
                                <DetailRow
                                    label="Logged By"
                                    value={`${item.createdByName} (${item.createdByRole || "Operator"})`}
                                    icon="user"
                                />
                                <DetailRow
                                    label="Logged At"
                                    value={item.createdAt.toLocaleString()}
                                    icon="clock"
                                />
                            </View>
                        </ScrollView>
                    )}

                    {/* Footer */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={styles.confirmBtn}
                            onPress={onClose}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.confirmText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    content: {
        backgroundColor: COLORS.white,
        borderRadius: 24,
        width: "100%",
        maxHeight: "85%",
        padding: 24,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.slate100,
        marginBottom: 16,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.slate800,
    },
    closeButton: {
        padding: 4,
    },
    body: {
        marginBottom: 20,
    },
    productName: {
        fontSize: 20,
        fontWeight: "800",
        color: COLORS.primary,
        lineHeight: 28,
        marginBottom: 12,
    },
    statusRow: {
        flexDirection: "row",
        marginBottom: 20,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.5,
    },
    infoGrid: {
        backgroundColor: COLORS.background,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    footer: {
        borderTopWidth: 1,
        borderTopColor: COLORS.slate100,
        paddingTop: 16,
    },
    confirmBtn: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: "center",
        justifyContent: "center",
    },
    confirmText: {
        color: COLORS.white,
        fontSize: 16,
        fontWeight: "700",
    },
});
