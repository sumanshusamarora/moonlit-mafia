"use client";

import { AppShell } from "@/components/layout/app-shell";
import { JoinGameForm } from "@/components/game/join-game-form";

export default function JoinLobbyPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">Join a lobby</h1>
          <p className="text-sm text-muted-foreground">
            Enter the code shared by the host to step into the story.
          </p>
        </div>
        <JoinGameForm />
      </div>
    </AppShell>
  );
}
