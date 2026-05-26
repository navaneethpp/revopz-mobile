import React from "react";
import { ScrollView, View } from "react-native";
import ScreenContainer from "@/components/ui/ScreenContainer";
import WelcomeHeader from "@/components/ui/WelcomeHeader";
import RecentActivityCard from "@/components/ui/RecentActivityCard";
import ActionCard from "@/components/ui/ActionCard";
import BottomNavigation from "@/components/ui/BottomNavigation";

export default function HomeScreen() {
    return (
        <ScreenContainer>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                className="flex-1"
            >
                <WelcomeHeader name="Admin" />

                <View className="px-4 mt-6">
                    <ActionCard
                        icon="plus-circle"
                        title="Add New Unit"
                        subtitle="Scan barcode or enter serial number manually"
                        onPress={() => console.log("Add Unit pressed")}
                    />

                    <ActionCard
                        icon="layers"
                        title="Bulk Add Units"
                        subtitle="Upload CSV or scan multiple serials"
                        onPress={() => console.log("Bulk Add pressed")}
                    />
                </View>

                <RecentActivityCard />
            </ScrollView>

            <BottomNavigation />
        </ScreenContainer>
    );
}
