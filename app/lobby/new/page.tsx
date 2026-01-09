"use client";

import { AppShell } from "@/components/layout/app-shell";
import { CreateGameForm } from "@/components/game/create-game-form";

export default function NewLobbyPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Create a new lobby</h1>
          <p className="text-sm text-muted-foreground">
            Configure roles, timers, and house rules before sharing the code with friends.
          </p>
        </div>
        <CreateGameForm />
      </div>
    </AppShell>
  );
}
