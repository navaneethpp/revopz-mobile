import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// @ts-ignore — getReactNativePersistence exists at runtime in firebase v12 but its type
// declaration is missing from the public types (known upstream issue).
import { initializeAuth, getReactNativePersistence, getAuth } from "firebase/auth";
import { createAsyncStorage } from "@react-native-async-storage/async-storage";

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize auth with AsyncStorage persistence so the session survives app restarts.
// Guard against re-initialization during hot reloads (getApps check above ensures
// only one Firebase app instance, but auth must also be initialized only once).
const appStorage = createAsyncStorage("revopz-auth");
export const auth = getApps().length > 1
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(appStorage),
    });

export const db = getFirestore(app);

export default app;