"use client";

import { type PropsWithChildren } from "react";
import { QueryProvider } from "./query-provider";
import { AuthProvider } from "./auth-provider";
import { SonnerProvider } from "./sonner-provider";
import { ThemeProvider } from "./theme-provider";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryProvider>
          {children}
          <SonnerProvider />
        </QueryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
