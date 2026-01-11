"use client";
import type { MafiaGame } from "@/types/game";
import { PhaseIndicator } from "./phase-indicator";
import { TimerDisplay } from "./timer-display";
import { RoleReminder } from "./role-reminder";
import { VotingPanel } from "./voting-panel";
import { MafiaActionPrompt } from "./action-prompts/mafia-action-prompt";
import { DoctorActionPrompt } from "./action-prompts/doctor-action-prompt";
import {
  DetectiveActionPrompt,
  type InvestigationHistoryItem,
} from "./action-prompts/detective-action-prompt";
import { Button } from "@/components/ui/button";
import { skipDetectiveInvestigation } from "@/lib/game/service";
import { ActionResults, type ActionResultItem } from "./action-results";

interface GameSurfaceProps {
  game: MafiaGame;
  viewerId: string;
  activePlayerUid?: string;
  investigationHistory?: InvestigationHistoryItem[];
  actionResults?: ActionResultItem[];
  onVote: (targetUid: string) => Promise<void>;
  onVoteAs?: (voterUid: string, targetUid: string) => Promise<void>;
  onClearVote: () => Promise<void>;
  onClearVoteAs?: (voterUid: string) => Promise<void>;
  onReadyToggle?: () => Promise<void>;
  onStartGame?: () => Promise<void>;
}

