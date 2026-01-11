"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MafiaGame, GamePlayer } from "@/types/game";
import { 
  submitMafiaVote, 
  submitDoctorSave, 
  submitDetectiveInvestigation,
  skipDetectiveInvestigation,
  submitVote,
  clearVote,
} from "@/lib/game/service";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

interface AdminControlPanelProps {
  game: MafiaGame;
  variant?: "default" | "minimal";
  layout?: "tabs" | "accordion";
}

export function AdminControlPanel({ game, variant = "default", layout = "tabs" }: AdminControlPanelProps) {
  const [activePlayerTab, setActivePlayerTab] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [openPlayers, setOpenPlayers] = useState<Record<string, boolean>>({});

  // Only show in test mode
  if (!game.isTestMode) {
    return null;
  }

  const handleMafiaAction = async (playerUid: string, targetUid: string) => {
    setBusy(true);
    try {
      await submitMafiaVote(game.id, playerUid, targetUid);
      toast.success("Mafia vote submitted");
    } catch (error) {
      toast.error((error as Error).message ?? "Failed to submit mafia vote");
    } finally {
      setBusy(false);
    }
  };

  const handleDoctorAction = async (playerUid: string, targetUid: string) => {
    setBusy(true);
    try {
      await submitDoctorSave(game.id, playerUid, targetUid);
      toast.success("Doctor save submitted");
    } catch (error) {
      toast.error((error as Error).message ?? "Failed to submit doctor save");
    } finally {
      setBusy(false);
    }
  };

  const handleDetectiveAction = async (playerUid: string, targetUid: string) => {
    setBusy(true);
    try {
      await submitDetectiveInvestigation(game.id, playerUid, targetUid);
      toast.success("Detective investigation submitted");
    } catch (error) {
      toast.error((error as Error).message ?? "Failed to submit investigation");
    } finally {
      setBusy(false);
    }
  };

  const handleDetectiveSkip = async (playerUid: string) => {
    setBusy(true);
    try {
      await skipDetectiveInvestigation(game.id, playerUid);
      toast.success("Detective skipped investigation");
    } catch (error) {
      toast.error((error as Error).message ?? "Failed to skip investigation");
    } finally {
      setBusy(false);
    }
  };

  const handleDayVote = async (playerUid: string, targetUid: string) => {
    setBusy(true);
    try {
      await submitVote(game.id, {
        voterUid: playerUid,
        targetUid,
        createdAt: Date.now(),
      });
      toast.success("Vote submitted");
    } catch (error) {
      toast.error((error as Error).message ?? "Failed to submit vote");
    } finally {
      setBusy(false);
    }
  };

  const handleClearDayVote = async (playerUid: string) => {
    setBusy(true);
    try {
      await clearVote(game.id, playerUid);
      toast.success("Vote cleared");
    } catch (error) {
      toast.error((error as Error).message ?? "Failed to clear vote");
    } finally {
      setBusy(false);
    }
  };

  const alivePlayers = game.players.filter(p => p.isAlive && p.role !== null && !p.isSpectator);
  const currentVote = (playerUid: string) => 
    game.votes?.find(v => v.voterUid === playerUid);

  const containerClasses =
    variant === "minimal"
      ? "flex flex-col gap-4 rounded-2xl bg-surface p-5 text-textPrimary shadow-lg ring-1 ring-border/60"
      : "flex flex-col gap-4 rounded-xl border-2 border-yellow-500/50 bg-yellow-500/5 p-4";

  const renderPlayerSummary = (player: GamePlayer) => (
    <div className={variant === "minimal" ? "rounded-2xl bg-white/5 p-4 ring-1 ring-white/10" : "space-y-2 rounded-lg border bg-muted/50 p-3"}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("text-sm font-medium", variant === "minimal" ? "text-white" : "text-foreground")}>{player.name}</span>
        {player.isTestPlayer && (
          <Badge variant="secondary" className="text-xs">Test Player</Badge>
        )}
        {player.isHost && (
          <Badge variant="default" className="text-xs">Admin</Badge>
        )}
      </div>
      <div
        className={cn(
          "grid grid-cols-2 gap-2 text-xs",
          variant === "minimal" ? "text-white/70" : "text-muted-foreground"
        )}
      >
        <div>
          <span className={variant === "minimal" ? "opacity-60" : "text-muted-foreground"}>Role:</span>
          <span className={cn("ml-2 font-semibold", variant === "minimal" ? "text-white" : "text-foreground")}>
            {player.role ? player.role.charAt(0).toUpperCase() + player.role.slice(1) : "Not assigned"}
          </span>
        </div>
        <div>
          <span className={variant === "minimal" ? "opacity-60" : "text-muted-foreground"}>Status:</span>
          <span className={cn("ml-2 font-semibold", variant === "minimal" ? "text-white" : "text-foreground")}>
            {player.isAlive ? "Alive" : "Dead"}
          </span>
        </div>
      </div>
    </div>
  );

  const renderNightActions = (player: GamePlayer) => {
    if (game.phase !== "night" || !player.isAlive) {
      return null;
    }

    if (!player.role) {
      return (
        <p className={cn("text-xs", variant === "minimal" ? "text-white/60" : "text-muted-foreground")}>
          Role unknown. Assign roles in the lobby to enable simulation.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        <h4 className={cn("text-sm font-semibold", variant === "minimal" ? "text-white" : "text-foreground")}>Night actions</h4>

        {player.role === "mafia" && game.nightState?.stage === "mafia" && (
          <div className="space-y-2">
            <p className={cn("text-xs", variant === "minimal" ? "text-white/60" : "text-muted-foreground")}>Select elimination target:</p>
            <div className="grid gap-2">
              {alivePlayers.filter(p => p.role !== "mafia").map((target) => (
                <Button
                  key={target.uid}
                  size="sm"
                  variant="outline"
                  onClick={() => handleMafiaAction(player.uid, target.uid)}
                  disabled={busy}
                  className="justify-start"
                >
                  Eliminate {target.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {player.role === "doctor" && game.nightState?.stage === "doctor" && (
          <div className="space-y-2">
            <p className={cn("text-xs", variant === "minimal" ? "text-white/60" : "text-muted-foreground")}>Select player to protect:</p>
            <div className="grid gap-2">
              {alivePlayers.map((target) => (
                <Button
                  key={target.uid}
                  size="sm"
                  variant="outline"
                  onClick={() => handleDoctorAction(player.uid, target.uid)}
                  disabled={busy}
                  className="justify-start"
                >
                  Protect {target.name}
                </Button>
              ))}
            </div>
          </div>
        )}

        {player.role === "detective" && game.nightState?.stage === "detective" && (
          <div className="space-y-2">
            <p className={cn("text-xs", variant === "minimal" ? "text-white/60" : "text-muted-foreground")}>Select player to investigate:</p>
            <div className="grid gap-2">
              {alivePlayers.filter(p => p.uid !== player.uid).map((target) => (
                <Button
                  key={target.uid}
                  size="sm"
                  variant="outline"
                  onClick={() => handleDetectiveAction(player.uid, target.uid)}
                  disabled={busy}
                  className="justify-start"
                >
                  Investigate {target.name}
                </Button>
              ))}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDetectiveSkip(player.uid)}
                disabled={busy}
              >
                Skip Investigation
              </Button>
            </div>
          </div>
        )}

        {player.role && !["mafia", "doctor", "detective"].includes(player.role) && (
          <p className={cn("text-xs", variant === "minimal" ? "text-white/60" : "text-muted-foreground")}>
            This role has no night actions.
          </p>
        )}
      </div>
    );
  };

  const renderDayActions = (player: GamePlayer) => {
    if (game.phase !== "day" || !player.isAlive) {
      return null;
    }

    return (
      <div className="space-y-3">
        <h4 className={cn("text-sm font-semibold", variant === "minimal" ? "text-white" : "text-foreground")}>Day actions</h4>
        <div className="space-y-2">
          <p className={cn("text-xs", variant === "minimal" ? "text-white/60" : "text-muted-foreground")}>Vote to eliminate:</p>
          {currentVote(player.uid) && (
            <div className={cn(
              "rounded-xl p-3 text-xs",
              variant === "minimal" ? "bg-primary/15 text-white" : "bg-primary/10 text-primary-foreground"
            )}>
              Current vote: {alivePlayers.find(p => p.uid === currentVote(player.uid)?.targetUid)?.name}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleClearDayVote(player.uid)}
                disabled={busy}
                className="ml-2 h-6 px-2"
              >
                Clear
              </Button>
            </div>
          )}
          <div className="grid gap-2">
            {alivePlayers.filter(p => p.uid !== player.uid).map((target) => (
              <Button
                key={target.uid}
                size="sm"
                variant={currentVote(player.uid)?.targetUid === target.uid ? "default" : "outline"}
                onClick={() => handleDayVote(player.uid, target.uid)}
                disabled={busy}
                className="justify-start"
              >
                Vote {target.name}
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderEliminationNotice = (player: GamePlayer) => {
    if (player.isAlive) {
      return null;
    }

    return (
      <p className={cn("text-sm", variant === "minimal" ? "text-white/60" : "text-muted-foreground")}>
        This player has been eliminated and cannot perform actions.
      </p>
    );
  };

  const renderPlayerBody = (player: GamePlayer) => (
    <div className="space-y-4">
      {renderPlayerSummary(player)}
      {renderNightActions(player)}
      {renderDayActions(player)}
      {renderEliminationNotice(player)}
    </div>
  );

  const toggleAccordion = (playerUid: string) => {
    setOpenPlayers((prev) => ({
      ...prev,
      [playerUid]: !prev[playerUid],
    }));
  };

  return (
    <div className={containerClasses}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2
            className={cn(
              "flex items-center gap-2 text-lg font-semibold",
              variant === "minimal" ? "text-white" : "text-foreground"
            )}
          >
            <span>🧪 Admin Control Panel</span>
            <Badge variant="outline" className={variant === "minimal" ? "border-yellow-500/60 text-yellow-400" : "border-yellow-500 text-yellow-600"}>
              Test Mode Only
            </Badge>
          </h2>
          <p className={variant === "minimal" ? "mt-1 text-xs text-white/60" : "text-xs text-muted-foreground"}>
            Control actions for all players. Use this suite to simulate scenarios.
          </p>
        </div>
      </div>
      {layout === "accordion" ? (
        <div className="space-y-3">
          {game.players.map((player) => {
            const isOpen = openPlayers[player.uid] ?? player.isAlive;
            return (
              <div
                key={player.uid}
                className={cn(
                  "overflow-hidden rounded-2xl ring-1 transition",
                  variant === "minimal" ? "bg-white/5 ring-white/10" : "bg-background ring-border/40"
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(player.uid)}
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-3 text-left",
                    variant === "minimal" ? "bg-white/10 text-white" : "bg-muted/40 text-foreground"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{player.name}</span>
                    {!player.isAlive && (
                      <span className={cn("text-xs uppercase tracking-widest", variant === "minimal" ? "text-white/60" : "text-muted-foreground")}>Eliminated</span>
                    )}
                    {player.isTestPlayer && (
                      <span className={cn("text-xs uppercase tracking-widest", variant === "minimal" ? "text-white/60" : "text-muted-foreground")}>Test</span>
                    )}
                  </div>
                  <ChevronDown
                    className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")}
                    aria-hidden
                  />
                </button>
                {isOpen && (
                  <div
                    className={cn(
                      "space-y-4 border-t p-4",
                      variant === "minimal" ? "border-white/10" : "border-border/60"
                    )}
                  >
                    {renderPlayerBody(player)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <Tabs value={activePlayerTab ?? game.players[0]?.uid} onValueChange={setActivePlayerTab}>
          <ScrollArea className="w-full">
            <TabsList
              className={cn(
                "inline-flex w-max",
                variant === "minimal" ? "rounded-full bg-white/5 p-1" : "bg-transparent"
              )}
            >
              {game.players.map((player) => (
                <TabsTrigger
                  key={player.uid}
                  value={player.uid}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm",
                    variant === "minimal" ? "data-[state=active]:bg-white/20" : ""
                  )}
                >
                  {player.name}
                  {!player.isAlive && " 💀"}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>

          {game.players.map((player) => (
            <TabsContent key={player.uid} value={player.uid} className="space-y-4 pt-4">
              {renderPlayerBody(player)}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
