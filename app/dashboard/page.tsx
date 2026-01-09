"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { GameSummaryCard } from "@/components/game/game-summary-card";
import { useGameList } from "@/hooks/use-game-list";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { upcoming, archived, loading } = useGameList();

  return (
    <AppShell
      headerSlot={
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/lobby/new">Create lobby</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href="/lobby/join">Join by code</Link>
          </Button>
        </div>
      }
    >
      <div className="space-y-12">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-semibold">Your lobbies</h1>
            {!loading && upcoming.length === 0 && (
              <Button asChild size="sm">
                <Link href="/lobby/new">Kick off a game</Link>
              </Button>
            )}
          </div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-48 w-full" />
              ))}
            </div>
          ) : upcoming.length ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {upcoming.map((game) => (
                <GameSummaryCard key={game.id} game={game} />
              ))}
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-muted-foreground/40 p-8 text-center text-sm text-muted-foreground">
              You have no active lobbies. Create one to start the story.
            </p>
          )}
        </section>

        {!loading && archived.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-2xl font-semibold">Past sessions</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {archived.map((game) => (
                <GameSummaryCard key={game.id} game={game} />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
