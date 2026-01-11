"use client";

import type { MafiaGame } from "@/types/game";
import { PhaseIndicator } from "./phase-indicator";
import { RoleReminder } from "./role-reminder";
import { TimerDisplay } from "./timer-display";
import { MafiaActionPrompt } from "./action-prompts/mafia-action-prompt";
import { DoctorActionPrompt } from "./action-prompts/doctor-action-prompt";
import {
  DetectiveActionPrompt,
  type InvestigationHistoryItem,
} from "./action-prompts/detective-action-prompt";
import { VotingPanel } from "./voting-panel";
import { Button } from "@/components/ui/button";
import { skipDetectiveInvestigation } from "@/lib/game/service";
import { cn } from "@/lib/utils";
import { ActionResults, type ActionResultItem } from "./action-results";

interface ActionCenterProps {
  game: MafiaGame;
  viewerId: string;
  onVote: (targetUid: string) => Promise<void>;
  onClearVote: () => Promise<void>;
  onReadyToggle?: () => Promise<void>;
  variant?: "desktop" | "mobile";
  investigationHistory?: InvestigationHistoryItem[];
  actionResults?: ActionResultItem[];
}

export function ActionCenter({
  game,
  viewerId,
  onVote,
  onClearVote,
  onReadyToggle,
  variant = "mobile",
  investigationHistory = [],
  actionResults = [],
}: ActionCenterProps) {
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

  const surfaceClasses = (tone: "default" | "warning" | "danger" | "muted" = "default") => {
    if (variant === "desktop") {
      switch (tone) {
        case "warning":
          return "rounded-2xl bg-amber-500/10 p-4 text-amber-100 ring-1 ring-amber-400/30";
        case "danger":
          return "rounded-2xl bg-red-500/10 p-4 text-red-100 ring-1 ring-red-400/30";
        case "muted":
          return "rounded-2xl bg-white/5 p-4 text-slate-200 ring-1 ring-white/10";
        default:
          return "rounded-2xl bg-white/5 p-4 text-slate-200 ring-1 ring-white/10";
      }
    }

    switch (tone) {
      case "warning":
        return "space-y-2 rounded-lg border border-amber-400/60 bg-amber-500/10 p-3";
      case "danger":
        return "space-y-2 rounded-lg border border-destructive/60 bg-destructive/10 p-3";
      case "muted":
        return "space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3";
      default:
        return "space-y-2 rounded-lg border border-border/60 bg-muted/10 p-3";
    }
  };

  const renderActionPrompt = () => {
    // Lobby phase
    if (game.phase === "lobby") {
      return (
        <div className={surfaceClasses("muted")}>
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-white/60">
            <span>Lobby status</span>
            <span>
              {game.players.filter((p) => p.ready).length}/{game.players.length} ready
            </span>
          </div>
          <p className="text-sm">
            Waiting for everyone to ready up before the host can launch the game.
          </p>
          {onReadyToggle && (
            <Button
              onClick={onReadyToggle}
              variant={viewer.ready ? "ghost" : "default"}
              className={variant === "desktop" ? "mt-3 w-full" : "w-full"}
              data-testid="ready-toggle"
            >
              {viewer.ready ? "Cancel ready" : "Ready up"}
            </Button>
          )}
        </div>
      );
    }

    // Dead observer
    if (!viewerAlive && game.phase !== "day") {
      const isSpectator = viewer.isSpectator ?? false;
      return (
        <div className={surfaceClasses("muted")}>
          <p className="text-sm">
            👻 {isSpectator 
                ? "You joined as a spectator and can watch all the action."
                : "You have been eliminated and now observe as a ghost."}
          </p>
          <p className="text-xs opacity-70">
            Roles will appear as they are revealed.
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
            investigationHistory={investigationHistory}
          />
        );
      }

      // Resolution or waiting
      if (stage === "resolution" || stage === "idle") {
        return (
          <div className={surfaceClasses("muted")}>
            <p className="text-sm">
              Night actions are complete. Waiting for the host to advance to the next phase.
            </p>
          </div>
        );
      }

      // Not your turn
      return (
        <div className={surfaceClasses("muted")}>
          <p className="text-sm">
            😴 You are asleep while other roles perform their night actions.
          </p>
          <p className="text-xs opacity-70">
            Current stage: {stage}
          </p>
        </div>
      );
    }

    // Day phase
    if (game.phase === "day") {
      if (!viewerAlive) {
        const isSpectator = viewer.isSpectator ?? false;
        return (
          <div className={surfaceClasses("muted")}>
            <p className="text-sm">
              👻 {isSpectator
                  ? "You joined as a spectator and can observe the voting."
                  : "You are eliminated and observing the town's decisions."}
            </p>
          </div>
        );
      }

      // Check if voting is complete and this player is the leading candidate
      if (game.dayEliminationState?.votingComplete && 
          game.dayEliminationState.leadingCandidateUid === viewerId &&
          !game.dayEliminationState.eliminated) {
        return (
          <div className={surfaceClasses("danger")}>
            <p className="text-sm font-semibold">
              ⚠️ You have the most votes ({game.dayEliminationState.leadingVoteCount})
            </p>
            <p className="text-sm opacity-80">
              Make your final statement in the chat before the host locks in their decision.
            </p>
          </div>
        );
      }

      // Check if voting is complete but viewer is not the target
      if (game.dayEliminationState?.votingComplete && !game.dayEliminationState.eliminated) {
        return (
          <div className={surfaceClasses("muted")}>
            <p className="text-sm">
              All votes are in. {game.dayEliminationState.leadingCandidateName} leads with {game.dayEliminationState.leadingVoteCount} votes.
            </p>
            <p className="text-xs opacity-70">
              Waiting for the host to confirm the elimination.
            </p>
          </div>
        );
      }

      return null; // Voting panel will be rendered separately
    }

    // Ended phase
    if (game.phase === "ended") {
      return (
        <div className={surfaceClasses("muted")}>
          <p className="text-lg font-semibold">
            {game.lastAction || "🏆 Game has ended"}
          </p>
          <p className="text-sm opacity-80">
            Review the activity timeline for the full story and role reveals.
          </p>
        </div>
      );
    }

    return null;
  };

  const containerClasses = cn(
    "flex flex-col gap-6",
    variant === "desktop"
      ? "sticky top-6 rounded-3xl bg-surface p-6 shadow-lg ring-1 ring-border/60"
      : "rounded-2xl border border-border/60 bg-background/80 p-4 shadow-sm"
  );

  return (
    <section className={containerClasses}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <PhaseIndicator phase={game.phase} round={game.round} variant={variant === "desktop" ? "minimal" : "default"} />
          <TimerDisplay deadline={game.phaseEndsAt} variant={variant === "desktop" ? "minimal" : "default"} />
        </div>
        <RoleReminder
          role={viewerRole}
          isAlive={viewerAlive}
          isRevealed={viewer.detectiveRevealed}
        />
      </div>

      {actionResults.length > 0 && (
        <ActionResults items={actionResults} variant={variant === "desktop" ? "desktop" : "mobile"} />
      )}

      {renderActionPrompt()}

      {game.phase === "day" && (
        <VotingPanel
          game={game}
          viewerId={viewerId}
          onVote={onVote}
          onClear={onClearVote}
          disabled={!viewerAlive}
          variant={variant === "desktop" ? "desktop" : "mobile"}
        />
      )}
    </section>
  );
}
