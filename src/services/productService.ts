/**
 * src/services/productService.ts
 *
 * Fetches product metadata from Firestore for dropdown configuration.
 */
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/config/firebase";
import type { DropdownOption } from "@/components/ui/LabeledDropdown";

const COLLECTION = "products";

export interface Product {
    name: string;
    category: string;
    warrantyMonths: number;
}

/**
 * Fetch all products from Firestore, sorted alphabetically by name.
 * Returns Product objects containing name, category, and warrantyMonths.
 */
export async function fetchProducts(): Promise<Product[]> {
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
            return {
                name: data.name || "Unknown Product",
                category: data.category || "",
                warrantyMonths: typeof data.warrantyMonths === "number" ? data.warrantyMonths : 12,
            };
        });
    } catch (error) {
        throw error;
    }
}
