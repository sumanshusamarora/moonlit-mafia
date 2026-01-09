"use client";

import { type PropsWithChildren } from "react";
import { QueryProvider } from "./query-provider";
import { AuthProvider } from "./auth-provider";
import { SonnerProvider } from "./sonner-provider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AuthProvider>
      <QueryProvider>
        {children}
        <SonnerProvider />
      </QueryProvider>
    </AuthProvider>
  );
}
