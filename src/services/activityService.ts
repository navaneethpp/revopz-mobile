/**
 * src/services/activityService.ts
 *
 * Fetches the most recently manufactured units from Firestore and maps
 * them into ActivityItem display objects for the Home Screen.
 *
 * Uses a one-shot getDocs() fetch (not onSnapshot) to avoid the
 * onAuthStateChanged race condition that caused "No recent activity yet."
 * to flash while auth was still restoring from AsyncStorage.
 */
import {
    collection,
    query,
    orderBy,
    limit,
    getDocs,
    Timestamp,
} from "firebase/firestore";
import { auth, db } from "@/config/firebase";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface ActivityItem {
    /** Firestore document ID */
    id: string;
    /** e.g. "Units Added: Revopz Premium Inverter Battery X1" */
    title: string;
    /** e.g. "RZ1100-001 • Battery • 5 mins ago" */
    subtitle: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Time-ago helper  (uses Date, not Firestore Timestamp directly)
// ─────────────────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
    const diffMs = Date.now() - date.getTime();
    const totalMins = Math.floor(diffMs / 60_000);

    if (totalMins < 1) return "just now";
    if (totalMins < 60) return `${totalMins} min${totalMins === 1 ? "" : "s"} ago`;

    const totalHrs = Math.floor(totalMins / 60);
    if (totalHrs < 24) return `${totalHrs} hr${totalHrs === 1 ? "" : "s"} ago`;
    if (totalHrs < 48) return "Yesterday";

    const totalDays = Math.floor(totalHrs / 24);
    return `${totalDays} days ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// fetchRecentActivity
//
// Queries manufactured_units ordered by createdAt descending, returns the
// latest `limitCount` records mapped to ActivityItem display objects.
//
// Throws on Firestore permission errors so the caller can log them.
// ─────────────────────────────────────────────────────────────────────────────

export async function fetchRecentActivity(
    limitCount = 5,
): Promise<ActivityItem[]> {

    try {
        const q = query(
            collection(db, "manufactured_units"),
            orderBy("createdAt", "desc"),
            limit(limitCount),
        );

        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map((doc) => {
            const data = doc.data();

            // Convert Firestore Timestamp → JS Date for reliable time calculation
            const createdAt: Date =
                data.createdAt instanceof Timestamp
                    ? data.createdAt.toDate()
                    : new Date();

            const productName: string = data.productName ?? "Unknown Product";
            const productNumber: string = data.productNumber ?? "";
            const category: string = data.category ?? "";
            const when = timeAgo(createdAt);

            return {
                id: doc.id,
                title: `Units Added: ${productName}`,
                subtitle: `${productNumber} • ${category} • ${when}`,
            } satisfies ActivityItem;
        });
    } catch (error) {
        console.error("Recent Activity Fetch Error:", error);
        throw error;
    }
}
