"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerListCompact } from "@/components/game/player-list-compact";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ActionCenter } from "@/components/game/action-center";
import { ActivityTimeline } from "@/components/game/activity-timeline";
import { MobileTabs } from "@/components/ui/tabs-mobile";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { useGameRoom } from "@/hooks/use-game-room";
import { useAuth } from "@/components/providers/auth-provider";
import { useUserSettings } from "@/hooks/use-user-settings";
import { useGameEvents } from "@/hooks/use-game-events";
import { uploadVoiceMessage } from "@/lib/firebase/storage";
import {
  advancePhase,
  archiveGame,
  clearVote,
  eliminateDayCandidate,
  peekAtRoles,
  restartLobby,
  postMessage,
  recordSystemMessage,
  startGame,
  submitVote,
  updatePlayerReadyState,
  syncPhaseDeadline,
} from "@/lib/game/service";
import { toast } from "sonner";
import { Loader2Icon, MoonIcon, SunIcon, UsersIcon, ActivityIcon, SettingsIcon, MessageSquareIcon } from "lucide-react";
import { SettingsPanel } from "@/components/game/settings-panel";
import { PlayersPanel } from "@/components/game/players-panel";
import { GameSurface } from "@/components/game/game-surface";
import { ChatActionPanel } from "@/components/game/chat-action-panel";
import type { InvestigationHistoryItem } from "@/components/game/action-prompts/detective-action-prompt";
import type { ActionResultItem } from "@/components/game/action-results";
import type {
  DetectiveInvestigationEventData,
  NightOutcomeEventData,
  DayEliminationEventData,
} from "@/types/events";

