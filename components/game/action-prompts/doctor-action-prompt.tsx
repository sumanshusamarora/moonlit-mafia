"use client";

import { useState } from "react";
import type { MafiaGame } from "@/types/game";
import { Button } from "@/components/ui/button";
import { submitDoctorSave } from "@/lib/game/service";
import { toast } from "sonner";

interface DoctorActionPromptProps {
  game: MafiaGame;
  viewerId: string;
}

export function DoctorActionPrompt({ game, viewerId }: DoctorActionPromptProps) {
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const nightState = game.nightState;
  const doctorTargetUid = nightState?.doctorTargetUid ?? null;
  const alivePlayers = game.players.filter((player) => player.isAlive);

  const handleDoctorSave = async (targetUid: string) => {
    setPendingTarget(targetUid);
    try {
      await submitDoctorSave(game.id, viewerId, targetUid);
      toast.success("Protection assigned.");
    } catch (error) {
      toast.error((error as Error).message ?? "Unable to assign protection");
      console.error(error);
    } finally {
      setPendingTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground">Choose one player to protect</p>
        <p className="mt-1 text-xs text-muted-foreground">
          If the mafia target matches your choice, the kill is prevented.
        </p>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {alivePlayers.map((player) => {
          const isSelected = doctorTargetUid === player.uid || pendingTarget === player.uid;
          const isYou = player.uid === viewerId;
          return (
            <Button
              key={player.uid}
              variant={isSelected ? "default" : "outline"}
              disabled={pendingTarget !== null}
              onClick={() => handleDoctorSave(player.uid)}
              className="justify-start"
            >
              {isYou ? "Yourself" : player.name}
            </Button>
          );
        })}
      </div>

      {doctorTargetUid && (
        <div className="rounded-md border border-green-500 bg-green-100 p-3 dark:bg-green-900/20">
          <p className="text-sm font-medium text-green-900 dark:text-green-400">
            ✅ Protecting: {game.players.find((p) => p.uid === doctorTargetUid)?.name ?? "Unknown"}
          </p>
        </div>
      )}
    </div>
  );
}
