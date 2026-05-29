/**
 * src/services/productService.ts
 *
 * Fetches product metadata from Firestore for dropdown configuration.
 */
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/config/firebase";
import type { DropdownOption } from "@/components/ui/LabeledDropdown";

const COLLECTION = "products";

/**
 * Fetch all products from Firestore, sorted alphabetically by name.
 * Maps the `name` field to label and value for dropdown options.
 */
export async function fetchProducts(): Promise<DropdownOption[]> {
    try {
        const q = query(
            collection(db, COLLECTION),
            orderBy("name", "asc")
        );
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs.map((doc) => {
            const data = doc.data();
            const name = data.name || "Unknown Product";
            return {
                label: name,
                value: name, // We set the value to the name as per requirements
            };
        });
    } catch (error) {
        console.error("[productService] fetchProducts failed:", error);
        throw error;
    }
}
