import { Feather } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

type Props = {
    icon: keyof typeof Feather.glyphMap;
    title: string;
    subtitle: string;
    onPress: () => void;
};

export default function ActionCard({
    icon,
    title,
    subtitle,
    onPress,
}: Props) {
    return (
        <TouchableOpacity
            onPress={onPress}
            className="bg-white rounded-2xl border border-gray-200 p-6 mb-4 items-center"
        >
            <Feather
                name={icon}
                size={34}
                color="#1565C0"
            />

            <Text className="text-xl font-semibold mt-4 text-black">
                {title}
            </Text>

            <Text className="text-gray-500 text-center mt-2 text-base">
                {subtitle}
            </Text>
        </TouchableOpacity>
    );
}