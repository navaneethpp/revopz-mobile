import { COLORS } from "@/theme/colors";

/**
 * Maps a unit status string to a background/text colour pair.
 * Shared across ActivityDetailModal, TimelineItem, and any future status badge.
 */
export function getStatusColor(status: string): { bg: string; text: string } {
    const norm = (status || "").toLowerCase();
    if (norm === "ready" || norm.includes("complete") || norm.includes("manufactur")) {
        return { bg: COLORS.emerald50, text: COLORS.emerald600 };
    } else if (norm.includes("fail") || norm.includes("test")) {
        return { bg: COLORS.red50, text: COLORS.red600 };
    } else if (norm.includes("pass") || norm.includes("quality") || norm.includes("qa")) {
        return { bg: COLORS.amber50, text: COLORS.amber600 };
    } else if (norm.includes("transfer") || norm.includes("warehouse") || norm.includes("logistics")) {
        return { bg: COLORS.blue50, text: COLORS.blue600 };
    }
    return { bg: COLORS.slate100, text: COLORS.slate500 };
}
