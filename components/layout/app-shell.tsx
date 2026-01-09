import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoonStarIcon, GithubIcon } from "lucide-react";
import { type ReactNode } from "react";

interface AppShellProps {
  children: ReactNode;
  headerSlot?: ReactNode;
}

export function AppShell({ children, headerSlot }: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-background/60">
      <header className="sticky top-0 z-40 border-b border-border/60 backdrop-blur bg-background/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
            <MoonStarIcon className="h-5 w-5 text-primary" aria-hidden />
            Moonlit Mafia
          </Link>
          <div className="flex items-center gap-3">
            {headerSlot}
            <Button asChild variant="ghost" size="sm">
              <Link href="https://github.com/" target="_blank" rel="noreferrer">
                <GithubIcon className="h-4 w-4" aria-hidden />
                <span className="sr-only">GitHub</span>
              </Link>
            </Button>
          </div>
        </div>
      </header>
      <main className={cn("mx-auto w-full max-w-6xl flex-1 px-6 py-8")}>{children}</main>
    </div>
  );
}
