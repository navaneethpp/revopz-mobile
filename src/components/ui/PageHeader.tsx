import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { getSession } from "@/utils/storage";
import type { SessionData } from "@/types/auth";

const getInitials = (name?: string) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export interface PageHeaderProps {
    title: string;
    showBackButton?: boolean;
    showSearch?: boolean;
    showAvatar?: boolean;
    onBackPress?: () => void;
    onSearchPress?: () => void;
    
    // Search props
    isSearching?: boolean;
    searchQuery?: string;
    onSearchQueryChange?: (text: string) => void;
    onCloseSearch?: () => void;
}

export default function PageHeader({
    title,
    showBackButton = true,
    showSearch = true,
    showAvatar = true,
    onBackPress,
    onSearchPress,
    isSearching = false,
    searchQuery = "",
    onSearchQueryChange,
    onCloseSearch,
}: PageHeaderProps) {
    const [session, setSession] = useState<SessionData | null>(null);

    useEffect(() => {
        if (showAvatar && !isSearching) {
            getSession().then(setSession);
        }
    }, [showAvatar, isSearching]);

    const handleBack = () => {
        if (onBackPress) {
            onBackPress();
        } else {
            router.back();
        }
    };

    return (
        <View style={styles.headerContainer}>
            {/* Left Section */}
            <View style={[styles.leftCol, isSearching && styles.leftColSearch]}>
                {!isSearching && showBackButton && (
                    <TouchableOpacity
                        onPress={handleBack}
                        style={styles.backButton}
                        activeOpacity={0.7}
                        accessibilityLabel="Go back"
                    >
                        <Feather name="arrow-left" size={24} color="#111827" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Center Section: Title or Search Input */}
            <View style={styles.titleContainer}>
                {isSearching ? (
                    <TextInput
                        value={searchQuery}
                        onChangeText={onSearchQueryChange}
                        placeholder="Search product, SKU, category..."
                        placeholderTextColor="#94A3B8"
                        style={styles.searchInput}
                        autoFocus={true}
                        returnKeyType="search"
                        accessibilityLabel="Search activity input"
                    />
                ) : (
                    <Text style={styles.titleText} numberOfLines={1}>
                        {title}
                    </Text>
                )}
            </View>

            {/* Right Section */}
            <View style={[styles.rightCol, isSearching && styles.rightColSearch]}>
                {isSearching ? (
                    <TouchableOpacity
                        onPress={onCloseSearch}
                        style={styles.closeButton}
                        activeOpacity={0.7}
                        accessibilityLabel="Close search"
                    >
                        <Feather name="x" size={24} color="#64748B" />
                    </TouchableOpacity>
                ) : (
                    <>
                        {showSearch && (
                            <TouchableOpacity
                                onPress={onSearchPress}
                                style={styles.searchButton}
                                activeOpacity={0.7}
                                accessibilityLabel="Search"
                            >
                                <Feather name="search" size={22} color="#475569" />
                            </TouchableOpacity>
                        )}

                        {showAvatar && (
                            <TouchableOpacity
                                onPress={() => router.push("/profile")}
                                activeOpacity={0.8}
                                style={[
                                    styles.avatar,
                                    !session?.avatarUrl && styles.avatarInitialsContainer,
                                ]}
                            >
                                {session?.avatarUrl ? (
                                    <Image
                                        source={{ uri: session.avatarUrl }}
                                        style={styles.avatarImage}
                                    />
                                ) : (
                                    <Text style={styles.avatarInitialsText}>
                                        {getInitials(session?.name)}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        )}
                    </>
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        height: 56,
        paddingHorizontal: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#E2E8F0",
    },
    leftCol: {
        width: 48,
        justifyContent: "center",
    },
    leftColSearch: {
        width: 8,
    },
    backButton: {
        padding: 4,
    },
    titleContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
    titleText: {
        fontSize: 18,
        fontWeight: "700",
        color: "#111827",
        textAlign: "center",
    },
    rightCol: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        width: 80,
    },
    rightColSearch: {
        width: 36,
        justifyContent: "center",
        alignItems: "flex-end",
    },
    searchButton: {
        padding: 4,
        marginRight: 12,
    },
    closeButton: {
        padding: 4,
    },
    searchInput: {
        width: "100%",
        height: 38,
        backgroundColor: "#F1F5F9",
        borderRadius: 8,
        paddingHorizontal: 12,
        fontSize: 14,
        color: "#1E293B",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#F1F5F9",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    avatarImage: {
        width: "100%",
        height: "100%",
    },
    avatarInitialsContainer: {
        backgroundColor: "#F1F5F9",
    },
    avatarInitialsText: {
        color: "#1E293B",
        fontSize: 13,
        fontWeight: "700",
    },
});
