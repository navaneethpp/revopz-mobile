import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { router, usePathname } from "expo-router";
import { getSession } from "@/utils/storage";
import type { SessionData } from "@/types/auth";

const getInitials = (name?: string) => {
    if (!name) return "";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export default function HeaderBar() {
    const [session, setSession] = useState<SessionData | null>(null);
    const pathname = usePathname();

    useEffect(() => {
        getSession().then(setSession);
    }, []);

    const handlePress = () => {
        if (pathname !== "/profile") {
            router.push("/profile");
        }
    };

    const isOnProfile = pathname === "/profile";

    return (
        <View style={styles.navbar}>
            <Text style={styles.brand}>Revopz</Text>

            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={isOnProfile ? 1 : 0.8}
                disabled={isOnProfile}
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
        </View>
    );
}

const styles = StyleSheet.create({
    navbar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: "#F8FAFC",
    },
    brand: {
        fontSize: 22,
        fontWeight: "800",
        color: "#D97706",
        letterSpacing: -0.5,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: "#DBEAFE",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
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
        fontSize: 15,
        fontWeight: "700",
    },
});
