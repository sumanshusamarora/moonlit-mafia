"use client";

import type { MafiaGame } from "@/types/game";
import { PhaseIndicator } from "./phase-indicator";
import { RoleReminder } from "./role-reminder";
import { TimerDisplay } from "./timer-display";
import { MafiaActionPrompt } from "./action-prompts/mafia-action-prompt";
import { DoctorActionPrompt } from "./action-prompts/doctor-action-prompt";
import { DetectiveActionPrompt } from "./action-prompts/detective-action-prompt";
import { VotingPanel } from "./voting-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { skipDetectiveInvestigation } from "@/lib/game/service";

interface ActionCenterProps {
  game: MafiaGame;
  viewerId: string;
  onVote: (targetUid: string) => Promise<void>;
  onClearVote: () => Promise<void>;
  onReadyToggle?: () => Promise<void>;
}

export function ActionCenter({ game, viewerId, onVote, onClearVote, onReadyToggle }: ActionCenterProps) {
  const viewer = game.players.find((player) => player.uid === viewerId);
  if (!viewer) return null;

  const viewerRole = viewer.role;
  const viewerAlive = viewer.isAlive;
  const nightState = game.nightState;
  const stage = nightState?.stage ?? "idle";

  const handleSkipDetectiveCheck = async () => {
    try {
      await skipDetectiveInvestigation(game.id, viewerId);
    } catch (error) {
      console.error("Failed to skip detective investigation:", error);
      throw error;
    }
  };

  const renderActionPrompt = () => {
    // Lobby phase
    if (game.phase === "lobby") {
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Waiting for all players to ready up...
          </p>
          <div className="rounded-md border bg-muted/20 p-3">
            <p className="text-sm font-medium">
              Players Ready: {game.players.filter((p) => p.ready).length}/{game.players.length}
            </p>
          </div>
          {onReadyToggle && (
            <Button
              onClick={onReadyToggle}
              variant={viewer.ready ? "outline" : "default"}
              className="w-full"
            >
              {viewer.ready ? "Unready" : "Ready up"}
            </Button>
          )}
        </div>
      );
    }

    // Dead observer
    if (!viewerAlive && game.phase !== "day") {
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            👻 You are eliminated and observing as a ghost.
          </p>
          <p className="text-xs text-muted-foreground">
            You can see all roles revealed below.
          </p>
        </div>
      );
    }

    // Night phase
    if (game.phase === "night") {
      // Mafia stage
      if (stage === "mafia" && viewerRole === "mafia") {
        return <MafiaActionPrompt game={game} viewerId={viewerId} />;
      }

      // Doctor stage
      if (stage === "doctor" && viewerRole === "doctor") {
        return <DoctorActionPrompt game={game} viewerId={viewerId} />;
      }

      // Detective stage
      if (stage === "detective" && viewerRole === "detective") {
        const investigationsRemaining = viewer.detectiveChecksRemaining ?? null;
        return (
          <DetectiveActionPrompt
            game={game}
            viewerId={viewerId}
            investigationsRemaining={investigationsRemaining}
            onSkip={handleSkipDetectiveCheck}
          />
        );
      }

      // Resolution or waiting
      if (stage === "resolution" || stage === "idle") {
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Night actions are complete. Waiting for host to advance phase.
            </p>
          </div>
        );
      }

      // Not your turn
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            😴 You are asleep while other roles perform their night actions.
          </p>
          <p className="text-xs text-muted-foreground">
            Current stage: {stage}
          </p>
        </div>
      );
    }

    // Day phase
    if (game.phase === "day") {
      if (!viewerAlive) {
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              👻 You are eliminated and observing as a ghost.
            </p>
          </div>
        );
      }

      // Check if voting is complete and this player is the leading candidate
      if (game.dayEliminationState?.votingComplete && 
          game.dayEliminationState.leadingCandidateUid === viewerId &&
          !game.dayEliminationState.eliminated) {
        return (
          <Card className="border-destructive bg-destructive/5">
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-semibold text-destructive">
                ⚠️ You have the most votes ({game.dayEliminationState.leadingVoteCount})
              </p>
              <p className="text-sm text-muted-foreground">
                You have a chance to defend yourself. Make your final statement in the chat before the host makes their decision.
              </p>
            </CardContent>
          </Card>
        );
      }

      // Check if voting is complete but viewer is not the target
      if (game.dayEliminationState?.votingComplete && !game.dayEliminationState.eliminated) {
        return (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              All votes are in. {game.dayEliminationState.leadingCandidateName} has the most votes with {game.dayEliminationState.leadingVoteCount} votes.
            </p>
            <p className="text-xs text-muted-foreground">
              Waiting for the host to make the elimination decision.
            </p>
          </div>
        );
      }

      return null; // Voting panel will be rendered separately
    }

    // Ended phase
    if (game.phase === "ended") {
      return (
        <Card className="border-primary bg-primary/5">
          <CardContent className="space-y-3 p-4">
            <p className="text-lg font-bold text-primary">
              {game.lastAction || "🏆 Game has ended"}
            </p>
            <p className="text-sm text-muted-foreground">
              Check the activity timeline for final results and role reveals.
            </p>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <Card className="sticky top-4">
      <CardContent className="space-y-4 p-4">
        <PhaseIndicator phase={game.phase} round={game.round} />
        <RoleReminder
          role={viewerRole}
          isAlive={viewerAlive}
          isRevealed={viewer.detectiveRevealed}
        />
        {renderActionPrompt()}
        {game.phase === "day" && (
          <VotingPanel
            game={game}
            viewerId={viewerId}
            onVote={onVote}
            onClear={onClearVote}
            disabled={!viewerAlive}
          />
        )}
        <TimerDisplay deadline={game.phaseEndsAt} />
      </CardContent>
    </Card>
  );
}
