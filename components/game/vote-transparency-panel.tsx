"use client";

import { useMemo, useState } from "react";
import type { MafiaGame, VoteState } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";

interface VoteTransparencyPanelProps {
  game: MafiaGame;
  viewerId: string;
}

export function VoteTransparencyPanel({ game, viewerId }: VoteTransparencyPanelProps) {
  const [expandedCandidates, setExpandedCandidates] = useState<Set<string>>(new Set());

  const votes = game.votes ?? [];
  const isAnonymous = game.config.enableAnonymousVotes;

  const votesByCandidate = useMemo(() => {
    const map = new Map<string, VoteState[]>();
    votes.forEach((vote) => {
      const existing = map.get(vote.targetUid) ?? [];
      map.set(vote.targetUid, [...existing, vote]);
    });
    return map;
  }, [votes]);

  const sortedCandidates = useMemo(() => {
    const candidates = Array.from(votesByCandidate.entries()).map(([uid, voteList]) => {
      const player = game.players.find((p) => p.uid === uid);
      return {
        uid,
        name: player?.name ?? "Unknown",
        votes: voteList,
        count: voteList.length,
      };
    });
    return candidates.sort((a, b) => b.count - a.count);
  }, [votesByCandidate, game.players]);

  const totalVoted = votes.length;
  const alivePlayers = game.players.filter((p) => p.isAlive);
  const notVotedCount = alivePlayers.length - totalVoted;

  const toggleExpand = (uid: string) => {
    setExpandedCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  };

  if (game.phase !== "day") {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Current Votes</CardTitle>
        <p className="text-sm text-muted-foreground">
          {totalVoted}/{alivePlayers.length} players have voted
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedCandidates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No votes cast yet.</p>
        ) : (
          sortedCandidates.map((candidate) => {
            const isExpanded = expandedCandidates.has(candidate.uid);
            const viewerVoted = candidate.votes.some((v) => v.voterUid === viewerId);

            return (
              <div key={candidate.uid} className="rounded-lg border bg-card p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{candidate.name}</span>
                    <Badge variant={viewerVoted ? "default" : "secondary"}>
                      {candidate.count} {candidate.count === 1 ? "vote" : "votes"}
                    </Badge>
                  </div>
                  {!isAnonymous && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpand(candidate.uid)}
                      className="h-8 w-8 p-0"
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>

                {!isAnonymous && isExpanded && (
                  <ul className="mt-3 space-y-1 border-t pt-2">
                    {candidate.votes.map((vote) => {
                      const voter = game.players.find((p) => p.uid === vote.voterUid);
                      const isYou = vote.voterUid === viewerId;
                      return (
                        <li key={vote.voterUid} className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">•</span>
                          <span className={isYou ? "font-medium" : ""}>
                            {isYou ? "You" : voter?.name ?? "Unknown"}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span>{candidate.name}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })
        )}

        {notVotedCount > 0 && (
          <div className="rounded-lg border border-dashed bg-muted/20 p-3">
            <p className="text-sm text-muted-foreground">
              {notVotedCount} {notVotedCount === 1 ? "player hasn't" : "players haven't"} voted yet
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
