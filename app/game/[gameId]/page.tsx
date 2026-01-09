"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerList } from "@/components/game/player-list";
import { VotingPanel } from "@/components/game/voting-panel";
import { PhaseStatusCard } from "@/components/game/phase-status-card";
import { ChatPanel } from "@/components/chat/chat-panel";
import { VoiceRecorder } from "@/components/voice/voice-recorder";
import { VoiceMemoList } from "@/components/voice/voice-memo-list";
import { useGameRoom } from "@/hooks/use-game-room";
import { useAuth } from "@/components/providers/auth-provider";
import {
  advancePhase,
  archiveGame,
  clearVote,
  deleteVoiceMemo,
  postMessage,
  recordSystemMessage,
  startGame,
  submitVote,
  updatePlayerReadyState,
  uploadVoiceMemo,
  syncPhaseDeadline,
} from "@/lib/game/service";
import { toast } from "sonner";
import { Loader2Icon, MoonIcon, SunIcon } from "lucide-react";

export default function GameRoomPage() {
  const params = useParams<{ gameId: string }>();
  const gameId = params?.gameId;
  const { game, messages, voiceMemos, loading } = useGameRoom(gameId ?? null);
  const { user } = useAuth();
  const [isBusy, setIsBusy] = useState(false);
  const [timerBusy, setTimerBusy] = useState(false);

  const viewerId = user?.uid ?? "";
  const viewer = useMemo(() => game?.players.find((player) => player.uid === viewerId), [game, viewerId]);
  const isHost = viewer?.isHost ?? false;

  const handleReadyToggle = async () => {
    if (!game || !viewer) return;
    try {
      await updatePlayerReadyState(game.id, viewer.uid, !viewer.ready);
    } catch (error) {
      toast.error("Unable to update ready state");
      console.error(error);
    }
  };

  const handleStart = async () => {
    if (!game) return;
    setIsBusy(true);
    try {
      await startGame(game.id);
      await recordSystemMessage(game.id, "The game has begun. Mafia, make your move.", "night");
    } catch (error) {
      toast.error((error as Error).message ?? "Unable to start the game");
      console.error(error);
    } finally {
      setIsBusy(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!game || !viewer) {
      toast.error("You must join the lobby before chatting.");
      return;
    }
    const authorName = viewer.name || user?.displayName || "Mystery Player";
    try {
      await postMessage(game.id, {
        gameId: game.id,
        authorUid: viewer.uid,
        authorName,
        body: text,
        createdAt: Date.now(),
        phase: game.phase,
      });
    } catch (error) {
      toast.error("Message failed to send");
      console.error(error);
    }
  };

  const handleVote = async (targetUid: string) => {
    if (!game || !viewer) return;
    try {
      await submitVote(game.id, {
        targetUid,
        voterUid: viewer.uid,
        createdAt: Date.now(),
      });
    } catch (error) {
      toast.error("Unable to submit vote");
      console.error(error);
    }
  };

  const handleClearVote = async () => {
    if (!game || !viewer) return;
    try {
      await clearVote(game.id, viewer.uid);
    } catch (error) {
      toast.error("Unable to clear vote");
      console.error(error);
    }
  };

  const handleUploadVoice = async (file: File, durationMs: number) => {
    if (!game || !viewer) return;
    try {
      await uploadVoiceMemo(game.id, file, viewer.uid, viewer.name, durationMs);
      toast.success("Voice memo uploaded");
    } catch (error) {
      toast.error("Failed to upload memo");
      console.error(error);
    }
  };

  const handleExtendTimer = async (milliseconds: number) => {
    if (!game) return;
    setTimerBusy(true);
    const baseline = Math.max(game.phaseEndsAt ?? Date.now(), Date.now());
    try {
      await syncPhaseDeadline(
        game.id,
        baseline + milliseconds,
        `Timer extended by ${Math.round(milliseconds / 1000)}s`
      );
      toast.success("Phase timer extended");
    } catch (error) {
      toast.error("Unable to update timer");
      console.error(error);
    } finally {
      setTimerBusy(false);
    }
  };

  const handleResetTimer = async () => {
    if (!game) return;
    const minutes =
      game.phase === "day"
        ? game.config.dayDurationMinutes
        : game.phase === "night"
        ? game.config.nightDurationMinutes
        : null;
    if (!minutes) {
      toast.error("Configure phase durations before resetting the timer.");
      return;
    }
    setTimerBusy(true);
    try {
      await syncPhaseDeadline(
        game.id,
        Date.now() + minutes * 60 * 1000,
        `Timer reset for ${game.phase}`
      );
      toast.success("Phase timer reset");
    } catch (error) {
      toast.error("Unable to reset timer");
      console.error(error);
    } finally {
      setTimerBusy(false);
    }
  };

  const handleDeleteMemo = async (memoId: string, storagePath: string) => {
    if (!game) return;
    try {
      await deleteVoiceMemo(game.id, memoId, storagePath);
      toast.success("Voice memo removed");
    } catch (error) {
      toast.error("Unable to delete memo");
      console.error(error);
    }
  };

  const handleAdvancePhase = async () => {
    if (!game) return;
    const nextPhase = game.phase === "day" ? "night" : game.phase === "night" ? "day" : "day";
    try {
      await advancePhase(game.id, nextPhase);
      await recordSystemMessage(game.id, `Phase advanced to ${nextPhase}.`, nextPhase);
    } catch (error) {
      toast.error("Unable to advance phase");
      console.error(error);
    }
  };

  const handleArchive = async () => {
    if (!game) return;
    try {
      await archiveGame(game.id);
      toast.success("Game archived");
    } catch (error) {
      toast.error("Unable to archive game");
      console.error(error);
    }
  };

  const copyCode = async () => {
    if (!game) return;
    try {
      await navigator.clipboard.writeText(game.code);
      toast.success("Lobby code copied");
    } catch (error) {
      toast.error("Clipboard unavailable");
      console.error(error);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[70vh] items-center justify-center">
          <Loader2Icon className="h-8 w-8 animate-spin text-primary" aria-hidden />
        </div>
      </AppShell>
    );
  }

  if (!game) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl rounded-xl border border-dashed border-muted-foreground/40 p-12 text-center">
          <h1 className="text-2xl font-semibold">Lobby not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The link may be invalid or this game has been archived.
          </p>
        </div>
      </AppShell>
    );
  }

  const everyoneReady = game.players.every((player) => player.ready);
  const voiceDisabled = !game.config.enableVoice;
  const timerControlsEnabled = isHost && (game.phase === "day" || game.phase === "night");

  return (
    <AppShell
      headerSlot={
        <div className="flex items-center gap-3">
          <Badge variant="secondary">Code: {game.code}</Badge>
          <Button size="sm" variant="outline" onClick={copyCode}>
            Copy code
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="grid gap-6 lg:grid-cols-[2fr,1.5fr]">
          <div className="space-y-6">
            <PhaseStatusCard
              game={game}
              isHost={isHost}
              onExtendTimer={timerControlsEnabled ? handleExtendTimer : undefined}
              onResetTimer={timerControlsEnabled ? handleResetTimer : undefined}
              isTimerBusy={timerBusy}
            />
            <Card>
              <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-2xl font-semibold">Players</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {game.players.length}/{game.config.maxPlayers} in lobby • Phase: {game.phase}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {game.phase === "lobby" && (
                    <Button size="sm" variant="outline" onClick={handleReadyToggle}>
                      {viewer?.ready ? "Unready" : "Ready up"}
                    </Button>
                  )}
                  {isHost && game.phase === "lobby" && (
                    <Button size="sm" onClick={handleStart} disabled={!everyoneReady || isBusy}>
                      {isBusy ? "Starting..." : "Start game"}
                    </Button>
                  )}
                  {isHost && game.phase !== "ended" && game.phase !== "lobby" && (
                    <Button size="sm" variant="outline" onClick={handleAdvancePhase}>
                      {game.phase === "day" ? (
                        <>
                          <MoonIcon className="mr-2 h-4 w-4" aria-hidden />
                          Enter night
                        </>
                      ) : (
                        <>
                          <SunIcon className="mr-2 h-4 w-4" aria-hidden />
                          Enter day
                        </>
                      )}
                    </Button>
                  )}
                  {isHost && game.phase !== "ended" && (
                    <Button size="sm" variant="ghost" onClick={handleArchive}>
                      Archive
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <PlayerList
                  players={game.players}
                  viewerId={viewerId}
                  revealRoles={game.config.revealRolesOnDeath || game.phase === "ended"}
                />
              </CardContent>
            </Card>

            <VotingPanel
              game={game}
              viewerId={viewerId}
              onVote={handleVote}
              onClear={handleClearVote}
              disabled={!viewer || !viewer.isAlive || game.phase !== "day"}
            />
          </div>

          <div className="space-y-6">
            <ChatPanel messages={messages} onSend={handleSendMessage} phase={game.phase} disabled={!viewer} />
            {!voiceDisabled && (
              <VoiceRecorder onUpload={handleUploadVoice} disabled={!viewer || !viewer.isAlive} />
            )}
            <VoiceMemoList
              memos={voiceMemos}
              canModerate={isHost}
              onDelete={handleDeleteMemo}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
