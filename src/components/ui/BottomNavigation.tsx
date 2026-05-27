import { Feather } from "@expo/vector-icons";
import { router, usePathname } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function BottomNavigation() {
    const path = usePathname();
    const isHome = path === "/home" || path === "/";

    return (
        <View style={styles.container}>
            {/* Dashboard tab — active blue pill */}
            <TouchableOpacity
                onPress={() => router.push("/home")}
                activeOpacity={0.8}
                style={[
                    styles.tab,
                    isHome ? styles.activeTab : styles.inactiveTab,
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
                        { color: isHome ? "#fff" : "#6B7280", marginLeft: 8 },
                    ]}
                >
                    Dashboard
                </Text>
            </TouchableOpacity>

            {/* Settings tab */}
            <TouchableOpacity
                onPress={() => router.push("/profile")}
                activeOpacity={0.8}
                style={styles.settingsTab}
            >
                <Feather
                    name="settings"
                    size={20}
                    color={!isHome ? "#1565C0" : "#6B7280"}
                />
                <Text
                    style={[
                        styles.settingsLabel,
                        { color: !isHome ? "#1565C0" : "#6B7280", marginTop: 4 },
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
    },
    tab: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        borderRadius: 100,
    },
    activeTab: {
        backgroundColor: "#1565C0",
        paddingHorizontal: 22,
    },
    inactiveTab: {
        paddingHorizontal: 8,
    },
    tabLabel: {
        fontWeight: "600",
        fontSize: 14,
    },
    settingsTab: {
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 6,
    },
    settingsLabel: {
        fontSize: 12,
        fontWeight: "500",
    },
});