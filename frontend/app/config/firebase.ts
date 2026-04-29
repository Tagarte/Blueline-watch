import { initializeApp, getApps, getApp } from "firebase/app";
import {
    getDatabase,
    ref,
    onValue,
    get,
    query,
    limitToLast,
    orderByKey,
    set,           // ← AJOUTER CET IMPORT
    update,        // ← AJOUTER CET IMPORT
} from "firebase/database";
import {
    getAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    User
} from "firebase/auth";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import des variables d'environnement
import {
    FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID,
    FIREBASE_DATABASE_URL,
} from '@env';

// Configuration Firebase
const firebaseConfig = {
    apiKey: FIREBASE_API_KEY,
    authDomain: FIREBASE_AUTH_DOMAIN,
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
    messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
    appId: FIREBASE_APP_ID,
    databaseURL: FIREBASE_DATABASE_URL,
};

// Validation
const requiredKeys: (keyof typeof firebaseConfig)[] = [
    "apiKey",
    "projectId",
    "appId",
    "databaseURL",
];

const missingKeys = requiredKeys.filter(key => !firebaseConfig[key]);

if (missingKeys.length > 0) {
    throw new Error(`❌ Firebase config manquante: ${missingKeys.join(", ")}`);
}

console.log("✅ Firebase configuration validée");

// Initialisation
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const database = getDatabase(app);
export const auth = getAuth(app);

// =======================================================
// AUTHENTIFICATION
// =======================================================

export interface UserData {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    createdAt: number;
    lastLogin?: number;
}

// Inscription
export const registerUser = async (email: string, password: string, displayName: string): Promise<UserData> => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Mettre à jour le profil
        await updateProfile(user, { displayName: displayName });

        // Sauvegarder les infos utilisateur dans Realtime Database
        const userRef = ref(database, `users/${user.uid}`);
        await set(userRef, {  // ← Utiliser set() au lieu de userRef.set()
            uid: user.uid,
            email: email,
            displayName: displayName,
            createdAt: Date.now(),
            lastLogin: Date.now()
        });

        return {
            uid: user.uid,
            email: email,
            displayName: displayName,
            createdAt: Date.now()
        };
    } catch (error: any) {
        throw new Error(error.message);
    }
};

// Connexion
export const loginUser = async (email: string, password: string): Promise<UserData> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Mettre à jour la date de dernière connexion
        const userRef = ref(database, `users/${user.uid}`);
        await update(userRef, { lastLogin: Date.now() });  // ← Utiliser update()

        // Récupérer les données utilisateur
        const snapshot = await get(userRef);
        let userData: UserData;

        if (snapshot.exists()) {
            userData = snapshot.val() as UserData;
        } else {
            userData = {
                uid: user.uid,
                email: user.email || email,
                displayName: user.displayName || email.split('@')[0],
                createdAt: Date.now()
            };
        }

        return userData;
    } catch (error: any) {
        throw new Error(error.message);
    }
};

// Déconnexion
export const logoutUser = async (): Promise<void> => {
    try {
        await signOut(auth);
        await AsyncStorage.removeItem('user');
    } catch (error: any) {
        throw new Error(error.message);
    }
};

// Écouter les changements d'état de l'utilisateur
export const onAuthStateChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

// Récupérer les données utilisateur depuis Realtime Database
export const getUserData = async (uid: string): Promise<UserData | null> => {
    try {
        const userRef = ref(database, `users/${uid}`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
            return snapshot.val() as UserData;
        }
        return null;
    } catch (error) {
        console.error("Erreur getUserData:", error);
        return null;
    }
};

// Mettre à jour le profil utilisateur
export const updateUserProfile = async (uid: string, data: Partial<UserData>): Promise<void> => {
    try {
        const userRef = ref(database, `users/${uid}`);
        await update(userRef, data);  // ← Utiliser update()

        // Mettre à jour aussi dans Firebase Auth
        const currentUser = auth.currentUser;
        if (currentUser && data.displayName) {
            await updateProfile(currentUser, { displayName: data.displayName });
        }
    } catch (error) {
        console.error("Erreur updateUserProfile:", error);
        throw error;
    }
};

// =======================================================
// TYPES (existants)
// =======================================================

export interface AnalysisData {
    status: "NORMAL" | "ATTENTION" | "DANGER" | "INCONNU";
    waterLevel: number;
    trend: number;
    predictiveAlert: boolean;
    timestamp: number;
}

export interface LatestData {
    waterLevel: number;
    humidity?: number;
    temperature?: number;
}

export interface HistoricalData {
    timestamp: number;
    waterLevel: number;
    status: string;
}

// =======================================================
// REALTIME LISTENERS
// =======================================================

export const listenToAnalysis = (callback: (data: AnalysisData | null) => void): (() => void) => {
    const dbRef = ref(database, "analysis/latest");

    return onValue(
        dbRef,
        (snapshot) => {
            callback(snapshot.exists() ? snapshot.val() : null);
        },
        (error) => {
            console.error("❌ Erreur listenToAnalysis:", error);
            callback(null);
        }
    );
};

