import * as SecureStore from "expo-secure-store";
import { Vibration } from "react-native";

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

    console.log(`[Haptics] triggerHaptic called with type: "${type}", enabled: ${isHapticEnabledCache}`);

    if (!isHapticEnabledCache) return;

    try {
        switch (type) {
            case "light":
            case "selection":
                Vibration.vibrate(40); // Short, subtle tap
                break;
            case "medium":
                Vibration.vibrate(80); // Standard feedback buzz
                break;
            case "heavy":
                Vibration.vibrate(150); // Stronger tactile feedback
                break;
            case "success":
                Vibration.vibrate(120); // Clear, solid pulse for successful scan
                break;
            case "warning":
                Vibration.vibrate([0, 100, 80, 100]); // Double-vibe warning pattern
                break;
            case "error":
                Vibration.vibrate([0, 150, 80, 150, 80, 250]); // Distinct triple-vibe error pattern
                break;
            default:
                Vibration.vibrate(100);
        }
    } catch (e) {
        console.warn("[Haptics] Vibration failed:", e);
    }
};
