/**
 * src/services/unitService.ts
 *
 * Firestore helpers for the `manufactured_units` collection.
 * Uses the modular Firebase v9+ SDK.
 */
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    Unsubscribe,
    Timestamp,
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
    writeBatch,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/config/firebase";
import { getSession } from "@/utils/storage";
import type { ActivityEntry, ManufacturedUnit } from "@/types/unit";

const COLLECTION = "manufactured_units";
const DEFAULT_LIMIT = 5;

// ---------------------------------------------------------------------------
// Time-ago helper
// ---------------------------------------------------------------------------

function timeAgo(ts: Timestamp): string {
    const diffMs = Date.now() - ts.toMillis();
    const mins = Math.floor(diffMs / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
    const days = Math.floor(hrs / 24);
    return `${days} day${days === 1 ? "" : "s"} ago`;
}

// ---------------------------------------------------------------------------
// toActivityEntry
// ---------------------------------------------------------------------------

function toActivityEntry(unit: ManufacturedUnit): ActivityEntry {
    const when = timeAgo(unit.createdAt);
    return {
        id: unit.id,
        title: `Units Added: ${unit.productName}`,
        subtitle: `${unit.category} · #${unit.productNumber} · Added by ${unit.createdByName} • ${when}`,
    };
}

// ---------------------------------------------------------------------------
// subscribeRecentUnits
//
// Waits for Firebase Auth to confirm a signed-in user BEFORE opening the
// Firestore listener. This prevents "Missing or insufficient permissions"
// errors that occur when onSnapshot fires before AsyncStorage auth is restored.
//
// Returns an unsubscribe function — call it when the component unmounts.
// ---------------------------------------------------------------------------

export function subscribeRecentUnits(
    onUpdate: (entries: ActivityEntry[]) => void,
    onError?: (err: Error) => void,
    count: number = DEFAULT_LIMIT,
): Unsubscribe {
    let innerUnsub: Unsubscribe | null = null;

    // Outer listener: waits for auth state to settle
    const authUnsub = onAuthStateChanged(auth, (user) => {
        // Tear down any existing Firestore listener when auth state changes
        if (innerUnsub) {
            innerUnsub();
            innerUnsub = null;
        }

        if (!user) {
            // Not signed in — clear the activity list and stop
            onUpdate([]);
            return;
        }

        // Signed in — open the Firestore real-time listener
        const q = query(
            collection(db, COLLECTION),
            orderBy("createdAt", "desc"),
            limit(count),
        );

        innerUnsub = onSnapshot(
            q,
            (snapshot) => {
                const entries: ActivityEntry[] = snapshot.docs.map((doc) => {
                    const data = doc.data();
                    const unit: ManufacturedUnit = {
                        id: doc.id,
                        productName: data.productName ?? "",
                        productNumber: data.productNumber ?? "",
                        category: data.category ?? "",
                        // CR-01: guard against missing createdAt field (e.g. manually-inserted docs)
                        createdAt: data.createdAt instanceof Timestamp
                            ? data.createdAt
                            : Timestamp.now(),
                        createdByName: data.createdByName ?? "",
                        status: data.status ?? "",
                        warrantyMonths: data.warrantyMonths ?? 0,
                        warrantyStatus: data.warrantyStatus ?? "",
                    };
                    return toActivityEntry(unit);
                });
                onUpdate(entries);
            },
            (err) => {
                onError?.(err);
            },
        );
    });

    // Return a composite unsubscribe that cleans up both listeners
    return () => {
        authUnsub();
        if (innerUnsub) innerUnsub();
    };
}

export interface RegisterUnitData {
    productName: string;
    productNumber: string;
    category: string;
    requiresInspection: boolean;
    warrantyMonths: number;
}

/**
 * Creates a new manufactured unit document in the `manufactured_units` Firestore collection.
 * Populates createdBy credentials using current auth user and session details.
 */
export async function registerUnit(data: RegisterUnitData): Promise<void> {
    const session = await getSession();
    if (!session) {
        throw new Error("No active session found. Please log in again.");
    }

    const user = auth.currentUser;
    if (!user) {
        throw new Error("User not authenticated.");
    }

    // Check for duplicate serial number (SKU)
    const docRef = doc(db, COLLECTION, data.productNumber);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        throw new Error(`A unit with serial number "${data.productNumber}" is already registered.`);
    }

    const status = data.requiresInspection ? "Quality Check" : "Ready";

    const unitDoc = {
        category: data.category,
        createdAt: serverTimestamp(),
        createdBy: session.email, // email that logged in
        createdByName: session.name,
        createdByRole: session.role,
        fakeMarkedAt: null,
        fakeMarkedBy: null,
        fakeReason: "",
        isFakeProduct: false,
        manufacturedDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
        productName: data.productName,
        productNameNormalized: data.productName.toLowerCase(),
        productNumber: data.productNumber,
        status: status,
        updatedAt: serverTimestamp(),
        warrantyMonths: data.warrantyMonths,
        warrantyStatus: "not_registered",
    };

    try {
        await setDoc(docRef, unitDoc);
    } catch (err: any) {
        // FB-03: Map Firestore error codes to friendly user messages
        const code: string = err?.code ?? "";
        if (code === "permission-denied") {
            throw new Error("You do not have permission to register units.");
        }
        if (code === "unavailable") {
            throw new Error("Network unavailable. Please check your connection and try again.");
        }
        throw new Error("Failed to register unit. Please try again.");
    }
}

