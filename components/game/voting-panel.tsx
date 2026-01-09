"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { MafiaGame } from "@/types/game";
import { cn } from "@/lib/utils";
import { HandIcon, Undo2Icon } from "lucide-react";

interface VotingPanelProps {
  game: MafiaGame;
  viewerId: string;
  onVote: (targetUid: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function VotingPanel({ game, viewerId, onVote, onClear, disabled }: VotingPanelProps) {
  const votes = game.votes ?? [];
  const current = votes.find((vote) => vote.voterUid === viewerId) ?? null;
  const voteCounts = votes.reduce<Record<string, number>>((map, vote) => {
    map[vote.targetUid] = (map[vote.targetUid] ?? 0) + 1;
    return map;
  }, {});

  if (game.phase === "night") {
    return (
      <Card className="border border-dashed border-border/70 bg-background/60">
        <CardHeader>
          <CardTitle className="text-base">Voting locked</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Votes open again at sunrise. Coordinate night actions in private chat.
        </CardContent>
      </Card>
    );
  }

  const alivePlayers = game.players.filter((player) => player.isAlive);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Day voting</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Cast a vote to eliminate a suspect. Voting resets automatically when the phase changes.
        </p>
        <ul className="grid gap-2">
          {alivePlayers.map((player) => {
            const count = voteCounts[player.uid] ?? 0;
            const isOwnVote = current?.targetUid === player.uid;
            return (
              <li
                key={player.uid}
                className={cn(
                  "flex items-center justify-between rounded-lg border border-border/80 bg-background/70 p-3",
                  isOwnVote && "border-primary/60 bg-primary/10"
                )}
              >
                <div className="flex items-center gap-3 text-sm">
                  <HandIcon className="h-4 w-4 text-primary" aria-hidden />
                  <span className="font-medium">{player.name}</span>
                  <span className="text-xs text-muted-foreground">{count} votes</span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant={isOwnVote ? "secondary" : "outline"}
                  onClick={() => onVote(player.uid)}
                  disabled={disabled}
                >
                  {isOwnVote ? "You voted" : "Vote"}
                </Button>
              </li>
            );
          })}
        </ul>
        {current && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            className="mt-2"
            disabled={disabled}
          >
            <Undo2Icon className="mr-2 h-4 w-4" aria-hidden />
            Withdraw vote
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
