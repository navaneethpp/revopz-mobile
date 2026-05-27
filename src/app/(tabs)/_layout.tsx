import { Tabs } from "expo-router";
import BottomNavigation from "@/components/ui/BottomNavigation";

export default function TabsLayout() {
    return (
        <Tabs
            screenOptions={{
                headerShown: false,
            }}
            tabBar={(props) => <BottomNavigation {...props} />}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: "Dashboard",
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Settings",
                }}
            />
        </Tabs>
    );
}