export interface RegisterUnitBatchData {
    productName: string;
    productNumbers: string[];
    category: string;
    warrantyMonths: number;
}

/**
 * Registers multiple manufactured units inside a single atomic Firestore writeBatch transaction.
 * Performs database duplicate checking for each serial number before executing the batch commit.
 */
export async function registerUnitsBatch(data: RegisterUnitBatchData): Promise<void> {
    const session = await getSession();
    if (!session) {
        throw new Error("No active session found. Please log in again.");
    }

    const user = auth.currentUser;
    if (!user) {
        throw new Error("User not authenticated.");
    }

    if (!data.productNumbers || data.productNumbers.length === 0) {
        throw new Error("No serial numbers provided to register.");
    }

    // 1. Perform parallel duplicate checks
    const dupes: string[] = [];
    await Promise.all(
        data.productNumbers.map(async (num) => {
            const docRef = doc(db, COLLECTION, num);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                dupes.push(num);
            }
        })
    );

    if (dupes.length > 0) {
        throw new Error(
            `The following serial numbers are already registered: ${dupes.join(", ")}`
        );
    }

    // 2. Commit batch
    const batch = writeBatch(db);
    const mDate = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    for (const num of data.productNumbers) {
        const docRef = doc(db, COLLECTION, num);
        const unitDoc = {
            category: data.category,
            createdAt: serverTimestamp(),
            createdBy: session.email,
            createdByName: session.name,
            createdByRole: session.role,
            fakeMarkedAt: null,
            fakeMarkedBy: null,
            fakeReason: "",
            isFakeProduct: false,
            manufacturedDate: mDate,
            productName: data.productName,
            productNameNormalized: data.productName.toLowerCase(),
            productNumber: num,
            status: "Ready",
            updatedAt: serverTimestamp(),
            warrantyMonths: data.warrantyMonths,
            warrantyStatus: "not_registered",
        };
        batch.set(docRef, unitDoc);
    }

    try {
        await batch.commit();
    } catch (err: any) {
        // FB-03: Map Firestore error codes to friendly user messages
        const code: string = err?.code ?? "";
        if (code === "permission-denied") {
            throw new Error("You do not have permission to register units.");
        }
        if (code === "unavailable") {
            throw new Error("Network unavailable. Please check your connection and try again.");
        }
        throw new Error("Failed to register batch. Please try again.");
    }
}


