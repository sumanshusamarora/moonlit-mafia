"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MafiaGame } from "@/types/game";
import { ClockIcon, PlusIcon, RefreshCcwIcon } from "lucide-react";

const PHASE_LABEL: Record<MafiaGame["phase"], string> = {
  lobby: "Lobby setup",
  night: "Night actions",
  day: "Day deliberation",
  ended: "Session archived",
};

const formatDuration = (ms: number) => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

interface PhaseStatusCardProps {
  game: MafiaGame;
  isHost: boolean;
  onExtendTimer?: (milliseconds: number) => void | Promise<void>;
  onResetTimer?: () => void | Promise<void>;
  isTimerBusy?: boolean;
}

export function PhaseStatusCard({
  game,
  isHost,
  onExtendTimer,
  onResetTimer,
  isTimerBusy,
}: PhaseStatusCardProps) {
  const [now, setNow] = useState(() => Date.now());
  const phaseDurationMinutes = useMemo(() => {
    if (game.phase === "day") {
      return game.config.dayDurationMinutes;
    }
    if (game.phase === "night") {
      return game.config.nightDurationMinutes;
    }
    return null;
  }, [game.config.dayDurationMinutes, game.config.nightDurationMinutes, game.phase]);

  const timerActive =
    typeof game.phaseEndsAt === "number" && (game.phase === "day" || game.phase === "night");

  useEffect(() => {
    if (!timerActive) {
      return;
    }
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [timerActive, game.phaseEndsAt]);

  const remainingMs = timerActive ? Math.max(game.phaseEndsAt! - now, 0) : 0;
  const configuredMs = phaseDurationMinutes ? phaseDurationMinutes * 60 * 1000 : null;
  const progress = configuredMs
    ? Math.min(100, Math.max(0, ((configuredMs - remainingMs) / configuredMs) * 100))
    : undefined;
  const countdownLabel = timerActive ? formatDuration(remainingMs) : "Timer inactive";
  const countdownHint = timerActive
    ? remainingMs > 0
      ? "Time left in this phase"
      : "Timer elapsed—advance or extend the phase"
    : "Timer starts automatically once the game is in progress.";
  const hostControlsVisible = isHost && timerActive && (onExtendTimer || onResetTimer);

  return (
    <Card className="border border-primary/40 bg-primary/5">
      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="uppercase tracking-wide">
              {PHASE_LABEL[game.phase]}
            </Badge>
            <span className="text-xs text-muted-foreground">Round {Math.max(game.round, 1)}</span>
          </div>
          <CardTitle className="mt-2 flex items-center gap-2 text-2xl">
            <ClockIcon className="h-5 w-5 text-primary" aria-hidden />
            {countdownLabel}
          </CardTitle>
          <p className="text-sm text-muted-foreground">{countdownHint}</p>
          {game.lastAction && (
            <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">
              Last action: {game.lastAction}
            </p>
          )}
        </div>
        {hostControlsVisible && (
          <div className="flex flex-wrap gap-2">
            {onExtendTimer && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onExtendTimer(60_000)}
                disabled={isTimerBusy}
              >
                <PlusIcon className="mr-2 h-4 w-4" aria-hidden />
                Add 60s
              </Button>
            )}
            {onResetTimer && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={onResetTimer}
                disabled={isTimerBusy}
              >
                <RefreshCcwIcon className="mr-2 h-4 w-4" aria-hidden />
                Reset timer
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {configuredMs && (
          <div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Configured length</span>
              <span>
                {phaseDurationMinutes} min • {timerActive ? formatDuration(Math.max(configuredMs - remainingMs, 0)) : "00:00"}
                {timerActive && remainingMs > 0 ? ` elapsed` : ""}
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-muted">
              <div
                className="h-2 rounded-full bg-primary transition-[width]"
                style={{ width: `${progress ?? 0}%` }}
                aria-hidden
              />
            </div>
          </div>
        )}
        {!configuredMs && (
          <p className="text-xs text-muted-foreground">
            No default timer configured for this phase. Update the lobby settings to enable automatic pacing.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
