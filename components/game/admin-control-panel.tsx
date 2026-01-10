"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

interface AdminControlPanelProps {
  game: MafiaGame;
}

export function AdminControlPanel({ game }: AdminControlPanelProps) {
  const [activePlayerTab, setActivePlayerTab] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

  return (
    <Card className="border-2 border-yellow-500/50 bg-yellow-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <span>🧪 Admin Control Panel</span>
          <Badge variant="outline" className="ml-auto border-yellow-500 text-yellow-600">
            Test Mode Only
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Control actions for all players. Use this to test game mechanics.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activePlayerTab ?? game.players[0]?.uid} onValueChange={setActivePlayerTab}>
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-max">
              {game.players.map((player) => (
                <TabsTrigger key={player.uid} value={player.uid}>
                  {player.name}
                  {!player.isAlive && " 💀"}
                </TabsTrigger>
              ))}
            </TabsList>
          </ScrollArea>

          {game.players.map((player) => (
            <TabsContent key={player.uid} value={player.uid} className="space-y-4">
              <div className="space-y-2 rounded-lg border bg-muted/50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Player Info</span>
                  {player.isTestPlayer && (
                    <Badge variant="secondary" className="text-xs">Test Player</Badge>
                  )}
                  {player.isHost && (
                    <Badge variant="default" className="text-xs">Admin</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Role:</span>
                    <span className="ml-2 font-semibold">
                      {player.role ? player.role.charAt(0).toUpperCase() + player.role.slice(1) : "Not assigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <span className="ml-2 font-semibold">
                      {player.isAlive ? "Alive" : "Dead"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Night Actions */}
              {game.phase === "night" && player.isAlive && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Night Actions</h4>
                  
                  {player.role === "mafia" && game.nightState?.stage === "mafia" && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Select elimination target:</p>
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
                      <p className="text-xs text-muted-foreground">Select player to protect:</p>
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
                      <p className="text-xs text-muted-foreground">Select player to investigate:</p>
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
                    <p className="text-xs text-muted-foreground">
                      This role has no night actions.
                    </p>
                  )}
                </div>
              )}

              {/* Day Actions */}
              {game.phase === "day" && player.isAlive && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Day Actions</h4>
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Vote to eliminate:</p>
                    {currentVote(player.uid) && (
                      <div className="rounded-md bg-primary/10 p-2 text-xs">
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
              )}

              {!player.isAlive && (
                <p className="text-sm text-muted-foreground">
                  This player has been eliminated and cannot perform actions.
                </p>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
