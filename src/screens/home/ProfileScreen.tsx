import React, { useEffect, useState } from "react";
import { Alert, Text, View, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import ScreenContainer from "@/components/ui/ScreenContainer";
import BottomNavigation from "@/components/ui/BottomNavigation";
import { logoutUser } from "@/services/authService";
import { getSession } from "@/utils/storage";
import type { SessionData } from "@/types/auth";

export default function ProfileScreen() {
    const [session, setSession] = useState<SessionData | null>(null);

    useEffect(() => {
        getSession().then(setSession);
    }, []);

    const handleLogout = () => {
        Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Log Out",
                    style: "destructive",
                    onPress: () => logoutUser(),
                },
            ],
        );
    };

    return (
        <ScreenContainer>
            <View className="flex-1 px-4 justify-between">
                <View className="items-center mt-10">
                    <View className="w-24 h-24 bg-blue-100 rounded-full items-center justify-center mb-4">
                        <Feather name="user" size={48} color="#1565C0" />
                    </View>
                    
                    <Text className="text-2xl font-bold text-black">
                        {session?.name ?? "—"}
                    </Text>

                    <Text className="text-gray-500 mt-1">
                        {session?.email ?? "—"}
                    </Text>

                    <View className="w-full mt-10 border-t border-gray-200 pt-6">
                        <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-gray-100">
                            <View className="flex-row items-center">
                                <Feather name="settings" size={20} color="#555" className="mr-3" />
                                <Text className="text-base text-gray-800 ml-3">Settings</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color="#ccc" />
                        </TouchableOpacity>

                        <TouchableOpacity className="flex-row items-center justify-between py-4 border-b border-gray-100">
                            <View className="flex-row items-center">
                                <Feather name="shield" size={20} color="#555" className="mr-3" />
                                <Text className="text-base text-gray-800 ml-3">Security</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color="#ccc" />
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-row items-center justify-between py-4"
                            onPress={handleLogout}
                        >
                            <View className="flex-row items-center">
                                <Feather name="log-out" size={20} color="#d32f2f" className="mr-3" />
                                <Text className="text-base text-red-600 ml-3">Log Out</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color="#ccc" />
                        </TouchableOpacity>
                    </View>
                </View>

                <BottomNavigation />
            </View>
        </ScreenContainer>
    );
}
