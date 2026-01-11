"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { MafiaGame } from "@/types/game";
import { cn } from "@/lib/utils";
import { HandIcon, Undo2Icon, ChevronDown, ChevronUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getRoleIcon } from "@/lib/game/role-icons";

interface VotingPanelProps {
  game: MafiaGame;
  viewerId: string;
  onVote: (targetUid: string) => void;
  onClear: () => void;
  disabled?: boolean;
  variant?: "desktop" | "mobile";
}

export function VotingPanel({ game, viewerId, onVote, onClear, disabled, variant = "mobile" }: VotingPanelProps) {
  const [expandedPlayers, setExpandedPlayers] = useState<Set<string>>(new Set());
  
  const votes = game.votes ?? [];
  const current = votes.find((vote) => vote.voterUid === viewerId) ?? null;
  const isAnonymous = game.config.enableAnonymousVotes;
  const viewer = game.players.find((p) => p.uid === viewerId);
  const isViewerDead = viewer ? !viewer.isAlive : false;
  const isViewerSpectator = viewer?.isSpectator ?? false;
  
  const voteData = votes.reduce<Record<string, { count: number; voters: string[] }>>((map, vote) => {
    if (!map[vote.targetUid]) {
      map[vote.targetUid] = { count: 0, voters: [] };
    }
    map[vote.targetUid].count += 1;
    map[vote.targetUid].voters.push(vote.voterUid);
    return map;
  }, {});

  const alivePlayers = game.players.filter((player) => player.isAlive && !player.isSpectator);
  const voteCast = votes.length;
  const totalVoters = alivePlayers.length;

  const toggleExpand = (playerUid: string) => {
    setExpandedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(playerUid)) {
        next.delete(playerUid);
      } else {
        next.add(playerUid);
      }
      return next;
    });
  };

  if (game.phase === "night") {
    if (variant === "desktop") {
      return (
        <div className="rounded-2xl bg-white/5 p-4 text-sm text-slate-200 ring-1 ring-white/10">
          {isViewerDead 
            ? (isViewerSpectator 
                ? "👻 You joined as a spectator. Observe the night quietly."
                : "👻 You are observing as a ghost while night actions unfold.")
            : "Voting resumes at dawn. Coordinate with your allies while the town sleeps."}
        </div>
      );
    }

    return (
      <Card className="border border-dashed border-border/70 bg-background/60">
        <CardHeader>
          <CardTitle className="text-base">
            {isViewerDead ? (isViewerSpectator ? "👻 Night Phase (Spectator)" : "👻 Night Phase (Observer)") : "Voting locked"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {isViewerDead 
            ? (isViewerSpectator 
                ? "You joined as a spectator. You can observe but cannot participate in the game."
                : "You are observing as a ghost. Night actions are in progress.")
            : "Votes open again at sunrise. Coordinate night actions in private chat."}
        </CardContent>
      </Card>
    );
  }

  const containerBase =
    variant === "desktop"
      ? "flex flex-col gap-4 rounded-2xl bg-white/5 p-5 text-slate-100 ring-1 ring-white/10"
      : "rounded-lg border border-border/80 bg-background/70";

  const headerClasses =
    variant === "desktop"
      ? "flex items-center justify-between"
      : "flex items-center justify-between";

  return (
    <TooltipProvider>
      <div className={containerBase}>
        <div className={headerClasses}>
          <h3 className="text-base font-semibold">
            {isViewerDead ? (isViewerSpectator ? "👻 Day Voting (Spectator)" : "👻 Day Voting (Observer)") : "Day voting"}
          </h3>
          <Badge variant={voteCast === totalVoters ? "default" : "secondary"}>
            {voteCast}/{totalVoters} votes
          </Badge>
        </div>
        <div className="space-y-3">
          {isViewerDead && (
            <div className={variant === "desktop" ? "rounded-xl bg-white/5 p-3 text-sm text-white/70" : "rounded-lg border border-muted bg-muted/20 p-3 text-sm text-muted-foreground"}>
              👻 {isViewerSpectator 
                  ? "You joined as a spectator. You can observe all votes but cannot participate in voting."
                  : "You are observing as a ghost. You can see all votes in real-time but cannot participate."}
            </div>
          )}
          {!isViewerDead && (
            <p className={variant === "desktop" ? "text-sm text-white/70" : "text-sm text-muted-foreground"}>
              Cast a vote to eliminate a suspect. Votes reset automatically when the phase changes.
            </p>
          )}
          <ul className="grid gap-2">
            {alivePlayers.map((player) => {
              const data = voteData[player.uid] ?? { count: 0, voters: [] };
              const isOwnVote = current?.targetUid === player.uid;
              const isExpanded = expandedPlayers.has(player.uid);
              const hasVotes = data.count > 0;

              return (
                <li
                  key={player.uid}
                  className={cn(
                    variant === "desktop"
                      ? "rounded-xl border border-white/10 bg-white/5"
                      : "rounded-lg border border-border/80 bg-background/70",
                    isOwnVote && (variant === "desktop" ? "border-primary/50 bg-primary/15" : "border-primary/60 bg-primary/10")
                  )}
                >
                  <div className="flex items-center justify-between p-3">
                    <div className="flex items-center gap-3">
                      <HandIcon className="h-4 w-4 text-primary" aria-hidden />
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{player.name}</span>
                          {isViewerDead && player.role && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge variant={player.role === "mafia" ? "destructive" : "outline"} className="cursor-help text-xs">
                                  {getRoleIcon(player.role)}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="capitalize">{player.role}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      {hasVotes && (
                        <div className="flex items-center gap-2">
                          <Badge variant={isOwnVote ? "default" : "secondary"} className="text-xs">
                            {data.count} {data.count === 1 ? "vote" : "votes"}
                          </Badge>
                          {(!isAnonymous || isViewerDead) && (
                            <button
                              type="button"
                              onClick={() => toggleExpand(player.uid)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <Users className="h-3 w-3" />
                              {isExpanded ? "Hide" : "Show"} voters
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {!isViewerDead && (
                    <Button
                      type="button"
                      size="sm"
                      variant={isOwnVote ? "secondary" : variant === "desktop" ? "ghost" : "outline"}
                      onClick={() => onVote(player.uid)}
                      disabled={disabled}
                      className={variant === "desktop" ? "w-full rounded-b-xl border-t border-white/10 bg-transparent text-white hover:bg-white/10" : ""}
                    >
                      {isOwnVote ? "You voted" : "Vote"}
                    </Button>
                  )}
                </div>

                {(!isAnonymous || isViewerDead) && isExpanded && hasVotes && (
                  <div className={variant === "desktop" ? "border-t border-white/10 bg-white/5 px-3 py-2" : "border-t bg-muted/20 px-3 py-2"}>
                    <p className={cn("mb-2 text-xs font-medium", variant === "desktop" ? "text-white/60" : "text-muted-foreground")}>Voted by:</p>
                    <ul className="space-y-1">
                      {data.voters.map((voterUid) => {
                        const voter = game.players.find((p) => p.uid === voterUid);
                        const isYou = voterUid === viewerId;
                        return (
                          <li key={voterUid} className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">•</span>
                            <span className={isYou ? "font-medium" : ""}>
                              {isYou ? "You" : voter?.name ?? "Unknown"}
                            </span>
                            {isViewerDead && voter?.role && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant={voter.role === "mafia" ? "destructive" : "outline"} className="cursor-help text-xs">
                                    {getRoleIcon(voter.role)}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="capitalize">{voter.role}</p>
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {!isViewerDead && current && (
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
        </div>
      </div>
    </TooltipProvider>
  );
}
