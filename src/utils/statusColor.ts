/**
 * Maps a unit status string to a background/text colour pair.
 * Shared across ActivityDetailModal, TimelineItem, and any future status badge.
 */
export function getStatusColor(status: string): { bg: string; text: string } {
    const norm = (status || "").toLowerCase();
    if (norm === "ready" || norm.includes("complete") || norm.includes("manufactur")) {
        return { bg: "#ECFDF5", text: "#059669" };
    } else if (norm.includes("fail") || norm.includes("test")) {
        return { bg: "#FEF2F2", text: "#DC2626" };
    } else if (norm.includes("pass") || norm.includes("quality") || norm.includes("qa")) {
        return { bg: "#FFFBEB", text: "#D97706" };
    } else if (norm.includes("transfer") || norm.includes("warehouse") || norm.includes("logistics")) {
        return { bg: "#EFF6FF", text: "#2563EB" };
    }
    return { bg: "#F1F5F9", text: "#64748B" };
}
