"use client";

import {
  onAuthStateChanged,
  signInAnonymously,
  updateProfile,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ensureAnonymousAuth, getFirebaseAuth } from "@/lib/firebase/client";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  displayName: string;
  setDisplayName: (name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsub = () => {};
    ensureAnonymousAuth()
      .then(() => {
        const auth = getFirebaseAuth();
        unsub = onAuthStateChanged(auth, (firebaseUser) => {
          setUser(firebaseUser);
          setLoading(false);
        });
      })
      .catch((error) => {
        console.error("Failed to initialize anonymous auth", error);
        setLoading(false);
      });

    return () => unsub();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      displayName: user?.displayName ?? "Mystery Player",
      setDisplayName: async (name: string) => {
        const auth = getFirebaseAuth();
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        if (!auth.currentUser) {
          throw new Error("Unable to update display name");
        }
        await updateProfile(auth.currentUser, { displayName: name });
        setUser({ ...auth.currentUser });
      },
    }),
    [loading, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be wrapped by AuthProvider");
  }
  return context;
};
