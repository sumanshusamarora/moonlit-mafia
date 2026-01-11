import { getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  signInAnonymously,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { firebaseConfig } from "./config";

let app = getApps()[0];

if (!app) {
  assertFirebaseConfig();
  app = initializeApp(firebaseConfig);
}

let auth: Auth | undefined;
let db: Firestore | undefined;

export const getFirebaseAuth = () => {
  if (auth) {
    return auth;
  }
  auth = getAuth(app);
  void setPersistence(auth, browserLocalPersistence).catch(console.error);
  return auth;
};

export const getFirebaseFirestore = () => {
  if (db) {
    return db;
  }
  db = getFirestore(app);
  return db;
};

export const ensureAnonymousAuth = async () => {
  const authInstance = getFirebaseAuth();
  if (!authInstance.currentUser) {
    await signInAnonymously(authInstance);
  }
  return authInstance;
};

function assertFirebaseConfig() {
  const missing: string[] = [];
  if (!firebaseConfig.apiKey) missing.push("NEXT_PUBLIC_FIREBASE_API_KEY");
  if (!firebaseConfig.authDomain) missing.push("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  if (!firebaseConfig.projectId) missing.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  if (!firebaseConfig.appId) missing.push("NEXT_PUBLIC_FIREBASE_APP_ID");

  if (missing.length) {
    throw new Error(
      `Missing Firebase env vars: ${missing.join(", ")}. ` +
        "Check `.env.local`, ensure they start with NEXT_PUBLIC_, and restart the dev server. " +
        "Also verify you don't have a shell-exported NEXT_PUBLIC_FIREBASE_* overriding `.env.local`."
    );
  }
}
