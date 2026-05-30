import { useEffect, useRef, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { Animated, StyleSheet, Text, TouchableOpacity, View } from "react-native";
export default function BottomNavigation({ state, navigation }: { state: any; navigation: any }) {
    // Layout coordinates for the sliding pill
    const [layouts, setLayouts] = useState<{
        home?: { x: number; y: number; width: number; height: number };
        profile?: { x: number; y: number; width: number; height: number };
    }>({});

    const activeRouteName = state?.routes?.[state?.index]?.name || "home";
    const isHome = activeRouteName === "home";

    // Animated values for sliding pill
    const pillX = useRef(new Animated.Value(0)).current;
    const pillWidth = useRef(new Animated.Value(0)).current;
    const pillOpacity = useRef(new Animated.Value(0)).current;

    // Animated values for tab icons scaling (micro-animations)
    const homeScale = useRef(new Animated.Value(isHome ? 1.1 : 1)).current;
    const profileScale = useRef(new Animated.Value(!isHome ? 1.1 : 1)).current;

    const activeLayout = isHome ? layouts.home : layouts.profile;

    useEffect(() => {
        if (activeLayout) {
            Animated.parallel([
                // Smooth timing animation for sliding pill — no spring overshoot
                Animated.timing(pillX, {
                    toValue: activeLayout.x,
                    duration: 200,
                    useNativeDriver: false,
                }),
                Animated.timing(pillWidth, {
                    toValue: activeLayout.width,
                    duration: 200,
                    useNativeDriver: false,
                }),
                Animated.timing(pillOpacity, {
                    toValue: 1,
                    duration: 150,
                    useNativeDriver: false,
                }),
                // Subtle scale feedback for selected icon — no bounce
                Animated.timing(homeScale, {
                    toValue: isHome ? 1.1 : 1.0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(profileScale, {
                    toValue: !isHome ? 1.1 : 1.0,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [isHome, activeLayout]);

    const handlePress = (routeName: string) => {
        const event = navigation.emit({
            type: "tabPress",
            target: routeName,
            canPreventDefault: true,
        });

        if (!event.defaultPrevented) {
            navigation.navigate(routeName);
        }
    };

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
                onPress={() => handlePress("home")}
                activeOpacity={1}
                onLayout={(e) => {
                    const l = e.nativeEvent.layout;
                    setLayouts((prev) => ({ ...prev, home: l }));
                }}
                style={[
                    styles.tab,
                    isHome ? styles.activeTabStyle : styles.inactiveTabStyle,
                ]}
            >
                <Animated.View style={{ transform: [{ scale: homeScale }] }}>
                    <Feather
                        name="grid"
                        size={20}
                        color={isHome ? "#fff" : "#6B7280"}
                    />
                </Animated.View>
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
                onPress={() => handlePress("profile")}
                activeOpacity={1}
                onLayout={(e) => {
                    const l = e.nativeEvent.layout;
                    setLayouts((prev) => ({ ...prev, profile: l }));
                }}
                style={[
                    styles.tab,
                    !isHome ? styles.activeTabStyle : styles.inactiveTabStyle,
                ]}
            >
                <Animated.View style={{ transform: [{ scale: profileScale }] }}>
                    <Feather
                        name="settings"
                        size={20}
                        color={!isHome ? "#fff" : "#6B7280"}
                    />
                </Animated.View>
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
        position: "absolute",
        bottom: 24,
        left: 20,
        right: 20,
        height: 64,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderRadius: 24,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-around",
        paddingHorizontal: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
        borderWidth: 1,
        borderColor: "rgba(229, 231, 235, 0.5)",
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