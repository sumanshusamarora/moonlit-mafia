"use client";

import { useMemo, useState } from "react";
import type { MafiaGame, NightStage } from "@/types/game";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  submitDetectiveInvestigation,
  submitDoctorSave,
  submitMafiaVote,
} from "@/lib/game/service";
import { toast } from "sonner";

interface NightActionPanelProps {
  game: MafiaGame;
  viewerId: string;
}

const NIGHT_STAGE_LABEL: Record<NightStage, string> = {
  idle: "Awaiting next phase",
  mafia: "Mafia coordination",
  doctor: "Doctor decision",
  detective: "Detective investigation",
  resolution: "Resolving night",
};

const STAGE_HINT: Record<NightStage, string> = {
  idle: "Night actions are complete.",
  mafia: "Mafia members must agree on a target before dawn.",
  doctor: "Doctor selects one living player to protect.",
  detective: "Detective investigates a single player for alignment.",
  resolution: "Applying night outcomes and moving to day.",
};

export function NightActionPanel({ game, viewerId }: NightActionPanelProps) {
  const nightState = game.nightState;
  const stage: NightStage = nightState?.stage ?? "idle";
  const viewer = game.players.find((player) => player.uid === viewerId) ?? null;
  const viewerRole = viewer?.role ?? null;
  const viewerAlive = viewer?.isAlive ?? false;
  const viewerIsDetective = viewerRole === "detective";
  const detectiveIntel = nightState?.detectiveResult;
  const shouldRenderDetectiveIntel =
    detectiveIntel !== null && detectiveIntel !== undefined && viewerIsDetective;
  const isNight = game.phase === "night";
  const shouldRenderPanel = isNight || shouldRenderDetectiveIntel;

  const [pendingTarget, setPendingTarget] = useState<string | null>(null);

  const mafiaVotes = useMemo(() => nightState?.mafiaVotes ?? [], [nightState?.mafiaVotes]);
  const mafiaVoteByViewer = useMemo(
    () => mafiaVotes.find((vote) => vote.voterUid === viewerId)?.targetUid ?? null,
    [mafiaVotes, viewerId]
  );

  const playersById = useMemo(
    () => new Map(game.players.map((player) => [player.uid, player])),
    [game.players]
  );

  const mafiaMembers = useMemo(
    () => game.players.filter((player) => player.role === "mafia"),
    [game.players]
  );

  const mafiaAssignments = useMemo(
    () =>
      mafiaMembers.map((member) => {
        const vote = mafiaVotes.find((entry) => entry.voterUid === member.uid);
        const target = vote ? playersById.get(vote.targetUid ?? "") ?? null : null;
        return {
          member,
          target,
        };
      }),
    [mafiaMembers, mafiaVotes, playersById]
  );

  if (!viewer || !shouldRenderPanel) {
    return null;
  }

  const alivePlayers = game.players.filter((player) => player.isAlive);

  const handleMafiaVote = async (targetUid: string) => {
    if (!viewerAlive) {
      toast.error("Eliminated players cannot vote.");
      return;
    }
    setPendingTarget(targetUid);
    try {
      await submitMafiaVote(game.id, viewerId, targetUid);
      toast.success("Vote submitted to the mafia.");
    } catch (error) {
      toast.error((error as Error).message ?? "Unable to submit mafia vote");
      console.error(error);
    } finally {
      setPendingTarget(null);
    }
  };

  const handleDoctorSave = async (targetUid: string) => {
    if (!viewerAlive) {
      toast.error("Eliminated players cannot act.");
      return;
    }
    setPendingTarget(targetUid);
    try {
      await submitDoctorSave(game.id, viewerId, targetUid);
      toast.success("Protection locked in for the night.");
    } catch (error) {
      toast.error((error as Error).message ?? "Unable to set protection");
      console.error(error);
    } finally {
      setPendingTarget(null);
    }
  };

  const handleDetectiveInvestigate = async (targetUid: string) => {
    if (!viewerAlive) {
      toast.error("Eliminated players cannot act.");
      return;
    }
    if (nightState?.detectiveResult) {
      toast.info("Investigation already completed this night.");
      return;
    }
    setPendingTarget(targetUid);
    try {
      await submitDetectiveInvestigation(game.id, viewerId, targetUid);
      toast.success("Investigation recorded.");
    } catch (error) {
      toast.error((error as Error).message ?? "Unable to investigate player");
      console.error(error);
    } finally {
      setPendingTarget(null);
    }
  };

  const renderMafiaStage = () => {
    const mafiaViewersTurn = viewerRole === "mafia" && viewerAlive;
    const canSeeMafiaVotes = viewerRole === "mafia";
    const lockTargetUid = nightState?.lockedTargetUid ?? null;
    const consensusReached = stage !== "mafia" && lockTargetUid !== null;
    const lockedPlayer = lockTargetUid ? playersById.get(lockTargetUid) ?? null : null;
    const mafiaTargets = game.players.filter(
      (player) => player.isAlive && player.uid !== viewerId && player.role !== "mafia"
    );

    return (
      <div className="space-y-4">
        {mafiaViewersTurn ? (
          <p className="text-sm text-muted-foreground">
            Select a living player to mark for elimination. When every mafia agrees on the same target,
            the decision will advance automatically.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Waiting for the mafia to align on a target. Daybreak will not begin until they decide.
          </p>
        )}

        {mafiaViewersTurn && (
          <div className="grid gap-2 sm:grid-cols-2">
            {mafiaTargets.map((player) => {
              const isSelected = mafiaVoteByViewer === player.uid || pendingTarget === player.uid;
              return (
                <Button
                  key={player.uid}
                  variant={isSelected ? "default" : "outline"}
                  disabled={pendingTarget !== null}
                  onClick={() => handleMafiaVote(player.uid)}
                >
                  {player.name}
                </Button>
              );
            })}
            {!mafiaTargets.length && (
              <p className="text-sm text-muted-foreground">No eligible targets remain.</p>
            )}
          </div>
        )}

        {canSeeMafiaVotes && (
          <div className="rounded-md border border-muted p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mafia alignment</p>
            <ul className="mt-2 space-y-2 text-sm">
              {mafiaAssignments.length === 0 && <li>No votes recorded yet.</li>}
              {mafiaAssignments.map(({ member, target }) => (
                <li
                  key={member.uid}
                  className="flex items-center justify-between rounded border border-muted/70 bg-muted/20 px-3 py-2"
                >
                  <span className="font-medium">{member.name}</span>
                  <Badge variant={target ? "outline" : "secondary"}>
                    {target ? target.name : "Undecided"}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        )}

        {consensusReached && lockedPlayer && (
          <p className="text-sm text-foreground">Consensus reached: {lockedPlayer.name} is marked for elimination.</p>
        )}
      </div>
    );
  };

  const renderDoctorStage = () => {
    const doctorTurn = viewerRole === "doctor" && viewerAlive;
    return (
      <div className="space-y-4">
        {doctorTurn ? (
          <p className="text-sm text-muted-foreground">
            Choose one living player to protect. If the mafia target matches your choice, the kill is prevented.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Waiting for the doctor to assign protection.</p>
        )}

        {doctorTurn && (
          <div className="grid gap-2 sm:grid-cols-2">
            {alivePlayers.map((player) => {
              const isSelected = nightState?.doctorTargetUid === player.uid || pendingTarget === player.uid;
              return (
                <Button
                  key={player.uid}
                  variant={isSelected ? "default" : "outline"}
                  disabled={pendingTarget !== null}
                  onClick={() => handleDoctorSave(player.uid)}
                >
                  {player.name}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderDetectiveStage = () => {
    const detectiveTurn = viewerRole === "detective" && viewerAlive;
    const result = nightState?.detectiveResult;

    return (
      <div className="space-y-4">
        {detectiveTurn ? (
          <p className="text-sm text-muted-foreground">
            Select a player to investigate. You will learn whether they are aligned with the mafia.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Waiting for the detective to complete the investigation.</p>
        )}

        {detectiveTurn && !result && (
          <div className="grid gap-2 sm:grid-cols-2">
            {alivePlayers
              .filter((player) => player.uid !== viewerId)
              .map((player) => (
                <Button
                  key={player.uid}
                  variant={pendingTarget === player.uid ? "default" : "outline"}
                  disabled={pendingTarget !== null}
                  onClick={() => handleDetectiveInvestigate(player.uid)}
                >
                  {player.name}
                </Button>
              ))}
          </div>
        )}

        {result && detectiveTurn && (
          <div className="rounded-md border border-primary/40 bg-primary/10 p-3">
            <p className="text-sm font-medium">
              Investigation result: {result.isMafia ? "Mafia" : "Not mafia"} —
              {" "}
              {game.players.find((player) => player.uid === result.targetUid)?.name ?? "Unknown"}
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderResolutionStage = () => (
    <p className="text-sm text-muted-foreground">
      Night outcomes are being applied. Day phase will begin momentarily.
    </p>
  );

  if (!isNight && shouldRenderDetectiveIntel && detectiveIntel) {
    return (
      <Card className="border border-primary/40 bg-primary/5" data-testid="night-action-panel">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Investigation log</CardTitle>
            <Badge variant="outline">Night intel</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Last night you investigated a player.</p>
        </CardHeader>
        <CardContent>
          <p className="text-sm">
            {game.players.find((player) => player.uid === detectiveIntel.targetUid)?.name ?? "Unknown"} is
            {" "}
            {detectiveIntel.isMafia ? "aligned with the mafia" : "not aligned with the mafia"}.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-secondary/40 bg-secondary/10" data-testid="night-action-panel">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Night actions</CardTitle>
          <Badge variant="secondary">{NIGHT_STAGE_LABEL[stage]}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{STAGE_HINT[stage]}</p>
        {!viewerAlive && (
          <p className="text-xs text-muted-foreground">You are eliminated and observing as a ghost.</p>
        )}
      </CardHeader>
      <CardContent>
        {stage === "mafia" && renderMafiaStage()}
        {stage === "doctor" && renderDoctorStage()}
        {stage === "detective" && renderDetectiveStage()}
        {stage === "resolution" && renderResolutionStage()}
        {stage === "idle" && (
          <p className="text-sm text-muted-foreground">Night actions are complete. Await the host to advance.</p>
        )}
      </CardContent>
    </Card>
  );
}
