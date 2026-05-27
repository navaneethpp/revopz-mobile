import { useEffect, useRef, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function BottomNavigation() {
    const path = usePathname();
    const isHome = path === "/home" || path === "/";

    // Track tab coordinates dynamically to position the sliding pill
    const [layouts, setLayouts] = useState<{
        home?: { x: number; y: number; width: number; height: number };
        profile?: { x: number; y: number; width: number; height: number };
    }>({});

    const pillX = useRef(new Animated.Value(0)).current;
    const pillWidth = useRef(new Animated.Value(0)).current;
    const pillOpacity = useRef(new Animated.Value(0)).current;

    const activeLayout = isHome ? layouts.home : layouts.profile;

    useEffect(() => {
        if (activeLayout) {
            Animated.parallel([
                Animated.timing(pillX, {
                    toValue: activeLayout.x,
                    duration: 220,
                    useNativeDriver: false,
                }),
                Animated.timing(pillWidth, {
                    toValue: activeLayout.width,
                    duration: 220,
                    useNativeDriver: false,
                }),
                Animated.timing(pillOpacity, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: false,
                }),
            ]).start();
        }
    }, [isHome, activeLayout]);

    return (
        <View style={styles.container}>
            {/* Sliding background pill */}
            {activeLayout && (
                <Animated.View
                    style={[
                        styles.pill,
                        {
                            left: pillX,
                            width: pillWidth,
                            opacity: pillOpacity,
                            height: activeLayout.height,
                            top: activeLayout.y,
                        },
                    ]}
                />
            )}

            {/* Dashboard tab */}
            <TouchableOpacity
                onPress={() => router.push("/home")}
                activeOpacity={0.8}
                onLayout={(e) => {
                    const l = e.nativeEvent.layout;
                    setLayouts((prev) => ({ ...prev, home: l }));
                }}
                style={[
                    styles.tab,
                    isHome ? styles.activeTabStyle : styles.inactiveTabStyle,
                ]}
            >
                <Feather
                    name="grid"
                    size={20}
                    color={isHome ? "#fff" : "#6B7280"}
                />
                <Text
                    style={[
                        styles.tabLabel,
                        { color: isHome ? "#fff" : "#6B7280" },
                    ]}
                >
                    Dashboard
                </Text>
            </TouchableOpacity>

            {/* Settings tab */}
            <TouchableOpacity
                onPress={() => router.push("/profile")}
                activeOpacity={0.8}
                onLayout={(e) => {
                    const l = e.nativeEvent.layout;
                    setLayouts((prev) => ({ ...prev, profile: l }));
                }}
                style={[
                    styles.tab,
                    !isHome ? styles.activeTabStyle : styles.inactiveTabStyle,
                ]}
            >
                <Feather
                    name="settings"
                    size={20}
                    color={!isHome ? "#fff" : "#6B7280"}
                />
                <Text
                    style={[
                        styles.tabLabel,
                        { color: !isHome ? "#fff" : "#6B7280" },
                    ]}
                >
                    Settings
                </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: 68,
        backgroundColor: "#ffffff",
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        paddingHorizontal: 16,
        position: "relative",
    },
    tab: {
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 8,
        paddingHorizontal: 22,
        borderRadius: 16,
        backgroundColor: "transparent",
    },
    activeTabStyle: {
        backgroundColor: "transparent",
    },
    inactiveTabStyle: {
        backgroundColor: "transparent",
    },
    pill: {
        position: "absolute",
        backgroundColor: "#D97706", // Amber
        borderRadius: 16,
    },
    tabLabel: {
        fontWeight: "600",
        fontSize: 12,
        marginTop: 4,
    },
});