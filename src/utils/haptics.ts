import * as Haptics from "expo-haptics";
import * as SecureStore from "expo-secure-store";
import { Vibration, Platform } from "react-native";

let isHapticEnabledCache: boolean | null = null;

// Pre-load the preference on startup
const initHaptics = async () => {
    try {
        const val = await SecureStore.getItemAsync("haptic_enabled");
        // Default to true if not set
        isHapticEnabledCache = val !== "false";
    } catch {
        isHapticEnabledCache = true;
    }
};

initHaptics();

export const updateHapticsCache = (enabled: boolean) => {
    isHapticEnabledCache = enabled;
};

export const triggerHaptic = async (
    type: "light" | "medium" | "heavy" | "success" | "warning" | "error" | "selection" = "medium",
) => {
    // If cache is not loaded yet, fetch it from storage
    if (isHapticEnabledCache === null) {
        await initHaptics();
    }

    if (!isHapticEnabledCache) return;

    try {
        // Attempt expo-haptics first
        if (Platform.OS === "android") {
            // Android often filters out notificationAsync.
            // Map success/warning/error to direct impactAsync or Vibration API.
            switch (type) {
                case "success":
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    break;
                case "warning":
                    Vibration.vibrate([0, 100, 80, 100]);
                    break;
                case "error":
                    Vibration.vibrate([0, 80, 40, 80, 40, 150]);
                    break;
                case "light":
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    break;
                case "medium":
                case "selection":
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    break;
                case "heavy":
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    break;
                default:
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
        } else {
            // iOS precise haptics
            switch (type) {
                case "light":
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    break;
                case "medium":
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    break;
                case "heavy":
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    break;
                case "success":
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    break;
                case "warning":
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    break;
                case "error":
                    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    break;
                case "selection":
                    await Haptics.selectionAsync();
                    break;
                default:
                    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
        }
    } catch (e) {
        // Fallback to React Native Vibration API if expo-haptics native module is not ready/loaded
        try {
            switch (type) {
                case "light":
                    Vibration.vibrate(40);
                    break;
                case "medium":
                case "selection":
                    Vibration.vibrate(80);
                    break;
                case "heavy":
                    Vibration.vibrate(150);
                    break;
                case "success":
                    Vibration.vibrate([0, 60, 60, 60]); // brief double tap
                    break;
                case "warning":
                    Vibration.vibrate([0, 100, 80, 100]);
                    break;
                case "error":
                    Vibration.vibrate([0, 80, 40, 80, 40, 150]); // triple tap vibration
                    break;
                default:
                    Vibration.vibrate(80);
            }
        } catch { }
    }
};
