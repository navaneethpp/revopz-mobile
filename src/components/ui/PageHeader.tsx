import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
}

export default function PageHeader({
    title,
    showBackButton = true,
    showSearch = true,
    showAvatar = true,
    onBackPress,
    onSearchPress,
}: PageHeaderProps) {
    const [session, setSession] = useState<SessionData | null>(null);

    useEffect(() => {
        if (showAvatar) {
            getSession().then(setSession);
        }
    }, [showAvatar]);

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
            <View style={styles.leftCol}>
                {showBackButton && (
                    <TouchableOpacity
                        onPress={handleBack}
                        style={styles.backButton}
                        activeOpacity={0.7}
                        accessibilityLabel="Go back"
                    >
                        <Feather name="arrow-left" size={24} color="#1565C0" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Center Title */}
            <View style={styles.titleContainer}>
                <Text style={styles.titleText} numberOfLines={1}>
                    {title}
                </Text>
            </View>

            {/* Right Section */}
            <View style={styles.rightCol}>
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
        color: "#1565C0",
        textAlign: "center",
    },
    rightCol: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "flex-end",
        width: 80,
    },
    searchButton: {
        padding: 4,
        marginRight: 12,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#DBEAFE",
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
        backgroundColor: "#DBEAFE",
    },
    avatarInitialsText: {
        color: "#1E40AF",
        fontSize: 13,
        fontWeight: "700",
    },
});