export default function GameRoomPage() {
  const params = useParams<{ gameId: string }>();
  const gameId = params?.gameId;
  const { game, messages, loading } = useGameRoom(gameId ?? null);
  const { user } = useAuth();
  const { settings } = useUserSettings();
  const { events } = useGameEvents(gameId ?? null);
  const [isBusy, setIsBusy] = useState(false);
  const [timerBusy, setTimerBusy] = useState(false);
  const [automationReadyEnabled, setAutomationReadyEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState("game");
  const [phaseCountdown, setPhaseCountdown] = useState("--:--");
  const [utilityTab, setUtilityTab] = useState("chat");
  const [testModeViewerUid, setTestModeViewerUid] = useState<string | null>(null);

  // Centralized function to switch active test player with optional navigation
  const switchActiveTestPlayer = (playerId: string | null, options?: { navigateToGame?: boolean }) => {
    setTestModeViewerUid(playerId);
    if (options?.navigateToGame && playerId) {
      setActiveTab("game");
    }
  };

  const viewerId = user?.uid ?? "";
  const viewer = useMemo(() => game?.players.find((player) => player.uid === viewerId), [game, viewerId]);
  const isHost = viewer?.isHost ?? false;

  const effectiveViewerId = useMemo(() => {
    if (!game?.isTestMode || !isHost) {
      return viewerId;
    }

    if (testModeViewerUid && game.players.some((player) => player.uid === testModeViewerUid)) {
      return testModeViewerUid;
    }

    return viewerId;
  }, [game, isHost, testModeViewerUid, viewerId]);
  const autoGameId = game?.id ?? null;
  const autoPhase = game?.phase ?? null;
  const autoViewerId = viewer?.uid ?? null;
  const autoViewerReady = viewer?.ready ?? false;
  
  const unreadMessages = useMemo(() => {
    // Simple unread count - could be enhanced with localStorage tracking
    return messages.filter(m => m.createdAt > (Date.now() - 60000)).length;
  }, [messages]);

  const detectiveHistoryByDetectiveUid = useMemo(() => {
    const map = new Map<string, InvestigationHistoryItem[]>();
    if (!events?.length) {
      return map;
    }

    for (const event of events) {
      if (event.type !== "detective-investigation") {
        continue;
      }

      const data = event.data as unknown as DetectiveInvestigationEventData;
      const detectiveUid = data.detectiveUid;
      if (!detectiveUid) {
        continue;
      }

      const list = map.get(detectiveUid) ?? [];
      list.push({
        id: event.id,
        targetUid: data.targetUid,
        targetName: data.targetName,
        isMafia: data.isMafia,
        round: event.round,
        timestamp: event.timestamp,
      });
      map.set(detectiveUid, list);
    }

    for (const [uid, list] of map.entries()) {
      list.sort((a, b) => b.timestamp - a.timestamp);
      map.set(uid, list);
    }

    return map;
  }, [events]);

  const detectiveHistory = useMemo<InvestigationHistoryItem[]>(() => {
    return detectiveHistoryByDetectiveUid.get(effectiveViewerId) ?? [];
  }, [detectiveHistoryByDetectiveUid, effectiveViewerId]);

  const actionResults = useMemo<ActionResultItem[]>(() => {
    if (!game) {
      return [];
    }

    if (game.phase === "lobby") {
      return [];
    }

    const viewerPlayer = game.players.find((player) => player.uid === effectiveViewerId) ?? viewer;
    const results: ActionResultItem[] = [];
    const eventList = events ?? [];
    const currentRound = Math.max(0, game.round ?? 0);
    const eligibleRounds = new Set<number>();
    if (currentRound > 0) {
      eligibleRounds.add(currentRound);
      if (currentRound - 1 > 0) {
        eligibleRounds.add(currentRound - 1);
      }
    }

    const includeEvent = (round: number) => {
      if (!eligibleRounds.size) {
        return true;
      }
      return eligibleRounds.has(round);
    };

    const latestNightOutcome = eventList.find(
      (event) => event.type === "night-outcome" && includeEvent(event.round)
    );

    if (latestNightOutcome) {
      const data = latestNightOutcome.data as unknown as NightOutcomeEventData;
      let description = "Night passed without incident.";
      let tone: ActionResultItem["tone"] = "neutral";

      if (data.savedByDoctor) {
        description = "Doctor prevented an elimination during the night.";
        tone = "success";
      } else if (data.eliminatedName) {
        description = `${data.eliminatedName} was eliminated overnight.`;
        if (data.eliminatedRole) {
          description += ` Role revealed: ${data.eliminatedRole}.`;
        }
        tone = "danger";
      }

      results.push({
        id: `night-${latestNightOutcome.id}`,
        icon: "🌙",
        title: "Night Resolution",
        description,
        meta: `Night ${latestNightOutcome.round}`,
        tone,
        timestamp: latestNightOutcome.timestamp,
      });
    }

    const latestDayElimination = eventList.find(
      (event) => event.type === "day-elimination" && includeEvent(event.round)
    );

    if (latestDayElimination) {
      const data = latestDayElimination.data as unknown as DayEliminationEventData;
      let description = `${data.eliminatedName} was voted out.`;
      if (data.eliminatedRole) {
        description += ` Role revealed: ${data.eliminatedRole}.`;
      }
      description += ` Final vote count: ${data.voteCount}.`;

      results.push({
        id: `day-${latestDayElimination.id}`,
        icon: "☀️",
        title: "Day Elimination",
        description,
        meta: `Day ${latestDayElimination.round}`,
        tone: "danger",
        timestamp: latestDayElimination.timestamp,
      });
    }

    if (viewerPlayer?.role === "detective") {
      const latestDetective = detectiveHistory.find((entry) => includeEvent(entry.round));

      if (latestDetective) {
        results.push({
          id: `detective-${latestDetective.id}`,
          icon: "🕵️",
          title: "Detective Result",
          description: `You investigated ${latestDetective.targetName}. Result: ${latestDetective.isMafia ? "Mafia" : "Not Mafia"}.`,
          meta: `Round ${latestDetective.round}`,
          tone: latestDetective.isMafia ? "danger" : "success",
          timestamp: latestDetective.timestamp,
        });
      } else if (game.nightState?.detectiveResult?.targetUid) {
        const fallbackTarget = game.players.find(
          (player) => player.uid === game.nightState?.detectiveResult?.targetUid
        );
        if (fallbackTarget) {
          const directResult = game.nightState.detectiveResult;
          results.push({
            id: `detective-live-${directResult.targetUid}`,
            icon: "🕵️",
            title: "Detective Result",
            description: `You investigated ${fallbackTarget.name}. Result: ${directResult.isMafia ? "Mafia" : "Not Mafia"}.`,
            meta: "Pending event log",
            tone: directResult.isMafia ? "danger" : "success",
            timestamp: directResult.revealedAt,
          });
        }
      }
    }

    const godMessages = (messages ?? [])
      .filter(
        (msg) =>
          msg.authorUid === "system" &&
          (msg.authorName === "God" || msg.authorName === "Narrator")
      )
      .sort((a, b) => b.createdAt - a.createdAt);

    const latestGod = godMessages[0];
    if (latestGod) {
      results.push({
        id: `god-${latestGod.id}`,
        icon: "📖",
        title: "God Update",
        description: latestGod.body,
        meta: "God",
        tone: "info",
        timestamp: latestGod.createdAt,
      });
    }

    return results.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
  }, [game, events, messages, viewer, detectiveHistory, effectiveViewerId]);

  useEffect(() => {
    if (!game?.isTestMode || !isHost) {
      setTestModeViewerUid(null);
      return;
    }

    if (testModeViewerUid && !game.players.some((player) => player.uid === testModeViewerUid)) {
      setTestModeViewerUid(null);
    }
  }, [game?.isTestMode, game?.players, isHost, testModeViewerUid]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAutomationReadyEnabled(window.localStorage.getItem("mafia-auto-ready") === "true");
  }, []);

  useEffect(() => {
    if (!automationReadyEnabled) return;
    if (!autoGameId || !autoViewerId || autoViewerReady || autoPhase !== "lobby") return;
    updatePlayerReadyState(autoGameId, autoViewerId, true).catch((error) => {
      console.error("Automation failed to toggle ready state", error);
    });
  }, [automationReadyEnabled, autoGameId, autoPhase, autoViewerId, autoViewerReady]);

  useEffect(() => {
    if (!game?.phaseEndsAt) {
      setPhaseCountdown("--:--");
      return;
    }

    const updateCountdown = () => {
      if (!game?.phaseEndsAt) {
        setPhaseCountdown("--:--");
        return;
      }
      const diff = Math.max(0, game.phaseEndsAt - Date.now());
      const totalSeconds = Math.floor(diff / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      setPhaseCountdown(`${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`);
    };

    updateCountdown();
    const interval = window.setInterval(updateCountdown, 1000);
    return () => window.clearInterval(interval);
  }, [game?.phaseEndsAt, game?.phase]);

  useEffect(() => {
    if (utilityTab === "host" && !isHost) {
      setUtilityTab("chat");
      return;
    }
    if (utilityTab === "test" && (!isHost || !game?.isTestMode)) {
      setUtilityTab("chat");
    }
  }, [utilityTab, isHost, game?.isTestMode]);

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

  const handlePeekRoles = async () => {
    if (!game || !viewer) return;
    const confirmed = window.confirm(
      "Peeking at hidden roles will eliminate you immediately. Do you want to continue?"
    );
    if (!confirmed) {
      return;
    }
    setIsBusy(true);
    try {
      await peekAtRoles(game.id, viewer.uid);
      toast.info("You peeked at the roles and are now out of the game.");
    } catch (error) {
      toast.error((error as Error).message ?? "Unable to peek at roles");
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

  const handleSendVoiceMessage = async (audioBlob: Blob) => {
    if (!game || !viewer) {
      toast.error("You must join the lobby before sending voice messages.");
      return;
    }
    const authorName = viewer.name || user?.displayName || "Mystery Player";
    try {
      toast.loading("Uploading voice message...");
      const { url, duration } = await uploadVoiceMessage(game.id, viewer.uid, audioBlob);
      
      await postMessage(game.id, {
        gameId: game.id,
        authorUid: viewer.uid,
        authorName,
        body: "[Voice Message]",
        voiceUrl: url,
        voiceDuration: duration,
        createdAt: Date.now(),
        phase: game.phase,
      });
      
      toast.dismiss();
      toast.success("Voice message sent!");
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to send voice message");
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

  const handleVoteAs = async (voterUid: string, targetUid: string) => {
    if (!game) return;
    try {
      await submitVote(game.id, {
        targetUid,
        voterUid,
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

  const handleClearVoteAs = async (voterUid: string) => {
    if (!game) return;
    try {
      await clearVote(game.id, voterUid);
    } catch (error) {
      toast.error("Unable to clear vote");
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

  const handleAdvancePhase = async () => {
    if (!game) return;
    const nextPhase = game.phase === "day" ? "night" : game.phase === "night" ? "day" : "day";
    try {
      await advancePhase(game.id, nextPhase);
      await recordSystemMessage(game.id, `Phase advanced to ${nextPhase}.`, nextPhase);
    } catch (error) {
      toast.error((error as Error).message ?? "Unable to advance phase");
      console.error(error);
    }
  };

  const handleEliminate = async (targetUid: string) => {
    if (!game) return;
    const target = game.players.find((p) => p.uid === targetUid);
    if (!target) return;

    const confirmed = window.confirm(
      `Are you sure you want to eliminate ${target.name}? This action cannot be undone.`
    );
    if (!confirmed) return;

    setIsBusy(true);
    try {
      await eliminateDayCandidate(game.id, targetUid);
      
      // Determine if village is safer based on role
      const isMafia = target.role === "mafia";
      const safetyMessage = isMafia 
        ? "🟢 The village is safer now. A mafia member has been eliminated!"
        : "🔴 The village is in more danger. An innocent was eliminated.";
      
      await recordSystemMessage(
        game.id, 
        `${target.name} (${target.role}) was eliminated by vote. ${safetyMessage}`, 
        "day"
      );
      
      if (isMafia) {
        toast.success("Mafia eliminated!");
      } else {
        toast.error("Innocent eliminated!");
      }
    } catch (error) {
      toast.error((error as Error).message ?? "Unable to eliminate player");
      console.error(error);
    } finally {
      setIsBusy(false);
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

  const handleRestartLobby = async () => {
    if (!game || !viewer) return;
    const confirmed = window.confirm(
      "Restarting will reset player readiness, clear roles, and return to the lobby. Continue?"
    );
    if (!confirmed) {
      return;
    }
    setIsBusy(true);
    try {
      await restartLobby(game.id, viewer.uid);
      toast.success("Lobby reset. Roles will be re-assigned when the game starts.");
    } catch (error) {
      toast.error((error as Error).message ?? "Unable to restart lobby");
      console.error(error);
    } finally {
      setIsBusy(false);
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
  const timerControlsEnabled = isHost && (game.phase === "day" || game.phase === "night");
  const viewerIsDead = viewer ? !viewer.isAlive : false;
  const viewerRole = viewer?.role ?? null;
  const phaseLabel =
    game.phase === "day"
      ? "Day"
      : game.phase === "night"
      ? "Night"
      : game.phase === "lobby"
      ? "Lobby Setup"
      : "Game Over";
  
  const tabs = [
    { id: "game", label: "Game", icon: <MessageSquareIcon className="h-4 w-4" />, badge: unreadMessages },
    { id: "activity", label: "Activity", icon: <ActivityIcon className="h-4 w-4" /> },
    { id: "players", label: "Players", icon: <UsersIcon className="h-4 w-4" />, badge: game.players.filter(p => p.isAlive).length },
    { id: "settings", label: "Settings", icon: <SettingsIcon className="h-4 w-4" /> },
    ...(isHost ? [{ id: "host", label: "Host", icon: <SettingsIcon className="h-4 w-4" /> }] : []),
  ];

  const desktopUtilityTabs = [
    { value: "chat", label: "Chat", badge: unreadMessages },
    { value: "activity", label: "Activity" },
    ...(isHost ? [{ value: "host", label: "Host" }] : []),
    { value: "settings", label: "Settings" },
  ];

  // Primary action for FAB
  const getPrimaryAction = () => {
    if (game.phase === "lobby" && !viewer?.ready) {
      return { label: "Ready Up", onClick: handleReadyToggle, variant: "primary" as const };
    }
    if (game.phase === "lobby" && isHost && everyoneReady) {
      return { label: "Start Game", onClick: handleStart, variant: "primary" as const };
    }
    if (game.phase === "day" && game.dayEliminationState?.votingComplete && 
        !game.dayEliminationState.eliminated && isHost &&
        game.dayEliminationState.leadingCandidateUid) {
      return { 
        label: "Eliminate", 
        onClick: () => handleEliminate(game.dayEliminationState!.leadingCandidateUid!), 
        variant: "destructive" as const 
      };
    }
    return null;
  };

  const primaryAction = getPrimaryAction();

  const renderUtilityPanel = () => {
    switch (utilityTab) {
      case "host":
        if (!isHost) {
          return (
            <p className="text-sm text-white/60">
              Host controls are only available to the game host.
            </p>
          );
        }

        return (
          <div className="space-y-4 text-slate-100">
            {game.phase === "ended" && (
              <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-textSecondary">
                  Start a new game
                </p>
                <p className="text-sm text-textSecondary">
                  Restart the lobby with everyone currently in this room.
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  variant="outline"
                  onClick={handleRestartLobby}
                  disabled={isBusy}
                >
                  Restart with current players
                </Button>
              </div>
            )}
            {game.phase === "lobby" && (
              <Button
                size="sm"
                className="w-full"
                onClick={handleStart}
                disabled={!everyoneReady || isBusy}
                data-testid="start-game-button"
              >
                {isBusy ? "Starting..." : "Start game"}
              </Button>
            )}

            {game.phase === "day" &&
              game.dayEliminationState?.votingComplete &&
              !game.dayEliminationState.eliminated &&
              game.dayEliminationState.leadingCandidateUid && (
                <div className="space-y-2 rounded-2xl border border-red-500/40 bg-red-500/15 p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-200">
                    Elimination required
                  </p>
                  <p className="text-sm">
                    {game.dayEliminationState.leadingCandidateName} leads with {game.dayEliminationState.leadingVoteCount} votes.
                  </p>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleEliminate(game.dayEliminationState!.leadingCandidateUid!)}
                    disabled={isBusy}
                  >
                    Eliminate {game.dayEliminationState.leadingCandidateName}
                  </Button>
                </div>
              )}

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Phase controls</p>
              {game.phase !== "ended" && game.phase !== "lobby" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                  onClick={handleAdvancePhase}
                  disabled={
                    (game.phase === "day" &&
                      game.dayEliminationState?.votingComplete &&
                      !game.dayEliminationState.eliminated) ||
                    isBusy
                  }
                  data-testid="advance-phase-button"
                >
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
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Timer</p>
              {timerControlsEnabled ? (
                <div className="grid gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10"
                    onClick={() => handleExtendTimer(30000)}
                    disabled={timerBusy}
                  >
                    Extend +30s
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10"
                    onClick={handleResetTimer}
                    disabled={timerBusy}
                  >
                    Reset timer
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-white/60">
                  Timer controls unlock during day and night phases.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">Game management</p>
              <div className="grid gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                  onClick={handleRestartLobby}
                  disabled={isBusy}
                  data-testid="restart-lobby-button"
                >
                  Restart lobby
                </Button>
                {viewer?.isAlive && !game.hostPeeked && game.phase !== "lobby" && game.phase !== "ended" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full border-red-400/60 text-red-200 hover:border-red-300 hover:bg-red-500/10"
                    onClick={handlePeekRoles}
                    disabled={isBusy}
                    data-testid="peek-roles-button"
                  >
                    Peek at roles
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                  onClick={handleArchive}
                >
                  Archive game
                </Button>
              </div>
            </div>
          </div>
        );

      case "activity":
        return (
          <div className="space-y-3">
            <ActivityTimeline gameId={game.id} />
          </div>
        );

      case "settings":
        return <SettingsPanel />;

      default:
        return null;
    }
  };

  return (
    <AppShell
      headerSlot={
        <div className="flex w-full flex-wrap items-center justify-between gap-4 rounded-3xl bg-surface px-6 py-4 text-textPrimary shadow-lg ring-1 ring-border/60">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-textSecondary">
              Moonlit Mafia
            </p>
            <div className="flex flex-wrap items-baseline gap-3">
              <h1 className="text-2xl font-semibold tracking-tight text-textPrimary">{phaseLabel}</h1>
              {game.phase !== "lobby" && game.phase !== "ended" && (
                <span className="text-sm text-textSecondary">Round {game.round}</span>
              )}
              <span className="text-sm text-textSecondary">Host · {game.hostName}</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {game.isTestMode && (
              <Badge variant="outline" className="border-warning/50 bg-warning/10 text-textPrimary">
                🧪 Test Mode
              </Badge>
            )}
            <div className="flex items-center gap-2 rounded-full bg-muted/20 px-4 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-textSecondary">
                Time
              </span>
              <span className="font-mono text-lg font-semibold tracking-tight text-textPrimary">
                {phaseCountdown}
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-muted/20 px-4 py-2" data-testid="game-code-display">
              <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-textSecondary">
                Code
              </span>
              <span className="font-semibold text-textPrimary">{game.code}</span>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={copyCode}>
                Copy
              </Button>
            </div>
          </div>
        </div>
      }
    >
      {/* Game End Banner - Visible to ALL players */}
      {game.phase === "ended" && (
        <div className="sticky top-0 z-50 border-b-4 border-primary bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 p-4 shadow-lg">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-2xl font-bold text-primary sm:text-3xl">
              {game.lastAction || "🏆 Game has ended"}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Check the chat and activity timeline for complete results and role reveals.
            </p>
          </div>
        </div>
      )}

      {/* Mobile-First Tab Navigation (lg and below) */}
      <div className="lg:hidden">
        <MobileTabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
        >
          {/* Game Tab - Combined Action + Chat */}
          <div data-tab="game" className={activeTab === "game" ? "block pb-20" : "hidden"}>
            <div className="space-y-4 p-4">
              {/* Test Mode Indicator */}
              {game.isTestMode && isHost && testModeViewerUid && testModeViewerUid !== viewerId && (
                <div className="rounded-lg border border-primary/50 bg-primary/10 p-3 text-sm">
                  <p className="font-semibold text-primary">
                    🧪 Acting as: {game.players.find(p => p.uid === testModeViewerUid)?.name ?? 'Unknown Player'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use the dropdown below to switch players or return to your view
                  </p>
                </div>
              )}

              {/* Act As Dropdown - Test Mode Only */}
              {game.isTestMode && isHost && (
                <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                  <label className="text-xs font-semibold uppercase tracking-wider text-textSecondary mb-2 block">
                    Act as Player
                  </label>
                  <select
                    value={testModeViewerUid || viewerId}
                    onChange={(e) => switchActiveTestPlayer(e.target.value === viewerId ? null : e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value={viewerId}>
                      {game.players.find(p => p.uid === viewerId)?.name ?? 'You'} (Your View)
                    </option>
                    {game.players
                      .filter(p => !p.isSpectator && p.uid !== viewerId)
                      .map(player => (
                        <option key={player.uid} value={player.uid}>
                          {player.name} {player.isTestPlayer ? '(Test)' : ''} {!player.isAlive ? '💀' : ''}
                        </option>
                      ))
                    }
                  </select>
                  <p className="text-xs text-muted-foreground mt-2">
                    Switch between players to test game flow
                  </p>
                </div>
              )}
              
              {/* Action Center */}
              <ActionCenter 
                game={game} 
                viewerId={effectiveViewerId}
                onVote={async (targetUid: string) => {
                  if (effectiveViewerId === viewerId) {
                    return handleVote(targetUid);
                  }
                  return handleVoteAs(effectiveViewerId, targetUid);
                }}
                onClearVote={async () => {
                  if (effectiveViewerId === viewerId) {
                    return handleClearVote();
                  }
                  return handleClearVoteAs(effectiveViewerId);
                }}
                onReadyToggle={handleReadyToggle}
                investigationHistory={detectiveHistory}
                variant="mobile"
                actionResults={actionResults}
              />

              {game.isTestMode && !isHost && (
                <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-textSecondary">
                  Test Mode is active. The host may simulate actions to fast-forward the story.
                </div>
              )}
              
              {/* Chat Panel */}
              <div className="flex min-h-0 flex-1" style={{ height: 'max(50dvh, 400px)' }}>
                <ChatPanel
                  messages={messages}
                  onSend={handleSendMessage}
                  onSendVoice={handleSendVoiceMessage}
                  phase={game.phase}
                  disabled={!viewer}
                  autoplayEnabled={settings.autoplayVoiceMessages}
                  game={game}
                  viewerId={viewerId}
                />
              </div>
            </div>
          </div>

          {/* Players Tab */}
          <div data-tab="players" className={activeTab === "players" ? "block pb-20" : "hidden"}>
            <Card className="m-4">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Players</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {game.players.filter((p) => p.isAlive).length} alive • {game.players.length} total
                </p>
              </CardHeader>
              <CardContent>
                <PlayerListCompact
                  players={game.players}
                  viewerId={viewerId}
                  viewerIsDead={viewerIsDead}
                  revealDeadRoles={game.config.revealRolesOnDeath || game.phase === "ended"}
                  viewerRole={viewerRole}
                  isTestMode={game.isTestMode}
                  isHost={isHost}
                  selectedPlayerUid={testModeViewerUid}
                  onSelectPlayerUid={(uid) => switchActiveTestPlayer(uid, { navigateToGame: true })}
                />
              </CardContent>
            </Card>
          </div>

          {/* Settings Tab */}
          <div data-tab="settings" className={activeTab === "settings" ? "block pb-20" : "hidden"}>
            <div className="p-4">
              <SettingsPanel />
            </div>
          </div>

          {/* Host Controls Tab (if host) */}
          {isHost && (
            <div data-tab="host" className={activeTab === "host" ? "block pb-20" : "hidden"}>
              <div className="space-y-4 p-4">
                <CollapsibleSection title="Game Controls" defaultOpen={true}>
                  <div className="space-y-2">
                    {game.phase === "lobby" && (
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={handleStart}
                        disabled={!everyoneReady || isBusy}
                        data-testid="start-game-button"
                      >
                        {isBusy ? "Starting..." : "Start game"}
                      </Button>
                    )}
                    
                    {/* Day Elimination Control */}
                    {game.phase === "day" && 
                     game.dayEliminationState?.votingComplete && 
                     !game.dayEliminationState.eliminated &&
                     game.dayEliminationState.leadingCandidateUid && (
                      <div className="space-y-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
                        <p className="text-xs font-medium text-destructive">
                          Elimination Required
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {game.dayEliminationState.leadingCandidateName} has {game.dayEliminationState.leadingVoteCount} votes
                        </p>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="w-full"
                          onClick={() => handleEliminate(game.dayEliminationState!.leadingCandidateUid!)}
                          disabled={isBusy}
                        >
                          Eliminate {game.dayEliminationState.leadingCandidateName}
                        </Button>
                      </div>
                    )}
                    
                    {game.phase !== "ended" && game.phase !== "lobby" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={handleAdvancePhase}
                        disabled={
                          (game.phase === "day" && 
                           game.dayEliminationState?.votingComplete && 
                           !game.dayEliminationState.eliminated) || 
                          isBusy
                        }
                        data-testid="advance-phase-button"
                      >
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

                    {game.phase === "ended" && (
                      <div className="space-y-2 rounded-lg border border-primary/50 bg-primary/5 p-3">
                        <p className="text-sm font-semibold text-primary">
                          🏆 Game Ended
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {game.lastAction || "The game has concluded."}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={handleRestartLobby}
                          disabled={isBusy}
                        >
                          Restart with current players
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full" 
                          onClick={handleArchive}
                        >
                          Archive Game
                        </Button>
                      </div>
                    )}
                    {game.phase !== "ended" && (
                      <Button size="sm" variant="outline" className="w-full" onClick={handleArchive}>
                        Archive
                      </Button>
                    )}
                  </div>
                </CollapsibleSection>

                <CollapsibleSection title="Timer Controls">
                  {timerControlsEnabled && (
                    <div className="space-y-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => handleExtendTimer(30000)}
                        disabled={timerBusy}
                      >
                        Extend +30s
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={handleResetTimer}
                        disabled={timerBusy}
                      >
                        Reset Timer
                      </Button>
                    </div>
                  )}
                  {!timerControlsEnabled && (
                    <p className="text-sm text-muted-foreground">
                      Timer controls available during day/night phases
                    </p>
                  )}
                </CollapsibleSection>

                <CollapsibleSection title="Danger Zone">
                  <div className="space-y-2">
                    {game.phase !== "ended" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full border-destructive/50 text-destructive hover:border-destructive hover:bg-destructive/10"
                        onClick={handlePeekRoles}
                        disabled={isBusy}
                        data-testid="peek-roles-button"
                      >
                        Peek at roles
                      </Button>
                    )}
                  </div>
                </CollapsibleSection>
              </div>
            </div>
          )}

          {/* Activity Tab */}
          <div data-tab="activity" className={activeTab === "activity" ? "block pb-20" : "hidden"}>
            <div className="p-4">
              <ActivityTimeline gameId={game.id} />
            </div>
          </div>
        </MobileTabs>

        {/* Floating Action Button for primary actions */}
        {primaryAction && (
          <FloatingActionButton
            label={primaryAction.label}
            onClick={primaryAction.onClick}
            variant={primaryAction.variant}
          />
        )}
      </div>

      {/* Desktop Layout (lg and above) */}
      <div className="hidden gap-6 lg:grid lg:grid-cols-[320px,minmax(0,1fr),400px] xl:grid-cols-[340px,minmax(0,1fr),420px]">
        <PlayersPanel
          game={game}
          viewerId={viewerId}
          viewerRole={viewerRole}
          viewerIsDead={viewerIsDead || game.phase === "ended"}
          revealDeadRoles={game.config.revealRolesOnDeath || game.phase === "ended"}
          isHost={isHost}
          selectedPlayerUid={testModeViewerUid}
          onSelectPlayerUid={(uid) => switchActiveTestPlayer(uid, { navigateToGame: true })}
        />

        <GameSurface
          game={game}
          viewerId={viewerId}
          activePlayerUid={effectiveViewerId}
          investigationHistory={detectiveHistory}
          actionResults={actionResults}
          onVote={handleVote}
          onVoteAs={handleVoteAs}
          onClearVote={handleClearVote}
          onClearVoteAs={handleClearVoteAs}
          onReadyToggle={handleReadyToggle}
          onStartGame={handleStart}
        />

        <ChatActionPanel
          tabs={desktopUtilityTabs}
          activeTab={utilityTab}
          onTabChange={setUtilityTab}
          chatPanel={
            <ChatPanel
              messages={messages}
              onSend={handleSendMessage}
              onSendVoice={handleSendVoiceMessage}
              phase={game.phase}
              disabled={!viewer}
              autoplayEnabled={settings.autoplayVoiceMessages}
              game={game}
              viewerId={viewerId}
              variant="minimal"
            />
          }
          utilityPanel={utilityTab === "chat" ? null : renderUtilityPanel()}
        />
      </div>
    </AppShell>
  );
}
