import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "@/config/firebase";

export const loginUser = async (
    email: string,
    password: string
) => {
    try {
        // Firebase Auth login
        const userCredential =
            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

        const uid = userCredential.user.uid;

        // Firestore lookup
        const adminRef = doc(db, "admins", uid);
        const adminSnap = await getDoc(adminRef);

        if (!adminSnap.exists()) {
            throw new Error("Admin account not found");
        }

        const adminData = adminSnap.data();

        // Role validation
        if (adminData.role !== "production_unit") {
            throw new Error(
                "Access denied. You do not have permission to use this app."
            );
        }

        // Status validation
        if (adminData.status !== "active") {
            throw new Error(
                "Your account is inactive. Please contact administrator."
            );
        }

        return adminData;
    } catch (error: any) {
        throw new Error(error.message);
    }
};