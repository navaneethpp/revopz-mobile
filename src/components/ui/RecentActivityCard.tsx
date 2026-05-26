import { Text, TouchableOpacity, View } from "react-native";
import ActivityItem from "./ActivityItem";

export default function RecentActivityCard() {
    return (
        <View className="mx-4 mt-6 bg-white rounded-2xl p-5 border border-gray-200">
            <View className="flex-row justify-between items-center mb-4">
                <Text className="text-2xl font-semibold text-black">
                    Recent Activity
                </Text>

                <TouchableOpacity>
                    <Text className="text-blue-600 font-medium">
                        View All
                    </Text>
                </TouchableOpacity>
            </View>

            <ActivityItem
                title="Units Added: Titanium Drill Bits"
                subtitle="12 units added to Warehouse A • 5 mins ago"
            />

            <ActivityItem
                title="Units Added: Industrial Grade Servo"
                subtitle="24 units added to Warehouse B • 15 mins ago"
            />

            <ActivityItem
                title="Units Added: Pneumatic Actuator"
                subtitle="8 units added to Warehouse A • 45 mins ago"
            />
        </View>
    );
}