import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { TouchableOpacity, View } from "react-native";

export default function BottomNavigation() {
    return (
        <View className="h-20 bg-white border-t border-gray-200 flex-row justify-around items-center">
            <TouchableOpacity onPress={() => router.push("/home")}>
                <Feather name="grid" size={24} color="#1565C0" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => router.push("/profile")}>
                <Feather name="settings" size={24} color="#555" />
            </TouchableOpacity>
        </View>
    );
}