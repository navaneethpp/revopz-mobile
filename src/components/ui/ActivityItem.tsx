import { Text, View } from "react-native";

type Props = {
    title: string;
    subtitle: string;
};

export default function ActivityItem({ title, subtitle }: Props) {
    return (
        <View className="flex-row mb-4">
            <View className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3">

                <View className="flex-1">
                    <Text className="text-base font-semibold text-black">
                        {title}
                    </Text>

                    <Text className="text-sm text-gray-500 mt-1">
                        {subtitle}
                    </Text>
                </View>

            </View>
        </View>
    );
}