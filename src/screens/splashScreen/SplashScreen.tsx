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
import { checkInternetAndSyncFirestore } from "@/utils/checkInternetAndSyncFirestore";
import { isPinSet } from "@/utils/pinStorage";

import { COLORS } from "@/theme/colors";

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

            // 3. Verify internet connectivity and enable Firestore network.
            //    This blocks until the device is online (showing a Retry/Exit
            //    alert when offline), so navigation only happens when Firestore
            //    is ready to serve live queries.
            await checkInternetAndSyncFirestore();

            if (cancelled) return;

            // 4. Navigate — replace so the splash never appears in back-stack
            if (loggedIn) {
                const hasPin = await isPinSet();
                if (hasPin) {
                    router.replace("/home");
                } else {
                    router.replace("/security/create-pin");
                }
            } else {
                router.replace("/auth/login");
            }
        };

        // NAV-02: catch any unexpected error (e.g. SecureStore unavailable on
        // encrypted/locked device) and default to the login screen so the user
        // is never stranded on a blank splash.
        run().catch(() => {
            if (!cancelled) router.replace("/auth/login");
        });

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
        backgroundColor: COLORS.white,
        alignItems: "center",
        justifyContent: "center",
    },
    logo: {
        width: LOGO_SIZE,
        height: LOGO_SIZE,
    },
});