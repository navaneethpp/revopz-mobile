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
                backgroundColor: "#F4F4F4",
            }}
        >
            <StatusBar
                barStyle="dark-content"
                backgroundColor="#F4F4F4"
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