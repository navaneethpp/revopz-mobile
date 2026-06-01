import { COLORS } from "@/theme/colors";
import React from "react";
import {
    StatusBar,
    View,
    KeyboardAvoidingView,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenContainerProps = {
    children: React.ReactNode;
};

export default function ScreenContainer({
    children,
}: ScreenContainerProps) {
    return (
        <SafeAreaView
            style={{
                flex: 1,
                backgroundColor: COLORS.lightGray,
            }}
        >
            <StatusBar
                barStyle="dark-content"
                backgroundColor={COLORS.lightGray}
            />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View
                    style={{
                        flex: 1,
                        paddingHorizontal: 20,
                    }}
                >
                    {children}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}