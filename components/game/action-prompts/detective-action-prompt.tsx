"use client";

import { useState } from "react";
import type { MafiaGame } from "@/types/game";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { submitDetectiveInvestigation } from "@/lib/game/service";
import { toast } from "sonner";

interface DetectiveActionPromptProps {
  game: MafiaGame;
  viewerId: string;
  investigationsRemaining: number | null;
  onSkip?: () => void;
}

export function DetectiveActionPrompt({
  game,
  viewerId,
  investigationsRemaining,
  onSkip,
}: DetectiveActionPromptProps) {
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const [isSkipping, setIsSkipping] = useState(false);
  const nightState = game.nightState;
  const detectiveResult = nightState?.detectiveResult ?? null;
  const alivePlayers = game.players.filter((player) => player.isAlive && player.uid !== viewerId);

  const handleDetectiveInvestigate = async (targetUid: string) => {
    setPendingTarget(targetUid);
    try {
      await submitDetectiveInvestigation(game.id, viewerId, targetUid);
      toast.success("Investigation submitted.");
    } catch (error) {
      toast.error((error as Error).message ?? "Unable to investigate");
      console.error(error);
    } finally {
      setPendingTarget(null);
    }
  };

  const handleSkip = async () => {
    if (!onSkip) return;
    setIsSkipping(true);
    try {
      await onSkip();
      toast.success("Investigation skipped.");
    } catch (error) {
      toast.error((error as Error).message ?? "Unable to skip");
      console.error(error);
    } finally {
      setIsSkipping(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Investigate one player</p>
          {investigationsRemaining !== null && (
            <Badge variant="outline" className="text-xs">
              {investigationsRemaining} {investigationsRemaining === 1 ? "check" : "checks"} left
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Learn whether they are aligned with the mafia.
        </p>
      </div>

      {detectiveResult ? (
        <div className="rounded-md border border-primary/40 bg-primary/10 p-3">
          <p className="text-sm font-semibold text-foreground">🔍 Investigation Result</p>
          <p className="mt-2 text-sm">
            {game.players.find((player) => player.uid === detectiveResult.targetUid)?.name ?? "Unknown"} is{" "}
            <strong className={detectiveResult.isMafia ? "text-red-600 dark:text-red-400" : "text-green-600 dark:text-green-400"}>
              {detectiveResult.isMafia ? "a member of the mafia" : "not a member of the mafia"}
            </strong>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            {alivePlayers.map((player) => (
              <Button
                key={player.uid}
                variant={pendingTarget === player.uid ? "default" : "outline"}
                disabled={pendingTarget !== null || isSkipping}
                onClick={() => handleDetectiveInvestigate(player.uid)}
                className="justify-start"
              >
                {player.name}
              </Button>
            ))}
          </div>
          {onSkip && (
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={pendingTarget !== null || isSkipping}
              className="w-full"
            >
              Skip investigation this round
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