export function GameSurface({
  game,
  viewerId,
  activePlayerUid,
  investigationHistory,
  actionResults,
  onVote,
  onVoteAs,
  onClearVote,
  onClearVoteAs,
  onReadyToggle,
  onStartGame,
}: GameSurfaceProps) {
  const actualViewer = game.players.find((player) => player.uid === viewerId);
  if (!actualViewer) {
    return null;
  }

  const actingUid = activePlayerUid ?? viewerId;
  const actingViewer = game.players.find((player) => player.uid === actingUid);
  if (!actingViewer) {
    return null;
  }

  const detectiveHistory = investigationHistory ?? [];

  const handleSkipDetectiveCheck = async () => {
    try {
      await skipDetectiveInvestigation(game.id, actingUid);
    } catch (error) {
      console.error("Failed to skip detective investigation", error);
      throw error;
    }
  };

  const handleVoteForActingViewer = async (targetUid: string) => {
    if (actingUid === viewerId) {
      return onVote(targetUid);
    }

    return onVoteAs?.(actingUid, targetUid) ?? onVote(targetUid);
  };

  const handleClearVoteForActingViewer = async () => {
    if (actingUid === viewerId) {
      return onClearVote();
    }

    return onClearVoteAs?.(actingUid) ?? onClearVote();
  };

  const renderActionPrompt = () => {
    if (game.phase === "lobby") {
      const everyoneReady = game.players.every((p) => p.ready);
      const isHost = actualViewer.isHost;
      const canStartGame = isHost && everyoneReady && game.players.length >= 4;
      
      return (
        <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4 text-textPrimary">
          <div className="flex items-center justify-between text-xs uppercase tracking-wide text-textSecondary">
            <span>Lobby status</span>
            <span>
              {game.players.filter((p) => p.ready).length}/{game.players.length} ready
            </span>
          </div>
          <p className="text-sm">Waiting for everyone to ready up before the host can launch the game.</p>
          
          {/* Start Game Button for Host - Primary Action */}
          {canStartGame && onStartGame && (
            <Button
              onClick={onStartGame}
              variant="default"
              className="w-full"
              data-testid="start-game-button-desktop"
            >
              Start Game
            </Button>
          )}
          
          {/* Ready Toggle for non-hosts or hosts who haven't reached start conditions */}
          {onReadyToggle && !canStartGame && (
            <Button
              onClick={onReadyToggle}
              variant={actualViewer.ready ? "ghost" : "default"}
              className="w-full"
            >
              {actualViewer.ready ? "Cancel ready" : "Ready up"}
            </Button>
          )}
        </div>
      );
    }

    if (game.phase === "night") {
      const stage = game.nightState?.stage ?? "idle";

      if (!actingViewer.isAlive && stage !== "detective") {
        const isSpectator = actingViewer.isSpectator ?? false;
        return (
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-textPrimary">
            <p className="text-sm">
              👻 {isSpectator
                ? "You joined as a spectator and can watch all the action."
                : "You have been eliminated and now observe as a ghost."}
            </p>
            <p className="text-xs text-textSecondary">Roles will appear as they are revealed.</p>
          </div>
        );
      }

      if (stage === "mafia" && actingViewer.role === "mafia") {
        return <MafiaActionPrompt game={game} viewerId={actingUid} />;
      }

      if (stage === "doctor" && actingViewer.role === "doctor") {
        return <DoctorActionPrompt game={game} viewerId={actingUid} />;
      }

      if (stage === "detective" && actingViewer.role === "detective") {
        const investigationsRemaining = actingViewer.detectiveChecksRemaining ?? null;
        return (
          <DetectiveActionPrompt
            game={game}
            viewerId={actingUid}
            investigationsRemaining={investigationsRemaining}
            onSkip={handleSkipDetectiveCheck}
            investigationHistory={detectiveHistory}
          />
        );
      }

      if (stage === "resolution" || stage === "idle") {
        return (
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-textPrimary">
            <p className="text-sm">Night actions are complete. Waiting for the host to advance to the next phase.</p>
          </div>
        );
      }

      return (
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-textPrimary">
          <p className="text-sm">😴 You are asleep while other roles perform their night actions.</p>
          <p className="text-xs text-textSecondary">Current stage: {stage}</p>
        </div>
      );
    }

    if (game.phase === "day") {
      if (!actingViewer.isAlive) {
        const isSpectator = actingViewer.isSpectator ?? false;
        return (
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-textPrimary">
            <p className="text-sm">
              👻 {isSpectator
                ? "You joined as a spectator and can observe the voting."
                : "You are eliminated and observing the town's decisions."}
            </p>
          </div>
        );
      }

      const elimination = game.dayEliminationState;
      if (elimination?.votingComplete && elimination.leadingCandidateUid === actingUid && !elimination.eliminated) {
        return (
          <div className="rounded-2xl border border-danger/40 bg-danger/10 p-4 text-textPrimary">
            <p className="text-sm font-semibold">⚠️ You have the most votes ({elimination.leadingVoteCount})</p>
            <p className="text-sm text-textSecondary">Make your final statement before the host locks in their decision.</p>
          </div>
        );
      }

      if (elimination?.votingComplete && !elimination.eliminated) {
        return (
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-textPrimary">
            <p className="text-sm">
              All votes are in. {elimination.leadingCandidateName} leads with {elimination.leadingVoteCount} votes.
            </p>
            <p className="text-xs text-textSecondary">Waiting for the host to confirm the elimination.</p>
          </div>
        );
      }

      return null;
    }

    if (game.phase === "ended") {
      return (
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-textPrimary">
          <p className="text-lg font-semibold">{game.lastAction || "🏆 Game has ended"}</p>
          <p className="text-sm text-textSecondary">Review the activity timeline for the full story and role reveals.</p>
        </div>
      );
    }

    return null;
  };

  return (
    <section className="flex flex-col gap-6 rounded-3xl bg-surface p-6 text-textPrimary shadow-lg ring-1 ring-border/60">
      <header className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <PhaseIndicator phase={game.phase} round={game.round} variant="minimal" />
          <TimerDisplay deadline={game.phaseEndsAt} variant="minimal" />
        </div>
        <RoleReminder
          role={actingViewer.role}
          isAlive={actingViewer.isAlive}
          isRevealed={actingViewer.detectiveRevealed}
        />
      </header>

      {actionResults && actionResults.length > 0 && (
        <ActionResults items={actionResults} variant="desktop" />
      )}

      {game.isTestMode && !actualViewer.isHost && (
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-textSecondary">
          Test Mode is active. The host may simulate actions to fast-forward the story.
        </div>
      )}

      {renderActionPrompt()}

      {game.phase === "day" && (
        <VotingPanel
          game={game}
          viewerId={actingUid}
          onVote={handleVoteForActingViewer}
          onClear={handleClearVoteForActingViewer}
          disabled={!actingViewer.isAlive}
          variant="desktop"
        />
      )}
    </section>
  );
}
