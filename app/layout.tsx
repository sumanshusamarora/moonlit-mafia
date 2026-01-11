import type { Metadata } from "next";
import "@fontsource/inter";
import "@fontsource/space-grotesk";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

export const metadata: Metadata = {
  title: {
    template: "%s | Moonlit Mafia",
    default: "Moonlit Mafia"
  },
  description:
    "Host and play immersive Mafia games online with configurable roles, live chat, voting, and cinematic narration.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="min-h-screen bg-background text-foreground antialiased"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
