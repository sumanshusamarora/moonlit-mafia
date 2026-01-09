"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlayerList } from "@/components/game/player-list";
import { PlayerListCompact } from "@/components/game/player-list-compact";
import { ChatPanel } from "@/components/chat/chat-panel";
import { ActionCenter } from "@/components/game/action-center";
import { ActivityTimeline } from "@/components/game/activity-timeline";
import { MobileTabs, TabPanel } from "@/components/ui/tabs-mobile";
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { useGameRoom } from "@/hooks/use-game-room";
import { useAuth } from "@/components/providers/auth-provider";
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
import { Loader2Icon, MoonIcon, SunIcon, UsersIcon, MessageSquareIcon, ActivityIcon, SettingsIcon } from "lucide-react";

export default function GameRoomPage() {
  const params = useParams<{ gameId: string }>();
  const gameId = params?.gameId;
  const { game, messages, loading } = useGameRoom(gameId ?? null);
  const { user } = useAuth();
  const [isBusy, setIsBusy] = useState(false);
  const [timerBusy, setTimerBusy] = useState(false);
  const [automationReadyEnabled, setAutomationReadyEnabled] = useState(false);
  const [activeTab, setActiveTab] = useState("action");

  const viewerId = user?.uid ?? "";
  const viewer = useMemo(() => game?.players.find((player) => player.uid === viewerId), [game, viewerId]);
  const isHost = viewer?.isHost ?? false;
  const autoGameId = game?.id ?? null;
  const autoPhase = game?.phase ?? null;
  const autoViewerId = viewer?.uid ?? null;
  const autoViewerReady = viewer?.ready ?? false;
  
  const unreadMessages = useMemo(() => {
    // Simple unread count - could be enhanced with localStorage tracking
    return messages.filter(m => m.createdAt > (Date.now() - 60000)).length;
  }, [messages]);

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
  
  const tabs = [
    { id: "action", label: "Action", icon: <ActivityIcon className="h-4 w-4" /> },
    { id: "players", label: "Players", icon: <UsersIcon className="h-4 w-4" />, badge: game.players.filter(p => p.isAlive).length },
    { id: "chat", label: "Chat", icon: <MessageSquareIcon className="h-4 w-4" />, badge: unreadMessages },
    ...(isHost ? [{ id: "host", label: "Host", icon: <SettingsIcon className="h-4 w-4" /> }] : []),
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

  return (
    <AppShell
      headerSlot={
        <div className="flex items-center gap-3">
          <Badge variant="secondary" data-testid="game-code-display">
            Code: {game.code}
          </Badge>
          <Button size="sm" variant="outline" onClick={copyCode}>
            Copy code
          </Button>
        </div>
      }
    >
      {/* Mobile-First Tab Navigation (lg and below) */}
      <div className="lg:hidden">
        <MobileTabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={setActiveTab}
        >
          {/* Action Tab */}
          <div data-tab="action" className={activeTab === "action" ? "block pb-20" : "hidden"}>
            <div className="p-4">
              <ActionCenter 
                game={game} 
                viewerId={viewerId} 
                onVote={handleVote} 
                onClearVote={handleClearVote} 
                onReadyToggle={handleReadyToggle} 
              />
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
                />
              </CardContent>
            </Card>
          </div>

          {/* Chat Tab */}
          <div data-tab="chat" className={activeTab === "chat" ? "block pb-20" : "hidden"}>
            <div className="h-[calc(100vh-140px)]">
              <ChatPanel
                messages={messages}
                onSend={handleSendMessage}
                phase={game.phase}
                disabled={!viewer}
              />
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

                <CollapsibleSection title="Activity Timeline">
                  <ActivityTimeline gameId={game.id} />
                </CollapsibleSection>
              </div>
            </div>
          )}

          {/* Activity Tab (non-host) */}
          {!isHost && (
            <div data-tab="activity" className={activeTab === "activity" ? "block pb-20" : "hidden"}>
              <div className="p-4">
                <ActivityTimeline gameId={game.id} />
              </div>
            </div>
          )}
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
      <div className="hidden space-y-6 lg:block">
        {/* New Layout: 3-column grid on desktop */}
        <section className="grid gap-6 lg:grid-cols-[300px,1fr] xl:grid-cols-[300px,1fr,380px]">
          
          {/* Left Column: Players + Host Controls (Sticky) */}
          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Players</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {game.players.filter((p) => p.isAlive).length} alive • {game.players.length} total
                </p>
              </CardHeader>
              <CardContent>
                <PlayerList
                  players={game.players}
                  viewerId={viewerId}
                  viewerIsDead={viewerIsDead || game.phase === "ended"}
                  viewerRole={viewerRole}
                  revealDeadRoles={game.config.revealRolesOnDeath || game.phase === "ended"}
                />
              </CardContent>
            </Card>
            
            {/* Host Controls */}
            {isHost && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold">Host Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
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
                  {timerControlsEnabled && (
                    <>
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
                    </>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
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
                      className="w-full border-destructive/50 text-destructive hover:border-destructive hover:bg-destructive/10"
                      onClick={handlePeekRoles}
                      disabled={isBusy}
                      data-testid="peek-roles-button"
                    >
                      Peek at roles
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
                </CardContent>
              </Card>
            )}
          </aside>

          {/* Center Column: Action Center + Activity Timeline */}
          <div className="space-y-6">
            <ActionCenter game={game} viewerId={viewerId} onVote={handleVote} onClearVote={handleClearVote} onReadyToggle={handleReadyToggle} />
            <ActivityTimeline gameId={game.id} />
          </div>

          {/* Right Column: Chat (Desktop only, hidden on mobile/tablet) */}
          <aside className="hidden space-y-6 xl:block">
            <ChatPanel
              messages={messages}
              onSend={handleSendMessage}
              phase={game.phase}
              disabled={!viewer}
            />
          </aside>
        </section>
      </div>
    </AppShell>
  );
}
