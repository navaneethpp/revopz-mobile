import React from "react"
import { KeyboardAvoidingView, Platform, SafeAreaView, StatusBar, View } from "react-native";

type ScreenContainerProps = {
    children: React.ReactNode;
};

export default function ScreenContainer({
    children,
}: ScreenContainerProps) {
    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: "#F4F4F4", }}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F4F4" />

            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} >
                <View style={{ flex: 1, paddingHorizontal: 20 }}>
                    {children}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView >
    )
}