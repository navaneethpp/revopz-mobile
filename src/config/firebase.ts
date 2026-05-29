import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, disableNetwork } from "firebase/firestore";
// @ts-ignore — getReactNativePersistence is resolved from the RN bundle at runtime by Metro,
// but type definitions default to web. We import it from firebase/auth with @ts-ignore.
import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Dump all AsyncStorage keys to see what is stored
AsyncStorage.getAllKeys().then(async (keys) => {
    for (const key of keys) {
        try {
            const val = await AsyncStorage.getItem(key);
        } catch (e) {
            console.error(`[FirebaseConfig] Error reading key [${key}]:`, e);
        }
    }
}).catch((err) => {
    console.error("[FirebaseConfig] Error getting AsyncStorage keys:", err);
});

// ─── App ─────────────────────────────────────────────────────────────────────
// Snapshot the app count BEFORE initializeApp so we can tell whether this is
// a first-ever launch or a hot-reload re-evaluation of this module.
const alreadyInitialized = getApps().length > 0;
const app = alreadyInitialized ? getApp() : initializeApp(firebaseConfig);

// ─── Auth ─────────────────────────────────────────────────────────────────────
// `initializeAuth` must be called exactly once per Firebase app instance.
// On hot reload, the module re-evaluates but the Firebase SDK keeps its
// internal state alive, so calling initializeAuth again throws or silently
// resets the persisted session.
//
// PREVIOUS BUG: the guard was `getApps().length > 1` — always false because
// by the time auth runs, there is exactly 1 app registered.  This meant
// initializeAuth ran on every hot reload, wiping the AsyncStorage-persisted
// token and making auth.currentUser null after app reopen.
//
// FIX: Reuse the `alreadyInitialized` flag captured before the app was
// created/retrieved. If the app already existed → auth was already initialized
// → just retrieve it with getAuth(). Only call initializeAuth on true first run.
//
// We pass the default AsyncStorage export (the legacy singleton that satisfies
// Firebase's ReactNativeAsyncStorage interface: { getItem, setItem, removeItem }).
export const auth = alreadyInitialized
    ? getAuth(app)
    : initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
    });

export const db = getFirestore(app);

// Disable network initially to prevent connection errors before internet connectivity is verified.
disableNetwork(db).catch((err) => {
    console.error("[FirebaseConfig] Error disabling network initially:", err);
});

export default app;