/**
 * Represents an authenticated admin user from the Firestore `admins` collection.
 */
export interface AdminUser {
    uid: string;
    email: string;
    name: string;
    role: string;
    status: string;
    permissions: string[];
}

/**
 * The session data persisted in SecureStore after a successful login.
 */
export interface SessionData {
    uid: string;
    email: string;
    name: string;
    role: string;
    permissions: string[];
    isLoggedIn: boolean;
}
