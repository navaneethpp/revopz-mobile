import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Dimensions, Image, View } from "react-native";

const { width } = Dimensions.get("window");

export default function SplashScreen() {
    const fadeAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        const timer = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }).start(() => {
                router.replace('/auth/login');
            });
        }, 600);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View className="flex-1 items-center justify-center bg-white" style={{ flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" }}>
            <Animated.View style={{ opacity: fadeAnim }}>
                <Image
                    source={require("../../assets/images/revopz-logo.png")}
                    resizeMode="contain"
                    style={{
                        width: width * 0.30,
                        height: width * 0.30,
                    }}
                />
            </Animated.View>
        </View>
    );
}