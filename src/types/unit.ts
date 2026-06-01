/**
 * src/types/unit.ts
 *
 * Represents a document in the `manufactured_units` Firestore collection.
 */
import { Timestamp } from "firebase/firestore";

export interface ManufacturedUnit {
    id: string;           // Firestore document ID
    productName: string;
    productNumber: string;
    category: string;
    createdAt: Timestamp;
    createdByName: string;
    status: string;
    warrantyMonths: number;
    warrantyStatus: string;
    createdBy?: string;
    createdByRole?: string;
    manufacturedDate?: string;
    isFakeProduct?: boolean;
    updatedAt?: Timestamp;
}

/**
 * A lightweight summary used to populate the Recent Activity list.
 */
export interface ActivityEntry {
    id: string;
    title: string;    // e.g. "Units Added: P2"
    subtitle: string; // e.g. "Battery · 1350 · added by Manager • 5 mins ago"
}
