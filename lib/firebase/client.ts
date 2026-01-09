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