export const listenToLatestData = (callback: (data: LatestData | null) => void): (() => void) => {
    const dbRef = ref(database, "latestData");

    return onValue(
        dbRef,
        (snapshot) => {
            callback(snapshot.exists() ? snapshot.val() : null);
        },
        (error) => {
            console.error("❌ Erreur listenToLatestData:", error);
            callback(null);
        }
    );
};

// =======================================================
// FETCH DATA (One-time reads)
// =======================================================

export const getCurrentAnalysis = async (): Promise<AnalysisData | null> => {
    try {
        const dbRef = ref(database, "analysis/latest");
        const snapshot = await get(dbRef);
        return snapshot.exists() ? (snapshot.val() as AnalysisData) : null;
    } catch (error) {
        console.error("❌ Erreur getCurrentAnalysis:", error);
        return null;
    }
};

export const getHistoricalData = async (limit = 50): Promise<HistoricalData[]> => {
    try {
        const dbRef = ref(database, "analysis/history");
        const dbQuery = query(dbRef, orderByKey(), limitToLast(limit));
        const snapshot = await get(dbQuery);

        if (!snapshot.exists()) return [];

        const data = snapshot.val();
        const history: HistoricalData[] = [];

        for (const [key, value] of Object.entries(data)) {
            const item = value as any;
            history.push({
                timestamp: item.timestamp || parseInt(key, 10),
                waterLevel: item.waterLevel || 0,
                status: item.status || "INCONNU",
            });
        }

        return history.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
        console.error("❌ Erreur getHistoricalData:", error);
        return [];
    }
};

export const getLatestMeasurement = async (): Promise<LatestData | null> => {
    try {
        const dbRef = ref(database, "latestData");
        const snapshot = await get(dbRef);
        return snapshot.exists() ? (snapshot.val() as LatestData) : null;
    } catch (error) {
        console.error("❌ Erreur getLatestMeasurement:", error);
        return null;
    }
};

// =======================================================
// HELPERS UI
// =======================================================

export const getStatusColor = (status: string): string => {
    switch (status) {
        case "NORMAL": return "#22c55e";
        case "ATTENTION": return "#f59e0b";
        case "DANGER": return "#ef4444";
        default: return "#6b7280";
    }
};

export const getStatusText = (status: string): string => {
    switch (status) {
        case "NORMAL": return "Faible";
        case "ATTENTION": return "Moyen";
        case "DANGER": return "Élevé";
        default: return "Inconnu";
    }
};

export const getStatusIcon = (status: string): string => {
    switch (status) {
        case "NORMAL": return "checkmark-circle";
        case "ATTENTION": return "warning";
        case "DANGER": return "alert-circle";
        default: return "help-circle";
    }
};

export const formatTimestamp = (timestamp?: number): string => {
    if (!timestamp) return "--:--:--";
    const date = new Date(timestamp);
    return date.toLocaleTimeString("fr-FR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });
};

export const formatDate = (timestamp?: number): string => {
    if (!timestamp) return "Date inconnue";
    const date = new Date(timestamp);
    return date.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        hour: "2-digit",
        minute: "2-digit",
    });
};

export const getRiskFromLevel = (level: number): {
    status: "NORMAL" | "ATTENTION" | "DANGER";
    color: string;
    text: string;
} => {
    if (level >= 55) {
        return { status: "DANGER", color: "#ef4444", text: "Élevé" };
    }
    if (level >= 20) {
        return { status: "ATTENTION", color: "#f59e0b", text: "Moyen" };
    }
    return { status: "NORMAL", color: "#22c55e", text: "Faible" };
};

// Récupérer toutes les lectures
export const getAllReadings = async (): Promise<any[]> => {
    try {
        const dbRef = ref(database, "readings");
        const snapshot = await get(dbRef);

        if (!snapshot.exists()) return [];

        const data = snapshot.val();
        const readings = [];

        for (const [id, value] of Object.entries(data)) {
            readings.push({
                id: id,
                ...(value as object)
            });
        }

        return readings;
    } catch (error) {
        console.error("❌ Erreur getAllReadings:", error);
        return [];
    }
};

export const getRecentReadings = async (limit: number = 10): Promise<any[]> => {
    try {
        const dbRef = ref(database, "readings");
        const dbQuery = query(dbRef, orderByKey(), limitToLast(limit));
        const snapshot = await get(dbQuery);

        if (!snapshot.exists()) return [];

        const data = snapshot.val();
        const readings = [];

        for (const [id, value] of Object.entries(data)) {
            readings.push({
                id: id,
                ...(value as object)
            });
        }

        return readings.reverse();
    } catch (error) {
        console.error("❌ Erreur getRecentReadings:", error);
        return [];
    }
};

export const listenToReadings = (callback: (data: any) => void): (() => void) => {
    const dbRef = ref(database, "readings");

    return onValue(
        dbRef,
        (snapshot) => {
            callback(snapshot.val());
        },
        (error) => {
            console.error("❌ Erreur listenToReadings:", error);
        }
    );
};