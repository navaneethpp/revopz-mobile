import { Text, View } from "react-native";

type Props = {
    name: string;
};

export default function WelcomeHeader({ name }: Props) {
    return (
        <View className="px-5 mt-4">
            <Text className="text-3xl font-bold text-black">
                Welcome back {name}
            </Text>
        </View>
    );
}