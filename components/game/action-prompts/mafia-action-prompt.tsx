"use client";

import { useMemo, useState } from "react";
import type { MafiaGame } from "@/types/game";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { submitMafiaVote } from "@/lib/game/service";
import { toast } from "sonner";

interface MafiaActionPromptProps {
  game: MafiaGame;
  viewerId: string;
}

export function MafiaActionPrompt({ game, viewerId }: MafiaActionPromptProps) {
  const [pendingTarget, setPendingTarget] = useState<string | null>(null);
  const nightState = game.nightState;
  const mafiaVotes = nightState?.mafiaVotes ?? [];
  const lockTargetUid = nightState?.lockedTargetUid ?? null;
  const consensusReached = lockTargetUid !== null;

  const playersById = useMemo(
    () => new Map(game.players.map((player) => [player.uid, player])),
    [game.players]
  );

  const mafiaMembers = useMemo(
    () => game.players.filter((player) => player.role === "mafia" && player.isAlive),
    [game.players]
  );

  const mafiaAssignments = useMemo(
    () =>
      mafiaMembers.map((member) => {
        const vote = mafiaVotes.find((entry) => entry.voterUid === member.uid);
        const target = vote?.targetUid ? playersById.get(vote.targetUid) ?? null : null;
        return { member, target };
      }),
    [mafiaMembers, mafiaVotes, playersById]
  );

  const mafiaTargets = game.players.filter(
    (player) => player.isAlive && player.uid !== viewerId && player.role !== "mafia"
  );

  const viewerVote = mafiaVotes.find((vote) => vote.voterUid === viewerId);
  const viewerTarget = viewerVote?.targetUid ?? null;

  const handleMafiaVote = async (targetUid: string) => {
    setPendingTarget(targetUid);
    try {
      await submitMafiaVote(game.id, viewerId, targetUid);
      toast.success("Vote submitted to the mafia.");
    } catch (error) {
      toast.error((error as Error).message ?? "Unable to submit mafia vote");
      console.error(error);
    } finally {
      setPendingTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-foreground">Choose a target to eliminate</p>
        <p className="mt-1 text-xs text-muted-foreground">
          All mafia must agree on the same target before dawn.
        </p>
      </div>

      {/* Mafia Vote Alignment */}
      <div className="rounded-md border border-muted bg-muted/20 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Mafia Alignment
        </p>
        <ul className="mt-2 space-y-2 text-sm">
          {mafiaAssignments.length === 0 && <li className="text-muted-foreground">No votes recorded yet.</li>}
          {mafiaAssignments.map(({ member, target }) => {
            const isYou = member.uid === viewerId;
            return (
              <li
                key={member.uid}
                className="flex items-center justify-between rounded border border-muted/70 bg-background px-3 py-2"
              >
                <span className="font-medium">
                  {isYou ? "You" : member.name}
                </span>
                <Badge variant={target ? "outline" : "secondary"}>
                  {target ? target.name : "Undecided"}
                </Badge>
              </li>
            );
          })}
        </ul>
      </div>

      {consensusReached ? (
        <div className="rounded-md border border-green-500 bg-green-100 p-3 dark:bg-green-900/20">
          <p className="text-sm font-medium text-green-900 dark:text-green-400">
            ✅ Consensus reached: {playersById.get(lockTargetUid)?.name ?? "Unknown"} is marked for elimination.
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-2 sm:grid-cols-2">
            {mafiaTargets.map((player) => {
              const isSelected = viewerTarget === player.uid || pendingTarget === player.uid;
              return (
                <Button
                  key={player.uid}
                  variant={isSelected ? "default" : "outline"}
                  disabled={pendingTarget !== null}
                  onClick={() => handleMafiaVote(player.uid)}
                  className="justify-start"
                >
                  {player.name}
                </Button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
