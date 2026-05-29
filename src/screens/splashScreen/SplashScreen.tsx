/**
 * src/screens/splashScreen/SplashScreen.tsx
 *
 * Shows the REVOPZ logo with a fade-out animation, then checks SecureStore
 * for an existing session. Logged-in users go straight to /home; everyone
 * else goes to /auth/login.
 */
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, Image, StyleSheet, View } from "react-native";

import { isLoggedIn } from "@/utils/storage";

const { width } = Dimensions.get("window");
const LOGO_SIZE = width * 0.32;

// Time (ms) the logo is fully visible before it starts fading
const HOLD_DURATION = 800;
// Duration of the fade-out animation
const FADE_DURATION = 500;

export default function SplashScreen() {
    const opacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            // 1. Wait for the logo hold period
            await new Promise<void>((resolve) =>
                setTimeout(resolve, HOLD_DURATION),
            );

            if (cancelled) return;

            console.log("[SplashScreen] Checking isLoggedIn from SecureStore...");
            // 2. Check session while the logo is still visible (parallel work)
            const [loggedIn] = await Promise.all([
                isLoggedIn(),
                // Kick off the fade at the same time
                new Promise<void>((resolve) =>
                    Animated.timing(opacity, {
                        toValue: 0,
                        duration: FADE_DURATION,
                        useNativeDriver: true,
                    }).start(() => resolve()),
                ),
            ]);

            if (cancelled) return;

            console.log(
                "[SplashScreen] isLoggedIn result:",
                loggedIn,
                "Redirecting to:",
                loggedIn ? "/home" : "/auth/login"
            );

            // 3. Navigate — replace so the splash never appears in back-stack
            if (loggedIn) {
                router.replace("/home");
            } else {
                router.replace("/auth/login");
            }
        };

        run();

        return () => {
            cancelled = true;
        };
    }, [opacity]);

    return (
        <View style={styles.container}>
            <Animated.View style={{ opacity }}>
                <Image
                    source={require("../../assets/images/revopz-logo.png")}
                    resizeMode="contain"
                    style={styles.logo}
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#ffffff",
        alignItems: "center",
        justifyContent: "center",
    },
    logo: {
        width: LOGO_SIZE,
        height: LOGO_SIZE,
    },
});